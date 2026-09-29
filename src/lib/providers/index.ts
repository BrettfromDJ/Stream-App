import "server-only";
import type { MediaDetail, MediaSearchResult, MediaType } from "@/lib/media/types";
import { ProviderError, safely } from "./http";
import * as tmdb from "./tmdb";
import * as ol from "./openlibrary";
import * as igdb from "./igdb";

export { ProviderError };

/** Single entry point for item detail, regardless of provider. */
export async function getMediaDetail(type: MediaType, id: string): Promise<MediaDetail> {
  switch (type) {
    case "movie":
      if (!/^\d+$/.test(id)) throw new ProviderError("tmdb", "not_found");
      return tmdb.getMovie(id);
    case "tv":
      if (!/^\d+$/.test(id)) throw new ProviderError("tmdb", "not_found");
      return tmdb.getTv(id);
    case "book":
      return ol.getBook(id);
    case "game":
      return igdb.getGame(id);
  }
}

export type SearchFilter = MediaType | "all";

export interface GroupedSearch {
  results: Record<MediaType, MediaSearchResult[]>;
  /** Providers that failed, so the UI can mention it without breaking the rest. */
  unavailable: MediaType[];
}

/** Searches every relevant provider in parallel; one failing provider never breaks the others. */
export async function searchAll(query: string, filter: SearchFilter): Promise<GroupedSearch> {
  const wants = (t: MediaType) => filter === "all" || filter === t;
  const empty: MediaSearchResult[] = [];

  const tmdbKind = filter === "movie" || filter === "tv" ? filter : "all";
  const [screen, books, games] = await Promise.allSettled([
    wants("movie") || wants("tv") ? tmdb.searchTmdb(query, tmdbKind) : Promise.resolve(empty),
    wants("book") ? ol.searchBooks(query) : Promise.resolve(empty),
    wants("game") ? igdb.searchGames(query) : Promise.resolve(empty),
  ]);

  const unavailable: MediaType[] = [];
  const value = (r: PromiseSettledResult<MediaSearchResult[]>, types: MediaType[]) => {
    if (r.status === "fulfilled") return r.value;
    for (const t of types) if (wants(t)) unavailable.push(t);
    if (!(r.reason instanceof ProviderError && r.reason.kind === "not_configured")) {
      console.warn("[search]", (r.reason as Error)?.message);
    }
    return empty;
  };

  const screenResults = value(screen, ["movie", "tv"]);
  return {
    results: {
      movie: screenResults.filter((r) => r.type === "movie"),
      tv: screenResults.filter((r) => r.type === "tv"),
      book: value(books, ["book"]),
      game: value(games, ["game"]),
    },
    unavailable,
  };
}

export interface DiscoveryRow {
  key: string;
  title: string;
  items: MediaSearchResult[];
  href?: string;
}

/** Discovery rows for Home. Rows for unconfigured or failing providers resolve to empty and are hidden. */
export const discovery = {
  trendingMovies: () => safely(tmdb.trendingMovies, []),
  popularShows: () => safely(tmdb.popularTv, []),
  trendingShows: () => safely(tmdb.trendingTv, []),
  nowPlaying: () => safely(tmdb.nowPlayingMovies, []),
  upcoming: () => safely(tmdb.upcomingMovies, []),
  airing: () => safely(tmdb.airingTv, []),
  newGames: () => safely(igdb.newGames, []),
  popularGames: () => safely(igdb.popularGames, []),
  upcomingGames: () => safely(igdb.upcomingGames, []),
  popularBooks: () => safely(ol.trendingBooks, []),
};

export const providerStatus = () => ({
  tmdb: tmdb.isTmdbConfigured(),
  igdb: igdb.isIgdbConfigured(),
  openlibrary: true,
});
