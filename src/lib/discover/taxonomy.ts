import type { MediaType } from "@/lib/media/types";

/**
 * Shared vocabulary for Explore pages, genre/mood tiles and collections.
 * Plain data (safe for client and server). Provider-specific IDs live here so the UI can stay generic.
 */

export type ExploreSort = "popular" | "top" | "new";
export type ExploreDecade = "2020s" | "2010s" | "2000s" | "1990s" | "older";
export type ExploreRating = "good" | "great";
export type ExploreLength = "short" | "medium" | "long";

export interface ExploreQuery {
  type: MediaType;
  genre?: string;
  preset?: string;
  sort: ExploreSort;
  decade?: ExploreDecade;
  rating?: ExploreRating;
  length?: ExploreLength;
  platform?: string;
  /** Only titles streaming on the viewer's services (movies & TV). */
  mine?: boolean;
  page: number;
}

export interface Genre {
  slug: string;
  label: string;
  /** Names providers use, for mapping library metadata back to a genre. */
  names: string[];
  hue: number;
}

/* ------------------------------------------------------------ genres */

export const MOVIE_GENRES: (Genre & { tmdb: number })[] = [
  { slug: "action", label: "Action", tmdb: 28, names: ["Action"], hue: 12 },
  { slug: "comedy", label: "Comedy", tmdb: 35, names: ["Comedy"], hue: 45 },
  { slug: "scifi", label: "Sci-Fi", tmdb: 878, names: ["Science Fiction"], hue: 200 },
  { slug: "drama", label: "Drama", tmdb: 18, names: ["Drama"], hue: 330 },
  { slug: "thriller", label: "Thriller", tmdb: 53, names: ["Thriller"], hue: 0 },
  { slug: "horror", label: "Horror", tmdb: 27, names: ["Horror"], hue: 350 },
  { slug: "animation", label: "Animation", tmdb: 16, names: ["Animation"], hue: 170 },
  { slug: "crime", label: "Crime", tmdb: 80, names: ["Crime"], hue: 220 },
  { slug: "romance", label: "Romance", tmdb: 10749, names: ["Romance"], hue: 320 },
  { slug: "fantasy", label: "Fantasy", tmdb: 14, names: ["Fantasy"], hue: 270 },
  { slug: "mystery", label: "Mystery", tmdb: 9648, names: ["Mystery"], hue: 250 },
  { slug: "documentary", label: "Documentary", tmdb: 99, names: ["Documentary"], hue: 90 },
  { slug: "adventure", label: "Adventure", tmdb: 12, names: ["Adventure"], hue: 30 },
  { slug: "family", label: "Family", tmdb: 10751, names: ["Family"], hue: 140 },
  { slug: "history", label: "History", tmdb: 36, names: ["History"], hue: 35 },
  { slug: "war", label: "War", tmdb: 10752, names: ["War"], hue: 60 },
  { slug: "music", label: "Music", tmdb: 10402, names: ["Music"], hue: 290 },
  { slug: "western", label: "Western", tmdb: 37, names: ["Western"], hue: 25 },
];

export const TV_GENRES: (Genre & { tmdb: number })[] = [
  { slug: "drama", label: "Drama", tmdb: 18, names: ["Drama"], hue: 330 },
  { slug: "comedy", label: "Comedy", tmdb: 35, names: ["Comedy"], hue: 45 },
  { slug: "scifi", label: "Sci-Fi & Fantasy", tmdb: 10765, names: ["Sci-Fi & Fantasy"], hue: 200 },
  { slug: "crime", label: "Crime", tmdb: 80, names: ["Crime"], hue: 220 },
  { slug: "action", label: "Action & Adventure", tmdb: 10759, names: ["Action & Adventure"], hue: 12 },
  { slug: "animation", label: "Animation", tmdb: 16, names: ["Animation"], hue: 170 },
  { slug: "mystery", label: "Mystery", tmdb: 9648, names: ["Mystery"], hue: 250 },
  { slug: "documentary", label: "Documentary", tmdb: 99, names: ["Documentary"], hue: 90 },
  { slug: "reality", label: "Reality", tmdb: 10764, names: ["Reality"], hue: 300 },
  { slug: "family", label: "Family", tmdb: 10751, names: ["Family"], hue: 140 },
  { slug: "kids", label: "Kids", tmdb: 10762, names: ["Kids"], hue: 110 },
  { slug: "war", label: "War & Politics", tmdb: 10768, names: ["War & Politics"], hue: 60 },
  { slug: "western", label: "Western", tmdb: 37, names: ["Western"], hue: 25 },
];

