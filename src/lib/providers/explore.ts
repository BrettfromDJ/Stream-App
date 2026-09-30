import "server-only";
import {
  BOOK_GENRES,
  GAME_GENRES,
  GAME_PLATFORMS,
  MOVIE_GENRES,
  TV_GENRES,
  decadeRange,
  presetFor,
  type ExploreQuery,
} from "@/lib/discover/taxonomy";
import type { MediaSearchResult } from "@/lib/media/types";
import { safely } from "./http";
import * as tmdb from "./tmdb";
import * as igdb from "./igdb";
import * as hardcover from "./hardcover";
import * as ol from "./openlibrary";

export interface ExploreResult {
  items: MediaSearchResult[];
  hasMore: boolean;
}

const EMPTY: ExploreResult = { items: [], hasMore: false };
const today = () => new Date().toISOString().slice(0, 10);

/** One page of results for an Explore query, whatever the media type. Never throws. */
export async function explore(q: ExploreQuery, services: number[] = []): Promise<ExploreResult> {
  switch (q.type) {
    case "movie":
    case "tv":
      return safely(() => exploreScreen(q, services), EMPTY);
    case "game":
      return safely(() => exploreGames(q), EMPTY);
    case "book":
      return exploreBooks(q);
  }
}

function exploreScreen(q: ExploreQuery, services: number[]) {
  const kind = q.type as "movie" | "tv";
  const preset = presetFor(q.type, q.preset);
  const raw = preset?.raw ?? {};
  const genres = kind === "movie" ? MOVIE_GENRES : TV_GENRES;
  const genre = genres.find((g) => g.slug === q.genre);
  const dateKey = kind === "movie" ? "primary_release_date" : "first_air_date";
  const minVotesDefault = kind === "movie" ? 50 : 25;

  const p: Record<string, string> = {};
  if (genre) p.with_genres = String(genre.tmdb);
  else if (raw.tmdbWithGenres) p.with_genres = raw.tmdbWithGenres;
  if (raw.tmdbWithoutGenres) p.without_genres = raw.tmdbWithoutGenres;
  if (raw.tvType != null) p.with_type = String(raw.tvType);

  const range = decadeRange(q.decade);
  if (range) {
    p[`${dateKey}.gte`] = `${range[0]}-01-01`;
    p[`${dateKey}.lte`] = `${Math.min(range[1], new Date().getFullYear())}-12-31`;
  }

  let minVotes = raw.tmdbMinVotes ?? minVotesDefault;
  let minAverage = raw.tmdbMinAverage ?? 0;
  if (q.rating === "good") minAverage = Math.max(minAverage, 7);
  if (q.rating === "great") minAverage = Math.max(minAverage, 8);
  if (minAverage) minVotes = Math.max(minVotes, raw.tmdbMinVotes ?? (kind === "movie" ? 200 : 100));
  if (q.sort === "top") minVotes = Math.max(minVotes, raw.tmdbMinVotes ?? (kind === "movie" ? 300 : 150));
  if (minAverage) p["vote_average.gte"] = String(minAverage);
  p["vote_count.gte"] = String(minVotes);
  if (raw.tmdbMaxVotes) p["vote_count.lte"] = String(raw.tmdbMaxVotes);

  if (kind === "movie" && q.length) {
    const [lo, hi] = q.length === "short" ? [60, 99] : q.length === "medium" ? [100, 140] : [141, 400];
    p["with_runtime.gte"] = String(lo);
    p["with_runtime.lte"] = String(hi);
  }

  if (q.mine && services.length) {
    p.with_watch_providers = services.join("|");
    p.watch_region = "US";
    p.with_watch_monetization_types = "flatrate|free|ads";
  }

  if (q.sort === "new") {
    p[`${dateKey}.lte`] = p[`${dateKey}.lte`] && p[`${dateKey}.lte`] < today() ? p[`${dateKey}.lte`] : today();
  }
  p.sort_by = q.sort === "top" ? "vote_average.desc" : q.sort === "new" ? `${dateKey}.desc` : "popularity.desc";

  return tmdb.discoverTmdb(kind, p, q.page);
}

function exploreGames(q: ExploreQuery) {
  const preset = presetFor(q.type, q.preset);
  const raw = preset?.raw ?? {};
  const where: string[] = [];
  const genre = GAME_GENRES.find((g) => g.slug === q.genre);
  if (genre) where.push(`${genre.igdb.field} = (${genre.igdb.ids.join(",")})`);
  const platform = GAME_PLATFORMS.find((p) => p.slug === q.platform);
  if (platform) where.push(`platforms = (${platform.ids.join(",")})`);
  const range = decadeRange(q.decade);
  if (range) {
    where.push(
      `first_release_date >= ${Date.UTC(range[0], 0, 1) / 1000} & first_release_date <= ${Date.UTC(range[1], 11, 31) / 1000}`,
    );
  }
  if (q.rating) where.push(`total_rating >= ${q.rating === "great" ? 85 : 75} & total_rating_count >= 5`);
  if (raw.igdbWhere) where.push(raw.igdbWhere);

  if (raw.igdbQuick) return igdb.quickGames(where, q.page);

  const now = Math.floor(Date.now() / 1000);
  if (q.sort === "new") where.push(`first_release_date <= ${now} & (hypes > 0 | total_rating_count > 0)`);
  if (q.sort === "top" && !raw.igdbWhere) where.push("total_rating_count >= 20");
  if (q.sort === "popular") where.push("total_rating_count > 0");
  const sort = q.sort === "top" ? "total_rating desc" : q.sort === "new" ? "first_release_date desc" : "total_rating_count desc";
  return igdb.exploreGames(where, sort, q.page);
}

async function exploreBooks(q: ExploreQuery): Promise<ExploreResult> {
  const preset = presetFor(q.type, q.preset);
  const raw = preset?.raw ?? {};
  const genre = BOOK_GENRES.find((g) => g.slug === q.genre);
  const range = decadeRange(q.decade);
  const maxPages = raw.hcMaxPages;
  const pages: [number, number] | null = q.length
    ? q.length === "short"
      ? [40, 249]
      : q.length === "medium"
        ? [250, 450]
        : [451, 3000]
    : maxPages
      ? [40, maxPages]
      : null;

  if (hardcover.isHardcoverConfigured()) {
    const res = await safely(
      () =>
        hardcover.exploreBooks({
          tags: genre?.tags,
          yearRange: range,
          minRating: raw.hcMinRating ?? (q.rating === "great" ? 4.2 : q.rating === "good" ? 3.8 : undefined),
          minRatings: raw.hcMinRatings,
          maxRatings: raw.hcMaxRatings,
          pages,
          sort: q.sort,
          page: q.page,
        }),
      null,
    );
    if (res && (res.items.length || q.page > 1)) return res;
  }
  return safely(
    () => ol.exploreBooks({ subject: genre?.subject, yearRange: range, pages, sort: q.sort, page: q.page }),
    EMPTY,
  );
}
