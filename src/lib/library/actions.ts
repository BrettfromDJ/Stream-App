"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { isLibraryStatus, isMediaType, type LibraryItem, type LibraryStatus, type MediaSnapshot } from "@/lib/media/types";
import { normalizeDate } from "@/lib/media/format";
import { createClient, getUser } from "@/lib/supabase/server";
import { resolveBookIsbn } from "@/lib/providers";
import { LIBRARY_COLUMNS, fromRow, type LibraryRow } from "./mappers";

export type ActionError = "preview" | "auth" | "invalid" | "not_found" | "failed";
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: ActionError; message: string };

const fail = (error: ActionError, message: string) => ({ ok: false as const, error, message });

async function context() {
  if (!isSupabaseConfigured) {
    return { err: fail("preview", "This is a preview. Connect Supabase to start saving.") };
  }
  const user = await getUser();
  if (!user) return { err: fail("auth", "Your session expired. Please sign in again.") };
  return { err: null, supabase: await createClient(), user };
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 1000) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function addToLibrary(
  snapshot: MediaSnapshot,
  status: LibraryStatus,
): Promise<ActionResult<LibraryItem>> {
  if (!isMediaType(snapshot?.type) || !isLibraryStatus(status)) return fail("invalid", "Something about that title looks off.");
  let externalId = text(snapshot.externalId, 64);
  // Bestseller-list entries arrive as "isbn-…"; store the canonical book ID instead.
  if (snapshot.type === "book" && externalId?.startsWith("isbn-")) {
    externalId = await resolveBookIsbn(externalId.slice(5));
    if (!externalId) return fail("not_found", "Couldn't find that book's details. Try adding it from Search.");
  }
  const title = text(snapshot.title, 300);
  if (!externalId || !title) return fail("invalid", "Something about that title looks off.");

  const ctx = await context();
  if (ctx.err) return ctx.err;

  let metadata: Record<string, unknown> = {};
  if (snapshot.metadata && typeof snapshot.metadata === "object") {
    const json = JSON.stringify(snapshot.metadata);
    if (json.length <= 4000) metadata = JSON.parse(json);
  }

  const { data, error } = await ctx.supabase
    .from("library_items")
    .upsert(
      {
        user_id: ctx.user.id,
        media_type: snapshot.type,
        external_id: externalId,
        title,
        subtitle: text(snapshot.subtitle, 300),
        artwork_url: httpsUrl(snapshot.artworkUrl),
        backdrop_url: httpsUrl(snapshot.backdropUrl),
        release_date: normalizeDate(snapshot.releaseDate ?? null),
        status,
        metadata,
      },
      { onConflict: "user_id,media_type,external_id" },
    )
    .select(LIBRARY_COLUMNS)
    .single();

  if (error || !data) {
    console.error("[addToLibrary]", error?.message);
    return fail("failed", "Couldn't add that right now. Try again in a moment.");
  }
  refresh();
  return { ok: true, data: fromRow(data as LibraryRow) };
}

async function updateItem(id: string, patch: Record<string, unknown>): Promise<ActionResult<LibraryItem>> {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid", "Unknown item.");
  const ctx = await context();
  if (ctx.err) return ctx.err;

  const { data, error } = await ctx.supabase
    .from("library_items")
    .update(patch)
    .eq("id", id)
    .select(LIBRARY_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[updateItem]", error.message);
    return fail("failed", "Couldn't save that change. Try again.");
  }
  if (!data) return fail("not_found", "That item is no longer in your library.");
  refresh();
  return { ok: true, data: fromRow(data as LibraryRow) };
}

export async function updateStatus(id: string, status: LibraryStatus) {
  if (!isLibraryStatus(status)) return fail("invalid", "Unknown status.");
  return updateItem(id, { status });
}

export async function setRating(id: string, rating: number | null) {
  if (rating !== null && (typeof rating !== "number" || rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0)) {
    return fail("invalid", "Ratings go from half a star to five stars.");
  }
  return updateItem(id, { rating });
}

export async function saveReview(id: string, review: string) {
  if (typeof review !== "string" || review.length > 20000) return fail("invalid", "That review is too long.");
  return updateItem(id, { review: review.trim() || null });
}