export const BOOK_GENRES: (Genre & { tags: string[]; subject: string })[] = [
  { slug: "fantasy", label: "Fantasy", tags: ["Fantasy"], subject: "fantasy", names: ["Fantasy"], hue: 270 },
  { slug: "romance", label: "Romance", tags: ["Romance"], subject: "romance", names: ["Romance"], hue: 320 },
  { slug: "thriller", label: "Mystery & Thriller", tags: ["Thriller", "Mystery", "Mystery & Thriller"], subject: "thrillers", names: ["Thriller", "Mystery", "Mystery & Thriller", "Crime"], hue: 0 },
  { slug: "scifi", label: "Sci-Fi", tags: ["Science Fiction", "Science fiction"], subject: "science fiction", names: ["Science Fiction", "Science fiction"], hue: 200 },
  { slug: "literary", label: "Literary Fiction", tags: ["Literary Fiction", "Literary fiction"], subject: "literary fiction", names: ["Literary Fiction", "Literary fiction"], hue: 35 },
  { slug: "historical", label: "Historical Fiction", tags: ["Historical Fiction", "Historical fiction"], subject: "historical fiction", names: ["Historical Fiction", "Historical fiction"], hue: 25 },
  { slug: "horror", label: "Horror", tags: ["Horror"], subject: "horror", names: ["Horror"], hue: 350 },
  { slug: "ya", label: "Young Adult", tags: ["Young Adult"], subject: "young adult fiction", names: ["Young Adult"], hue: 150 },
  { slug: "nonfiction", label: "Nonfiction", tags: ["Nonfiction", "Non-Fiction", "Non-fiction"], subject: "nonfiction", names: ["Nonfiction", "Non-Fiction", "Non-fiction"], hue: 90 },
  { slug: "memoir", label: "Memoir & Biography", tags: ["Memoir", "Biography", "Autobiography"], subject: "biography", names: ["Memoir", "Biography", "Autobiography"], hue: 55 },
  { slug: "history", label: "History", tags: ["History"], subject: "history", names: ["History"], hue: 40 },
  { slug: "selfhelp", label: "Self-Help", tags: ["Self Help", "Self-Help", "Personal Development"], subject: "self-help", names: ["Self Help", "Self-Help"], hue: 170 },
  { slug: "science", label: "Science", tags: ["Science"], subject: "science", names: ["Science"], hue: 190 },
  { slug: "graphic", label: "Graphic Novels", tags: ["Graphic Novels", "Comics", "Graphic novels"], subject: "graphic novels", names: ["Graphic Novels", "Comics"], hue: 280 },
];

export const GAME_GENRES: (Genre & { igdb: { field: "genres" | "themes" | "game_modes"; ids: number[] } })[] = [
  { slug: "rpg", label: "RPG", igdb: { field: "genres", ids: [12] }, names: ["Role-playing (RPG)"], hue: 270 },
  { slug: "adventure", label: "Adventure", igdb: { field: "genres", ids: [31] }, names: ["Adventure"], hue: 30 },
  { slug: "shooter", label: "Shooter", igdb: { field: "genres", ids: [5] }, names: ["Shooter"], hue: 0 },
  { slug: "indie", label: "Indie", igdb: { field: "genres", ids: [32] }, names: ["Indie"], hue: 150 },
  { slug: "openworld", label: "Open World", igdb: { field: "themes", ids: [38] }, names: ["Open world"], hue: 110 },
  { slug: "strategy", label: "Strategy", igdb: { field: "genres", ids: [15, 11, 16] }, names: ["Strategy", "Real Time Strategy (RTS)", "Turn-based strategy (TBS)"], hue: 220 },
  { slug: "platformer", label: "Platformer", igdb: { field: "genres", ids: [8] }, names: ["Platform"], hue: 45 },
  { slug: "horror", label: "Horror", igdb: { field: "themes", ids: [19] }, names: ["Horror"], hue: 350 },
  { slug: "simulation", label: "Simulation", igdb: { field: "genres", ids: [13] }, names: ["Simulator"], hue: 180 },
  { slug: "puzzle", label: "Puzzle", igdb: { field: "genres", ids: [9] }, names: ["Puzzle"], hue: 200 },
  { slug: "fighting", label: "Fighting", igdb: { field: "genres", ids: [4] }, names: ["Fighting"], hue: 15 },
  { slug: "racing", label: "Racing", igdb: { field: "genres", ids: [10] }, names: ["Racing"], hue: 55 },
  { slug: "sports", label: "Sports", igdb: { field: "genres", ids: [14] }, names: ["Sport"], hue: 100 },
  { slug: "coop", label: "Co-op", igdb: { field: "game_modes", ids: [3] }, names: ["Co-operative"], hue: 190 },
];

