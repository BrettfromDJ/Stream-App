import "server-only";
import { searchBooks } from "@/lib/providers";
import { gamesAboutKeyword, searchGames } from "@/lib/providers/igdb";
import * as ol from "@/lib/providers/openlibrary";
import { aboutKeyword, searchTmdb } from "@/lib/providers/tmdb";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { chatJson } from "./openai";

export interface AiPick extends MediaSearchResult {
  reason: string;
}

export interface AiSearchResult {
  /** One friendly sentence about what was found. */
  summary: string;
  /** The model's picks, grouped into themed sections ("Essential Reads", "True Stories"…). */
  sections: { title: string; items: AiPick[] }[];
  /** Catalog titles tagged with the request's topics, whatever they're named. */
  related: { title: string; items: MediaSearchResult[] }[];
  /** Suggestions that couldn't be matched to a catalog entry (shown as text, tap to search). */
  unmatched: { type: MediaType; title: string; creator: string | null; reason: string }[];
}

interface ModelPick {
  type: MediaType;
  title: string;
  year: number | null;
  creator: string | null;
  reason: string;
}

interface ModelOutput {
  summary: string;
  sections: { title: string; picks: ModelPick[] }[];
  topics: { type: MediaType; terms: string[] }[];
}

const PICK = {
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
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sections", "topics"],
  properties: {
    summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "picks"],
        properties: { title: { type: "string" }, picks: { type: "array", items: PICK } },
      },
    },
    topics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "terms"],
        properties: {
          type: { type: "string", enum: ["movie", "tv", "book", "game"] },
          terms: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const NOUN: Record<MediaType | "all", string> = {
  all: "movies, TV shows, books or video games (whichever fit the request; mix them when it's open-ended)",
  movie: "movies, unless the request clearly asks for another medium (then follow the request)",
  tv: "TV shows, unless the request clearly asks for another medium (then follow the request)",
  book: "books, unless the request clearly asks for another medium (then follow the request)",
  game: "video games, unless the request clearly asks for another medium (then follow the request)",
};

const SYSTEM = `You are the discovery engine inside a personal media tracker for movies, TV, books and video games.
The user describes what they want — a subject, theme, mood, setting or comparison. Recommend titles by what they are ABOUT
(plot, setting, subject matter, themes), not by words in their titles. Example: "a book about gold mining" should include
novels and nonfiction set in gold rushes, mining towns and prospecting, even if "gold" isn't in the title.

Return:
- summary: one warm sentence (max 22 words) describing the selection.
- sections: 3 or 4 themed groups that make the results easy to browse, e.g. "Essential Reads", "Novels", "True Stories",
  "Recent Releases", "Hidden Gems", "For Younger Readers", "On Screen". Section titles: 1-4 words, Title Case.
  Each section has 6 to 8 picks; 24-30 picks in total, no title repeated. Put the strongest, most relevant section first.
- each pick: a real, published title with its exact official title as listed on TMDB / Goodreads / IGDB
  (no invented subtitles; individual books/films, not series names), its year, creator (author for books, director
  for movies, creator or network for TV, studio for games), and reason: one short sentence (max 18 words) explaining
  what it's about and why it fits. No spoilers.
- topics: for each medium you recommended, 1 to 3 short subject terms as a librarian or tagger would use them
  (e.g. "gold mining", "gold rush", "prospecting"). Lowercase, 1-3 words each. These are used to find more titles by subject.

Favor well-reviewed, widely available titles, mixed with a few lesser-known gems. Never invent titles.`;

const IDENTIFY = `
This request describes ONE specific title the user is trying to name (plot details, characters, a scene).
- The FIRST section must be titled "Best Match" and contain 1 to 5 candidates that fit the specific details,
  most likely first. Check each candidate against every detail given (who the character is, what happens, the setting);
  prefer the title that fits all of them. People often misremember details (which character had a trait, names,
  the year, small plot points): weigh the overall match and allow one or two details to be wrong or swapped
  between characters; if a candidate fits except for a swapped detail, say so in its reason.
  Include recent releases and mid-list genre fiction (e.g. contemporary romance),
  not just famous titles. In each reason, name the matching details.
- Then 2 or 3 more sections of similar titles (e.g. "If You Liked That", "Similar Romances").`;

/** "Find the book where…", "what's that movie about…": naming a title rather than browsing a topic. */
export function isIdentifyQuery(q: string) {
  return /\b(the|a|that|this)\s+(book|novel|movie|film|show|series|game|story)\s+(where|in which|when|that|about a|about an|with the)\b|\b(what'?s|what is) (the name|it called|that)\b|\b(can'?t|cannot|don'?t) remember\b|\bforgot\b|\bname of\b/i.test(
    q,
  );
}

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
  const scored = results
    .filter((r) => r.type === pick.type && r.artworkUrl)
    .map((r) => {
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

/** Resolves with null instead of waiting past `ms`. */
const within = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

const ABOUT_NOUN: Record<MediaType, string> = { movie: "Movies", tv: "Shows", book: "Books", game: "Games" };

async function aboutTopic(type: MediaType, term: string): Promise<MediaSearchResult[]> {
  try {
    if (type === "book") return await ol.booksAboutSubject(term);
    if (type === "game") return await gamesAboutKeyword(term);
    return await aboutKeyword(type, term);
  } catch {
    return [];
  }
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Natural-language discovery: the model curates themed sections and names the topics; every pick is
 * looked up in the real catalogs (so it has artwork and opens the normal page), and the topics pull in
 * more titles tagged with that subject.
 */
export async function aiSearch(query: string, filter: MediaType | "all"): Promise<AiSearchResult> {
  const identify = isIdentifyQuery(query);
  const out = await chatJson<ModelOutput>({
    system: identify ? SYSTEM + IDENTIFY : SYSTEM,
    user: `Request: ${query}\nRecommend ${NOUN[filter]}.`,
    schemaName: "media_discovery",
    schema: SCHEMA,
    timeoutMs: identify ? 45_000 : 40_000,
    tier: identify ? "smart" : "fast",
  });

  // The filter chip is a preference; words in the request ("a book about…") win when they disagree.
  const allPicks = (out.sections ?? []).flatMap((s) => s.picks ?? []);
  const keep = (t: MediaType) => filter === "all" || !allPicks.some((p) => p.type === filter) || t === filter;

  const sectionsIn = (out.sections ?? [])
    .map((s) => ({ title: s.title, picks: (s.picks ?? []).filter((p) => keep(p.type)).slice(0, 10) }))
    .filter((s) => s.picks.length);
  const topicsIn = (out.topics ?? [])
    .filter((t) => keep(t.type))
    .flatMap((t) => (t.terms ?? []).slice(0, 2).map((term) => ({ type: t.type, term: term.trim().toLowerCase() })))
    .filter((t) => t.term.length >= 3)
    .slice(0, 6);

  // Look everything up at once; a slow lookup gives up after 12s rather than holding up the page.
  const [resolvedSections, topicResults] = await Promise.all([
    Promise.all(sectionsIn.map((s) => Promise.all(s.picks.map((p) => within(resolve(p), 12_000))))),
    Promise.all(topicsIn.map((t) => within(aboutTopic(t.type, t.term), 12_000))),
  ]);

  const seen = new Set<string>();
  const keyOf = (m: MediaSearchResult) => `${m.type}:${m.externalId}`;
  const unmatched: AiSearchResult["unmatched"] = [];
  const sections = sectionsIn
    .map((s, i) => ({
      title: s.title,
      items: resolvedSections[i].filter((p, j): p is AiPick => {
        if (!p) {
          const { type, title, creator, reason } = s.picks[j];
          unmatched.push({ type, title, creator, reason });
          return false;
        }
        if (seen.has(keyOf(p))) return false;
        seen.add(keyOf(p));
        return true;
      }),
    }))
    .filter((s) => s.items.length);

  // Topic rows: merge each medium's terms, skip anything already picked.
  const byType = new Map<MediaType, { terms: string[]; items: MediaSearchResult[] }>();
  topicsIn.forEach((t, i) => {
    const entry = byType.get(t.type) ?? { terms: [], items: [] };
    entry.terms.push(t.term);
    for (const m of topicResults[i] ?? []) {
      if (seen.has(keyOf(m))) continue;
      seen.add(keyOf(m));
      entry.items.push(m);
    }
    byType.set(t.type, entry);
  });
  const related = [...byType.entries()]
    .filter(([, e]) => e.items.length >= 3)
    .map(([type, e]) => ({ title: `More ${ABOUT_NOUN[type]} About ${titleCase(e.terms[0])}`, items: e.items.slice(0, 30) }));

  if (unmatched.length) console.warn("[ai-search] unmatched:", unmatched.map((u) => `${u.type}:${u.title}`).join(", "));
  return { summary: out.summary ?? "", sections, related, unmatched };
}
