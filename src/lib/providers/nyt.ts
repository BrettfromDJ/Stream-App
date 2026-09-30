import "server-only";
import type { MediaSearchResult } from "@/lib/media/types";
import { ProviderError, fetchJson } from "./http";

/**
 * New York Times Books API — bestseller charts. Optional: requires NYT_API_KEY
 * (developer.nytimes.com, enable the "Books API"). Limited to ~500 requests/day, so cached for hours.
 */

interface NytBook {
  rank: number;
  title: string;
  author?: string;
  book_image?: string | null;
  primary_isbn13?: string;
  primary_isbn10?: string;
  description?: string;
  weeks_on_list?: number;
  rank_last_week?: number;
}

interface NytList {
  list_name_encoded: string;
  display_name: string;
  books: NytBook[];
}

export function isNytConfigured() {
  return Boolean(process.env.NYT_API_KEY?.trim());
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

/** NYT titles are ALL CAPS; make them read like titles. */
function titleCase(text: string) {
  return text
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/(^|[\s:(-])([a-z])/g, (m) => m.toUpperCase());
}

export interface BestsellerList {
  key: string;
  title: string;
  books: MediaSearchResult[];
}

const WANTED = [
  ["combined-print-and-e-book-fiction", "Bestsellers: Fiction"],
  ["combined-print-and-e-book-nonfiction", "Bestsellers: Nonfiction"],
  ["young-adult-hardcover", "Bestsellers: Young Adult"],
] as const;

export async function bestsellers(): Promise<BestsellerList[]> {
  const key = process.env.NYT_API_KEY?.trim();
  if (!key) throw new ProviderError("nyt", "not_configured", "NYT_API_KEY is not set");
  const data = await fetchJson<{ results?: { lists?: NytList[] } }>(
    `https://api.nytimes.com/svc/books/v3/lists/overview.json?api-key=${encodeURIComponent(key)}`,
    { provider: "nyt", revalidate: 60 * 60 * 12, timeoutMs: 9000 },
  );
  const lists = data.results?.lists ?? [];

  return WANTED.flatMap(([code, title]) => {
    const list = lists.find((l) => l.list_name_encoded === code);
    if (!list?.books.length) return [];
    const books = list.books
      .filter((b) => b.primary_isbn13 || b.primary_isbn10)
      .sort((a, b) => a.rank - b.rank)
      .map<MediaSearchResult>((b) => ({
        // Resolved to a Hardcover / Open Library ID when opened or added.
        externalId: `isbn-${b.primary_isbn13 || b.primary_isbn10}`,
        type: "book",
        title: titleCase(b.title),
        subtitle: b.author ?? null,
        year: null,
        releaseDate: null,
        artworkUrl: b.book_image?.startsWith("https://") ? b.book_image : null,
        backdropUrl: null,
        description: b.description || null,
        metadata: { authors: b.author ? [b.author] : [], weeksOnList: b.weeks_on_list ?? null, rank: b.rank, lastRank: b.rank_last_week ?? 0 },
      }));
    return [{ key: code, title, books }];
  });
}