export async function removeFromLibrary(id: string): Promise<ActionResult> {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid", "Unknown item.");
  const ctx = await context();
  if (ctx.err) return ctx.err;
  const { error } = await ctx.supabase.from("library_items").delete().eq("id", id);
  if (error) return fail("failed", "Couldn't remove that right now.");
  refresh();
  return { ok: true, data: null };
}

/* ------------------------------------------------------------- episodes */

export interface EpisodeUpdate {
  show: MediaSnapshot;
  season: number;
  episodes: number[];
  watched: boolean;
  /** Episode counts per regular season (season 0 / specials excluded). */
  seasonCounts: Record<string, number>;
  ended: boolean;
}

type EpisodeProgress = Extract<NonNullable<LibraryItem["progress"]>, { kind: "episode" }>;

function computeProgress(watched: Record<string, number[]>, counts: Record<string, number>): EpisodeProgress {
  const seasons = Object.keys(counts)
    .map(Number)
    .filter((n) => n > 0 && counts[n] > 0)
    .sort((a, b) => a - b);
  const total = seasons.reduce((n, s) => n + counts[s], 0);
  let watchedCount = 0;
  let next: { season: number; episode: number } | null = null;
  let last = { season: seasons[0] ?? 1, episode: 1 };
  for (const s of seasons) {
    const set = new Set(watched[String(s)] ?? []);
    for (let e = 1; e <= counts[s]; e++) {
      if (set.has(e)) {
        watchedCount++;
        last = { season: s, episode: e };
      } else if (!next) next = { season: s, episode: e };
    }
  }
  const done = total > 0 && watchedCount >= total;
  const at = done ? last : next ?? last;
  return {
    kind: "episode",
    season: at.season,
    episode: at.episode,
    watched,
    watchedCount,
    total,
    done,
    percent: total ? Math.round((watchedCount / total) * 100) : 0,
  };
}

/** Marks episodes watched/unwatched, adding the show to the library if needed. */
export async function setEpisodes(input: EpisodeUpdate): Promise<ActionResult<LibraryItem>> {
  const { show, season, episodes, watched } = input;
  if (show?.type !== "tv" || !Number.isInteger(season) || !Array.isArray(episodes) || episodes.length > 500) {
    return fail("invalid", "Something about that episode looks off.");
  }
  const ctx = await context();
  if (ctx.err) return ctx.err;

  const { data: existing } = await ctx.supabase
    .from("library_items")
    .select(LIBRARY_COLUMNS)
    .eq("media_type", "tv")
    .eq("external_id", show.externalId)
    .maybeSingle();

  let row = existing as LibraryRow | null;
  if (!row) {
    if (!watched) return fail("not_found", "That show isn't in your library.");
    const added = await addToLibrary(show, "in_progress");
    if (!added.ok) return added;
    const { data } = await ctx.supabase.from("library_items").select(LIBRARY_COLUMNS).eq("id", added.data.id).single();
    row = data as LibraryRow;
  }

  const prev = row.progress?.kind === "episode" ? row.progress.watched ?? {} : {};
  const map: Record<string, number[]> = { ...prev };
  const set = new Set(map[String(season)] ?? []);
  for (const e of episodes) {
    if (!Number.isInteger(e) || e < 1 || e >= 10000) continue;
    if (watched) set.add(e);
    else set.delete(e);
  }
  map[String(season)] = [...set].sort((a, b) => a - b);
  if (!map[String(season)].length) delete map[String(season)];

  const counts = Object.fromEntries(
    Object.entries(input.seasonCounts ?? {}).filter(([k, v]) => /^\d+$/.test(k) && Number.isInteger(v) && v >= 0 && v < 10000),
  );
  const progress = computeProgress(map, counts);

  // Watching something moves it to "in progress"; finishing an ended show completes it.
  let status = row.status;
  if (progress.watchedCount && status === "backlog") status = "in_progress";
  if (progress.done && input.ended && status !== "completed") status = "completed";
  if (!progress.done && status === "completed" && !watched) status = "in_progress";

  return updateItem(row.id, { progress, status });
}
