import "server-only";
import type { MediaDetail, MediaSearchResult, MediaType } from "@/lib/media/types";
import { ProviderError, safely } from "./http";
import * as tmdb from "./tmdb";
import * as ol from "./openlibrary";
import * as hardcover from "./hardcover";
import * as nyt from "./nyt";
import * as steam from "./steam";
import * as igdb from "./igdb";

export { ProviderError };

/** Author pages: numeric IDs are Hardcover authors; "OL…A" IDs are Open Library authors. */
export async function getAuthor(id: string) {
  return /^\d+$/.test(id) ? hardcover.getAuthor(id) : ol.getAuthor(id);
}

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
      // Numeric IDs are Hardcover books; "OL…W" IDs are Open Library works.
      return /^\d+$/.test(id) ? hardcover.getBook(id) : ol.getBook(id);
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
    wants("book") ? searchBooks(query) : Promise.resolve(empty),
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
  popularBooks: () => safely(popularBooks, []),
};

export const providerStatus = () => ({
  tmdb: tmdb.isTmdbConfigured(),
  igdb: igdb.isIgdbConfigured(),
  openlibrary: true,
  hardcover: hardcover.isHardcoverConfigured(),
});

/** Books: Hardcover when configured, Open Library as the fallback. */
async function searchBooks(query: string) {
  if (hardcover.isHardcoverConfigured()) {
    try {
      return await hardcover.searchBooks(query);
    } catch (err) {
      console.warn("[books] Hardcover search failed, using Open Library:", (err as Error).message);
    }
  }
  return ol.searchBooks(query);
}

async function popularBooks() {
  if (hardcover.isHardcoverConfigured()) {
    const books = await safely(hardcover.popularBooks, []);
    if (books.length) return books;
  }
  return ol.trendingBooks();
}

/* ---------------------------------------------------------------- browse tabs */


export type { GamesHub } from "./igdb";
export type { BooksHub } from "./hardcover";
export type { BestsellerList } from "./nyt";

const EMPTY_GAMES: igdb.GamesHub = {
  featured: [],
  countdown: [],
  justReleased: [],
  topThisYear: [],
  anticipated: [],
  allTime: [],
  rpg: [],
  indie: [],
  shooter: [],
};

const EMPTY_STEAM: steam.SteamCharts = { topSellers: [], mostPlayed: [], newReleases: [], deals: [], comingSoon: [] };

const EMPTY_BOOKS: hardcover.BooksHub = { newReleases: [], anticipated: [], topThisYear: [], allTime: [] };

/** Every loader resolves (never rejects) so a failing source just hides its rows. */
export const browse = {
  watch: {
    trendingToday: () => safely(tmdb.trendingAllToday, []),
    topMovies: () => safely(tmdb.trendingMovies, []),
    topShows: () => safely(tmdb.trendingTv, []),
    newToStreaming: () => safely(tmdb.newToStreaming, []),
    inTheaters: () => safely(tmdb.nowPlayingMovies, []),
    comingSoon: () => safely(tmdb.comingSoonMovies, []),
    airing: () => safely(tmdb.airingTv, []),
    topRatedMovies: () => safely(tmdb.topRatedMovies, []),
    topRatedShows: () => safely(tmdb.topRatedTv, []),
    movieGenre: (id: number) => safely(() => tmdb.moviesByGenre(id), []),
    tvGenre: (id: number) => safely(() => tmdb.tvByGenre(id), []),
    recommendations: (kind: "movie" | "tv", id: string) => safely(() => tmdb.recommendationsFor(kind, id), []),
    providers: () => safely(tmdb.watchProviders, []),
    onServices: (ids: number[], sort: "popular" | "new" = "popular") => safely(() => tmdb.popularOnServices(ids, sort), []),
  },
  games: {
    hub: () => safely(igdb.gamesHub, EMPTY_GAMES),
    popularNow: () => safely(igdb.popularNow, []),
    similarTo: (id: string) => safely(() => igdb.similarTo(id), []),
    // Steam rows need IGDB for matching, so skip them when IGDB isn't configured.
    steam: () =>
      igdb.isIgdbConfigured()
        ? safely(steam.steamCharts, EMPTY_STEAM)
        : Promise.resolve(EMPTY_STEAM),
  },
  books: {
    hub: () => (hardcover.isHardcoverConfigured() ? safely(hardcover.booksHub, EMPTY_BOOKS) : Promise.resolve(EMPTY_BOOKS)),
    trending: async () => {
      if (hardcover.isHardcoverConfigured()) {
        const books = await safely(hardcover.trendingBooks, []);
        if (books.length) return books;
      }
      return safely(ol.trendingBooks, []);
    },
    trendingToday: () => safely(ol.trendingToday, []),
    bestsellers: () => (nyt.isNytConfigured() ? safely(nyt.bestsellers, []) : Promise.resolve([])),
    /** Genre rows: Hardcover's recent most-read, falling back to Open Library's recent most-read. */
    genres: async (): Promise<Record<hardcover.BookGenre, MediaSearchResult[]>> => {
      const hc = hardcover.isHardcoverConfigured()
        ? await safely(hardcover.genreBooks, null)
        : null;
      const olSubject: Record<hardcover.BookGenre, string> = {
        fantasy: "fantasy",
        scifi: "science fiction",
        thriller: "thrillers",
        romance: "romance",
      };
      const keys = Object.keys(olSubject) as hardcover.BookGenre[];
      const lists = await Promise.all(
        keys.map((k) =>
          hc && hc[k].length >= 8 ? hc[k] : safely(() => ol.recentBooksBySubject(olSubject[k]), hc?.[k] ?? []),
        ),
      );
      return Object.fromEntries(keys.map((k, i) => [k, lists[i]])) as Record<hardcover.BookGenre, MediaSearchResult[]>;
    },
  },
};

/** Bestseller entries carry ISBNs; map them to a Hardcover (preferred) or Open Library ID. */
export async function resolveBookIsbn(isbn: string): Promise<string | null> {
  if (!/^[0-9Xx]{10,13}$/.test(isbn)) return null;
  if (hardcover.isHardcoverConfigured()) {
    const id = await safely(() => hardcover.bookIdForIsbn(isbn), null);
    if (id) return id;
  }
  return safely(() => ol.workIdForIsbn(isbn), null);
}