export const GAME_PLATFORMS: { slug: string; label: string; ids: number[] }[] = [
  { slug: "pc", label: "PC", ids: [6] },
  { slug: "ps5", label: "PlayStation 5", ids: [167] },
  { slug: "xbox", label: "Xbox Series X|S", ids: [169] },
  { slug: "switch2", label: "Switch 2", ids: [508] },
  { slug: "switch", label: "Switch", ids: [130] },
  { slug: "mobile", label: "iOS & Android", ids: [39, 34] },
];

export function genresFor(type: MediaType): Genre[] {
  return type === "movie" ? MOVIE_GENRES : type === "tv" ? TV_GENRES : type === "book" ? BOOK_GENRES : GAME_GENRES;
}

/** Map a provider genre name (from library metadata) to our slug. */
export function genreSlugForName(type: MediaType, name: string): string | null {
  const n = name.toLowerCase();
  return genresFor(type).find((g) => g.names.some((x) => x.toLowerCase() === n))?.slug ?? null;
}

/* ----------------------------------------------------- moods & collections */

/**
 * Curated collections are just named Explore queries. `raw` holds provider-only constraints
 * that don't map onto the public filters (genre combos, exclusions, vote windows…).
 */
export interface Preset {
  slug: string;
  type: MediaType;
  title: string;
  blurb: string;
  kind: "mood" | "collection";
  hue: number;
  query: Partial<ExploreQuery>;
  raw?: {
    tmdbWithGenres?: string;
    tmdbWithoutGenres?: string;
    tmdbMinVotes?: number;
    tmdbMaxVotes?: number;
    tmdbMinAverage?: number;
    tvType?: number;
    igdbWhere?: string;
    igdbQuick?: boolean;
    hcMinRating?: number;
    hcMinRatings?: number;
    hcMaxRatings?: number;
    hcMaxPages?: number;
  };
}

