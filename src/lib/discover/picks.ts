import "server-only";
import { getLibrary } from "@/lib/library/queries";
import { explore } from "@/lib/providers/explore";
import { getUser } from "@/lib/supabase/server";
import type { LibraryItem, MediaSearchResult, MediaType } from "@/lib/media/types";
import { MOVIE_GENRES, TV_GENRES, genreSlugForName, genresFor, type ExploreSort } from "./taxonomy";

/** Genre slugs for one media type, weighted by how much the user liked each title. */
function genreSlugsOf(item: LibraryItem): string[] {
  const t = item.mediaType;
  const names = Array.isArray(item.metadata.genres) ? (item.metadata.genres as string[]) : [];
  const fromNames = names.map((n) => genreSlugForName(t, n)).filter((s): s is string => Boolean(s));
  const ids = Array.isArray(item.metadata.genreIds) ? (item.metadata.genreIds as number[]) : [];
  const table = t === "movie" ? MOVIE_GENRES : t === "tv" ? TV_GENRES : [];
  const fromIds = ids.map((id) => table.find((g) => g.tmdb === id)?.slug).filter((s): s is string => Boolean(s));
  return [...new Set([...fromNames, ...fromIds])];
}

export interface Taste {
  type: MediaType;
  genres: { slug: string; label: string; score: number }[];
}

/** What the user gravitates to, per media type, from ratings (and statuses as a weaker signal). */
export async function tasteProfile(types: MediaType[]): Promise<Taste[]> {
  const { items } = await getLibrary();
  return types.map((type) => {
    const scores = new Map<string, number>();
    for (const item of items) {
      if (item.mediaType !== type) continue;
      const weight =
        item.rating != null ? (item.rating >= 4 ? 3 : item.rating >= 3 ? 1 : -2) : item.status === "dropped" ? -1 : item.status === "completed" ? 1.5 : 1;
      for (const slug of genreSlugsOf(item)) scores.set(slug, (scores.get(slug) ?? 0) + weight);
    }
    const genres = [...scores.entries()]
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([slug, score]) => ({ slug, score, label: genresFor(type).find((g) => g.slug === slug)?.label ?? slug }));
    return { type, genres };
  });
}

/** A pool of well-regarded titles the user doesn't have, leaning into their taste. */
export async function picks(types: MediaType[], { count = 20 } = {}): Promise<MediaSearchResult[]> {
  const [taste, library, user] = await Promise.all([tasteProfile(types), getLibrary(), getUser()]);
  const have = new Set(library.items.map((i) => `${i.mediaType}:${i.externalId}`));
  const services = user?.services ?? [];

  const queries = types.flatMap((type) => {
    const liked = taste.find((t) => t.type === type)?.genres ?? [];
    const genres = liked.length ? liked.slice(0, 3).map((g) => g.slug) : [undefined];
    return genres.map((genre, i) => {
      const sort: ExploreSort = i === 0 ? "top" : "popular";
      return explore({ type, genre, sort, rating: "good", page: 1 }, services);
    });
  });
  const results = (await Promise.all(queries)).map((r) => r.items);

  // Interleave the lists so one genre doesn't dominate.
  const merged: MediaSearchResult[] = [];
  const seen = new Set<string>();
  for (let i = 0; merged.length < count * 2 && results.some((r) => r[i]); i++) {
    for (const list of results) {
      const item = list[i];
      if (!item || !item.artworkUrl) continue;
      const key = `${item.type}:${item.externalId}`;
      if (have.has(key) || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.slice(0, count);
}
