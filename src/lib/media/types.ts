export const MEDIA_TYPES = ["movie", "tv", "book", "game"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const LIBRARY_STATUSES = ["in_progress", "backlog", "completed", "dropped"] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

export function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && (MEDIA_TYPES as readonly string[]).includes(value);
}

export function isLibraryStatus(value: unknown): value is LibraryStatus {
  return typeof value === "string" && (LIBRARY_STATUSES as readonly string[]).includes(value);
}

/** Provider-agnostic result used by search, carousels and cards. */
export interface MediaSearchResult {
  externalId: string;
  type: MediaType;
  title: string;
  /** Director/network/author/developer — whatever reads best under the title. */
  subtitle?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  artworkUrl?: string | null;
  backdropUrl?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export interface MediaPerson {
  name: string;
  role?: string | null;
  imageUrl?: string | null;
}

export interface MediaVideo {
  youtubeId: string;
  name: string;
}

export interface MediaFact {
  label: string;
  value: string;
}

/** Full detail for the item page. Everything beyond the basics is optional. */
export interface MediaDetail extends MediaSearchResult {
  genres: string[];
  /** Short facts shown under the title, e.g. "2h 14m", "412 pages", "PS5 · PC". */
  highlights: string[];
  /** Longer key/value metadata shown further down the page. */
  facts: MediaFact[];
  cast?: MediaPerson[];
  screenshots?: string[];
  /** YouTube videos (trailers first). */
  videos?: MediaVideo[];
  related?: MediaSearchResult[];
  /** Several titled "more like this" rows (e.g. series, author, similar). Takes precedence over `related`. */
  relatedRows?: { title: string; items: MediaSearchResult[]; href?: string }[];
  /** Games: how long it takes to finish, from player submissions. */
  timeToBeat?: { entries: { label: string; hours: number }[]; submissions: number | null } | null;
  /** Games: official store pages, with a live price where available. */
  stores?: { name: string; url: string; price?: string | null; originalPrice?: string | null; discount?: number | null }[];
  /** Movies & TV: where it's available in the US (TMDB / JustWatch). */
  watch?: WatchAvailability | null;
  /** Linkable people shown in the header (e.g. book authors → author pages). */
  creators?: { name: string; href: string }[];
  score?: { value: number; max: number; source: string } | null;
}

/** Snapshot persisted with a library item (kept intentionally small). */
export interface MediaSnapshot {
  type: MediaType;
  externalId: string;
  title: string;
  subtitle?: string | null;
  artworkUrl?: string | null;
  backdropUrl?: string | null;
  releaseDate?: string | null;
  metadata?: Record<string, unknown>;
}

/** Library row, camel-cased for the UI. */
export interface LibraryItem {
  id: string;
  mediaType: MediaType;
  externalId: string;
  title: string;
  subtitle: string | null;
  artworkUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  status: LibraryStatus;
  rating: number | null;
  review: string | null;
  reviewedAt: string | null;
  dateStarted: string | null;
  dateFinished: string | null;
  progress: MediaProgress | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Not tracked in the MVP, but the Continue card already knows how to render it.
 */
export type MediaProgress =
  | { kind: "episode"; season: number; episode: number; percent?: number }
  | { kind: "page"; page: number; totalPages?: number; percent?: number }
  | { kind: "hours"; hours: number; percent?: number }
  | { kind: "percent"; percent: number };

/** Minimal shape any card can render. */
export interface CardMedia {
  type: MediaType;
  externalId: string;
  title: string;
  year?: number | null;
  artworkUrl?: string | null;
  status?: LibraryStatus | null;
  rating?: number | null;
}

/** An author page. */
export interface AuthorProfile {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  /** e.g. "1947–" or "1892–1973" */
  lifespan: string | null;
  bookCount: number;
  popular: MediaSearchResult[];
  series: { title: string; items: MediaSearchResult[] }[];
  all: MediaSearchResult[];
  source: "Hardcover" | "Open Library";
}

export interface WatchProvider {
  id: number;
  name: string;
  logoUrl: string | null;
}

export interface WatchAvailability {
  /** JustWatch page listing every option. */
  link: string | null;
  stream: WatchProvider[];
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}