export const PRESETS: Preset[] = [
  // Movies — moods
  { slug: "feel-good", type: "movie", kind: "mood", hue: 45, title: "Feel-Good", blurb: "Warm, funny, easy to love.", query: { sort: "popular" }, raw: { tmdbWithGenres: "35|10751|16", tmdbWithoutGenres: "27,53,80,10752", tmdbMinAverage: 7, tmdbMinVotes: 500 } },
  { slug: "mind-bending", type: "movie", kind: "mood", hue: 250, title: "Mind-Bending", blurb: "Twisty, strange and smart.", query: { sort: "popular" }, raw: { tmdbWithGenres: "878|9648", tmdbWithoutGenres: "16,10751,35", tmdbMinAverage: 7.3, tmdbMinVotes: 1500 } },
  { slug: "edge-of-your-seat", type: "movie", kind: "mood", hue: 0, title: "Edge of Your Seat", blurb: "Tense, gripping thrillers.", query: { sort: "popular" }, raw: { tmdbWithGenres: "53", tmdbMinAverage: 7, tmdbMinVotes: 1000 } },
  { slug: "cozy-night", type: "movie", kind: "mood", hue: 25, title: "Cozy Night In", blurb: "Gentle stories for a slow evening.", query: { sort: "popular" }, raw: { tmdbWithGenres: "10749|16|10751", tmdbWithoutGenres: "27,53,80,10752,28", tmdbMinAverage: 7, tmdbMinVotes: 300 } },
  { slug: "tearjerkers", type: "movie", kind: "mood", hue: 210, title: "Tearjerkers", blurb: "Bring tissues.", query: { sort: "top" }, raw: { tmdbWithGenres: "18,10749", tmdbMinAverage: 7.4, tmdbMinVotes: 800 } },
  // Movies — collections
  { slug: "short-and-sweet", type: "movie", kind: "collection", hue: 160, title: "Short & Sweet", blurb: "Great movies under 100 minutes.", query: { length: "short", rating: "good", sort: "popular" } },
  { slug: "hidden-gems", type: "movie", kind: "collection", hue: 280, title: "Hidden Gems", blurb: "Loved by the few who've seen them.", query: { sort: "top" }, raw: { tmdbMinAverage: 7.5, tmdbMinVotes: 150, tmdbMaxVotes: 1500 } },
  { slug: "critics-darlings", type: "movie", kind: "collection", hue: 50, title: "Critics' Darlings", blurb: "Acclaimed films from the last decade.", query: { sort: "top", decade: "2020s" }, raw: { tmdbMinAverage: 7.8, tmdbMinVotes: 2000 } },

  // TV
  { slug: "limited-series", type: "tv", kind: "collection", hue: 190, title: "Limited Series", blurb: "One season, one great story.", query: { sort: "popular", rating: "good" }, raw: { tvType: 2 } },
  { slug: "hidden-gems", type: "tv", kind: "collection", hue: 280, title: "Hidden Gem Shows", blurb: "Under-watched and brilliant.", query: { sort: "top" }, raw: { tmdbMinAverage: 7.8, tmdbMinVotes: 80, tmdbMaxVotes: 800 } },
  { slug: "comfort-tv", type: "tv", kind: "mood", hue: 35, title: "Comfort TV", blurb: "Rewatchable, low-stakes, lovely.", query: { sort: "popular" }, raw: { tmdbWithGenres: "35", tmdbWithoutGenres: "80,10768,9648", tmdbMinAverage: 7.5, tmdbMinVotes: 300 } },
  { slug: "binge-worthy", type: "tv", kind: "mood", hue: 330, title: "Binge-Worthy", blurb: "Just one more episode…", query: { sort: "popular" }, raw: { tmdbWithGenres: "18|80|9648", tmdbMinAverage: 8, tmdbMinVotes: 1000 } },

  // Books
  { slug: "short-reads", type: "book", kind: "collection", hue: 160, title: "Short Reads", blurb: "Big books in under 250 pages.", query: { length: "short", sort: "popular" }, raw: { hcMinRating: 3.9, hcMinRatings: 50 } },
  { slug: "hidden-gems", type: "book", kind: "collection", hue: 280, title: "Hidden Gems", blurb: "Beloved by a devoted few.", query: { sort: "top" }, raw: { hcMinRating: 4.25, hcMinRatings: 25, hcMaxRatings: 400 } },
  { slug: "book-club", type: "book", kind: "collection", hue: 35, title: "Book Club Favorites", blurb: "Acclaimed and very discussable.", query: { genre: "literary", sort: "top" }, raw: { hcMinRating: 4, hcMinRatings: 300 } },
  { slug: "page-turners", type: "book", kind: "mood", hue: 0, title: "Page-Turners", blurb: "You won't want to put these down.", query: { genre: "thriller", sort: "popular", decade: "2020s" } },
  { slug: "escapist", type: "book", kind: "mood", hue: 270, title: "Pure Escapism", blurb: "Other worlds, big adventures.", query: { genre: "fantasy", sort: "popular", decade: "2020s" } },
  { slug: "swoon", type: "book", kind: "mood", hue: 320, title: "Swoon-Worthy", blurb: "Romance readers can't stop recommending.", query: { genre: "romance", sort: "popular", decade: "2020s" } },

  // Games
  { slug: "weekend", type: "game", kind: "collection", hue: 160, title: "Beat It in a Weekend", blurb: "Great games you can finish in under 12 hours.", query: { sort: "popular" }, raw: { igdbQuick: true } },
  { slug: "hidden-gems", type: "game", kind: "collection", hue: 280, title: "Hidden Gems", blurb: "Critically loved, quietly played.", query: { sort: "top" }, raw: { igdbWhere: "total_rating >= 85 & total_rating_count >= 8 & total_rating_count <= 80" } },
  { slug: "couch-coop", type: "game", kind: "mood", hue: 190, title: "Play Together", blurb: "Co-op favorites for two or more.", query: { genre: "coop", sort: "popular" } },
  { slug: "cozy", type: "game", kind: "mood", hue: 35, title: "Cozy Games", blurb: "Relaxing, gentle, low-pressure.", query: { sort: "popular" }, raw: { igdbWhere: "genres = (13,9) & themes != (19,1,39) & genres != (5,4)" } },
  { slug: "epic-adventures", type: "game", kind: "mood", hue: 110, title: "Epic Adventures", blurb: "Huge worlds to lose yourself in.", query: { genre: "openworld", sort: "top" } },
];

