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
