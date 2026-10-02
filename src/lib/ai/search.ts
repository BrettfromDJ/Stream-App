import "server-only";
import { searchBooks } from "@/lib/providers";
import { searchGames } from "@/lib/providers/igdb";
import * as ol from "@/lib/providers/openlibrary";
import { searchTmdb } from "@/lib/providers/tmdb";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { chatJson } from "./openai";

export interface AiPick extends MediaSearchResult {
  reason: string;
}

export interface AiSearchResult {
  /** One friendly sentence about what was found. */
  summary: string;
  picks: AiPick[];
}

interface ModelPick {
  type: MediaType;
  title: string;
  year: number | null;
  creator: string | null;
  reason: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "picks"],
  properties: {
    summary: { type: "string" },
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "year", "creator", "reason"],
        properties: {
          type: { type: "string", enum: ["movie", "tv", "book", "game"] },
          title: { type: "string" },
          year: { type: ["integer", "null"] },
          creator: { type: ["string", "null"] },
          reason: { type: "string" },
        },
      },
    },
  },
};

const NOUN: Record<MediaType | "all", string> = {
  all: "movies, TV shows, books or video games (whichever fit the request; mix them when it's open-ended)",
  movie: "movies only",
  tv: "TV shows only",
  book: "books only",
  game: "video games only",
};

const SYSTEM = `You are the recommendation engine inside a personal media tracker.
Turn the user's request into specific, real, published titles that exist in mainstream databases (TMDB, Hardcover/Goodreads, IGDB).
Rules:
- Only real titles with their exact official title (no subtitles invented, no series names when a single book/film is meant).
- Prefer widely loved and well-reviewed picks, with a few less obvious gems.
- If the user names a medium ("a book", "games"), return only that medium.
- creator = author (books), director (movies), creator/network (TV) or studio (games).
- reason: one short sentence (max 18 words) on why it fits the request. No spoilers.
- summary: one short, warm sentence describing the picks (max 20 words).
- Return 8 to 10 picks, best first.`;

/** Normalizes titles for loose matching ("The Book Thief" ≈ "Book Thief, The"). */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function bestMatch(results: MediaSearchResult[], pick: ModelPick): MediaSearchResult | null {
  const want = norm(pick.title);
  const candidates = results.filter((r) => r.type === pick.type && r.artworkUrl);
  const scored = candidates.map((r) => {
    const got = norm(r.title);
    let score = got === want ? 3 : got.startsWith(want) || want.startsWith(got) ? 2 : got.includes(want) ? 1 : 0;
    if (score && pick.year && r.year) score += Math.abs(r.year - pick.year) <= 1 ? 1.5 : -0.5;
    return { r, score };
  });
  const top = scored.sort((a, b) => b.score - a.score)[0];
  return top && top.score >= 1 ? top.r : null;
}

async function resolve(pick: ModelPick): Promise<AiPick | null> {
  try {
    let match: MediaSearchResult | null = null;
    if (pick.type === "book") {
      // Title + author first; then title alone; then Open Library, which knows more older books.
      const attempts = [
        () => searchBooks(pick.creator ? `${pick.title} ${pick.creator}` : pick.title),
        () => searchBooks(pick.title),
        () => ol.searchBooks(pick.title, 10),
      ];
      for (const attempt of attempts) {
        match = bestMatch(await attempt().catch(() => []), pick);
        if (match) break;
      }
    } else {
      match = bestMatch(pick.type === "game" ? await searchGames(pick.title) : await searchTmdb(pick.title, pick.type), pick);
    }
    return match ? { ...match, reason: pick.reason } : null;
  } catch {
    return null;
  }
}

/**
 * Natural-language search: the model suggests titles, then each is looked up in the real
 * catalogs so every result has proper artwork and opens the normal detail page.
 */
export async function aiSearch(query: string, filter: MediaType | "all"): Promise<AiSearchResult> {
  const out = await chatJson<{ summary: string; picks: ModelPick[] }>({
    system: SYSTEM,
    user: `Request: ${query}\nReturn ${NOUN[filter]}.`,
    schemaName: "media_picks",
    schema: SCHEMA,
  });
  const picks = (out.picks ?? []).filter((p) => filter === "all" || p.type === filter).slice(0, 12);
  const resolved = await Promise.all(picks.map(resolve));
  const seen = new Set<string>();
  return {
    summary: out.summary ?? "",
    picks: resolved.filter((p): p is AiPick => {
      if (!p) return false;
      const key = `${p.type}:${p.externalId}`;
      return !seen.has(key) && Boolean(seen.add(key));
    }),
  };
}