export function presetFor(type: MediaType, slug?: string | null) {
  return slug ? PRESETS.find((p) => p.type === type && p.slug === slug) ?? null : null;
}

export function presetsFor(types: MediaType[], kind?: Preset["kind"]) {
  return PRESETS.filter((p) => types.includes(p.type) && (!kind || p.kind === kind));
}

/* ------------------------------------------------------------ helpers */

export const SORT_LABEL: Record<ExploreSort, string> = { popular: "Most Popular", top: "Top Rated", new: "Newest" };
export const DECADE_LABEL: Record<ExploreDecade, string> = {
  "2020s": "2020s",
  "2010s": "2010s",
  "2000s": "2000s",
  "1990s": "1990s",
  older: "Before 1990",
};
export const RATING_LABEL: Record<ExploreRating, string> = { good: "Well Rated", great: "Highly Rated" };
export const LENGTH_LABEL: Record<"movie" | "book", Record<ExploreLength, string>> = {
  movie: { short: "Under 100 min", medium: "100–140 min", long: "Over 140 min" },
  book: { short: "Under 250 pages", medium: "250–450 pages", long: "Over 450 pages" },
};

export function decadeRange(decade?: ExploreDecade): [number, number] | null {
  switch (decade) {
    case "2020s":
      return [2020, 2099];
    case "2010s":
      return [2010, 2019];
    case "2000s":
      return [2000, 2009];
    case "1990s":
      return [1990, 1999];
    case "older":
      return [1870, 1989];
    default:
      return null;
  }
}

const SORTS: ExploreSort[] = ["popular", "top", "new"];
const DECADES: ExploreDecade[] = ["2020s", "2010s", "2000s", "1990s", "older"];

/** Parse URL search params into a query (unknown values are ignored). */
export function parseExplore(type: MediaType, params: Record<string, string | string[] | undefined>): ExploreQuery {
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const preset = presetFor(type, str("preset"));
  const genre = str("genre") ?? preset?.query.genre;
  const sort = str("sort");
  const decade = str("decade");
  const rating = str("rating");
  const length = str("length");
  const platform = str("platform");
  return {
    type,
    preset: preset?.slug,
    genre: genre && genresFor(type).some((g) => g.slug === genre) ? genre : undefined,
    sort: SORTS.includes(sort as ExploreSort) ? (sort as ExploreSort) : preset?.query.sort ?? "popular",
    decade: DECADES.includes(decade as ExploreDecade) ? (decade as ExploreDecade) : preset?.query.decade,
    rating: rating === "good" || rating === "great" ? rating : preset?.query.rating,
    length: length === "short" || length === "medium" || length === "long" ? length : preset?.query.length,
    platform: GAME_PLATFORMS.some((p) => p.slug === platform) ? platform : undefined,
    mine: str("mine") === "1",
    page: Math.min(50, Math.max(1, Number.parseInt(str("page") ?? "1", 10) || 1)),
  };
}

/** Serialize a query back to a URL (omitting defaults). */
export function exploreHref(q: Partial<ExploreQuery> & { type: MediaType }) {
  const params = new URLSearchParams();
  if (q.preset) params.set("preset", q.preset);
  if (q.genre) params.set("genre", q.genre);
  if (q.sort && q.sort !== "popular") params.set("sort", q.sort);
  if (q.decade) params.set("decade", q.decade);
  if (q.rating) params.set("rating", q.rating);
  if (q.length) params.set("length", q.length);
  if (q.platform) params.set("platform", q.platform);
  if (q.mine) params.set("mine", "1");
  const qs = params.toString();
  return `/explore/${q.type}${qs ? `?${qs}` : ""}`;
}

export function exploreTitle(q: ExploreQuery): { title: string; blurb: string | null } {
  const preset = presetFor(q.type, q.preset);
  if (preset) return { title: preset.title, blurb: preset.blurb };
  const genre = genresFor(q.type).find((g) => g.slug === q.genre);
  const noun = { movie: "Movies", tv: "Shows", book: "Books", game: "Games" }[q.type];
  if (genre) return { title: q.type === "book" || /Movies|Shows|Games$/.test(genre.label) ? genre.label : `${genre.label} ${noun}`, blurb: null };
  return { title: `All ${noun}`, blurb: null };
}
