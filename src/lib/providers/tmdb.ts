import "server-only";
import type { MediaDetail, MediaFact, MediaSearchResult, MediaVideo } from "@/lib/media/types";
import { formatDate, formatRuntime, yearFrom } from "@/lib/media/format";
import { ProviderError, fetchJson } from "./http";

/**
 * TMDB adapter — movies + TV.
 * Accepts either a v4 "API Read Access Token" (preferred) or a v3 API key in TMDB_API_KEY.
 */

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";

type TmdbKind = "movie" | "tv";

interface TmdbListItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  popularity?: number;
}

interface TmdbPaged<T> {
  results: T[];
}

interface TmdbCast {
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface TmdbDetailCommon {
  id: number;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: { id: number; name: string }[];
  vote_average?: number;
  vote_count?: number;
  status?: string;
  tagline?: string;
  original_language?: string;
  credits?: { cast?: TmdbCast[]; crew?: { job: string; name: string }[] };
  recommendations?: TmdbPaged<TmdbListItem>;
  similar?: TmdbPaged<TmdbListItem>;
  videos?: { results: TmdbVideo[] };
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  name: string;
  official?: boolean;
  published_at?: string;
}

/** YouTube only; official trailers first, then teasers, then everything else (newest first within each). */
function videosOf(d: TmdbDetailCommon): MediaVideo[] {
  const rank = (v: TmdbVideo) =>
    (v.type === "Trailer" ? 0 : v.type === "Teaser" ? 2 : v.type === "Clip" ? 4 : 5) + (v.official ? 0 : 1);
  return (d.videos?.results ?? [])
    .filter((v) => v.site === "YouTube" && /^[\w-]{6,20}$/.test(v.key))
    .sort((a, b) => rank(a) - rank(b) || (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, 12)
    .map((v) => ({ youtubeId: v.key, name: v.name }));
}

interface TmdbMovieDetail extends TmdbDetailCommon {
  title: string;
  release_date?: string;
  runtime?: number | null;
  budget?: number;
  revenue?: number;
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
}

interface TmdbTvDetail extends TmdbDetailCommon {
  name: string;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  in_production?: boolean;
  networks?: { name: string }[];
  created_by?: { name: string }[];
  next_episode_to_air?: { air_date?: string; season_number: number; episode_number: number } | null;
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
}

function credentials() {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) throw new ProviderError("tmdb", "not_configured", "TMDB_API_KEY is not set");
  // v4 read tokens are JWTs; v3 keys are 32-char hex strings.
  return key.startsWith("eyJ")
    ? { headers: { Authorization: `Bearer ${key}` } as HeadersInit, query: "" }
    : { headers: undefined, query: `api_key=${encodeURIComponent(key)}` };
}

export function isTmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

async function tmdb<T>(path: string, params: Record<string, string> = {}, revalidate = 60 * 60 * 6) {
  const { headers, query } = credentials();
  const search = new URLSearchParams({ language: "en-US", ...params }).toString();
  const url = `${API}${path}?${search}${query ? `&${query}` : ""}`;
  return fetchJson<T>(url, { provider: "tmdb", revalidate, headers });
}

const image = (path?: string | null) => (path ? `${IMG}${path}` : null);

function normalize(item: TmdbListItem, kind: TmdbKind): MediaSearchResult {
  const date = kind === "movie" ? item.release_date : item.first_air_date;
  return {
    externalId: String(item.id),
    type: kind,
    title: (kind === "movie" ? item.title : item.name) ?? item.title ?? item.name ?? "Untitled",
    year: yearFrom(date),
    releaseDate: date || null,
    artworkUrl: image(item.poster_path),
    backdropUrl: image(item.backdrop_path),
    description: item.overview || null,
    metadata: item.vote_average ? { voteAverage: item.vote_average } : undefined,
  };
}

function normalizeList(items: TmdbListItem[] | undefined, kind: TmdbKind) {
  return (items ?? []).map((i) => normalize(i, kind));
}

/* ------------------------------------------------------------------ search */

export async function searchTmdb(query: string, kind: TmdbKind | "all"): Promise<MediaSearchResult[]> {
  const params = { query, include_adult: "false", page: "1" };
  if (kind === "all") {
    const data = await tmdb<TmdbPaged<TmdbListItem>>("/search/multi", params, 60 * 60);
    return data.results
      .filter((r): r is TmdbListItem & { media_type: TmdbKind } => r.media_type === "movie" || r.media_type === "tv")
      .map((r) => normalize(r, r.media_type));
  }
  const data = await tmdb<TmdbPaged<TmdbListItem>>(`/search/${kind}`, params, 60 * 60);
  return normalizeList(data.results, kind);
}

/* --------------------------------------------------------------- discovery */

export async function trendingMovies() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/trending/movie/week");
  return normalizeList(data.results, "movie");
}

export async function trendingTv() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/trending/tv/week");
  return normalizeList(data.results, "tv");
}

export async function popularTv() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/tv/popular");
  return normalizeList(data.results, "tv");
}

export async function popularMovies() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/movie/popular");
  return normalizeList(data.results, "movie");
}

export async function nowPlayingMovies() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/movie/now_playing");
  return normalizeList(data.results, "movie");
}

export async function upcomingMovies() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/movie/upcoming");
  return normalizeList(data.results, "movie");
}

export async function airingTv() {
  const data = await tmdb<TmdbPaged<TmdbListItem>>("/tv/on_the_air");
  return normalizeList(data.results, "tv");
}

/* ------------------------------------------------------------------ detail */

function castOf(credits: TmdbDetailCommon["credits"]) {
  return (credits?.cast ?? []).slice(0, 15).map((c) => ({
    name: c.name,
    role: c.character || null,
    imageUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
  }));
}

function score(d: TmdbDetailCommon) {
  return d.vote_average && (d.vote_count ?? 0) > 20
    ? { value: Math.round(d.vote_average * 10) / 10, max: 10, source: "TMDB" }
    : null;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" });

function facts(pairs: [string, string | number | null | undefined | false][]): MediaFact[] {
  return pairs
    .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== "" && v !== 0)
    .map(([label, value]) => ({ label, value: String(value) }));
}

export async function getMovie(id: string): Promise<MediaDetail> {
  const d = await tmdb<TmdbMovieDetail>(
    `/movie/${encodeURIComponent(id)}`,
    { append_to_response: "credits,recommendations,release_dates,videos", include_video_language: "en,null" },
    60 * 60 * 24,
  );
  const base = normalize({ ...d, id: d.id }, "movie");
  const director = d.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
  const certification =
    d.release_dates?.results
      .find((r) => r.iso_3166_1 === "US")
      ?.release_dates.map((r) => r.certification)
      .find(Boolean) ?? null;
  const runtime = formatRuntime(d.runtime);

  return {
    ...base,
    subtitle: director ? `Directed by ${director}` : null,
    genres: d.genres?.map((g) => g.name) ?? [],
    highlights: [base.year ? String(base.year) : null, runtime, certification].filter(Boolean) as string[],
    facts: facts([
      ["Director", director],
      ["Release date", formatDate(d.release_date)],
      ["Runtime", runtime],
      ["Rated", certification],
      ["Status", d.status],
      ["Budget", d.budget ? money.format(d.budget) : null],
      ["Box office", d.revenue ? money.format(d.revenue) : null],
    ]),
    cast: castOf(d.credits),
    videos: videosOf(d),
    related: normalizeList(d.recommendations?.results, "movie").slice(0, 18),
    score: score(d),
    metadata: { genres: d.genres?.map((g) => g.name) ?? [], runtime: d.runtime ?? null, director },
  };
}

export async function getTv(id: string): Promise<MediaDetail> {
  const d = await tmdb<TmdbTvDetail>(
    `/tv/${encodeURIComponent(id)}`,
    { append_to_response: "credits,recommendations,content_ratings,videos", include_video_language: "en,null" },
    60 * 60 * 12,
  );
  const base = normalize({ ...d, id: d.id }, "tv");
  const network = d.networks?.[0]?.name ?? null;
  const seasons = d.number_of_seasons ?? null;
  const rating = d.content_ratings?.results.find((r) => r.iso_3166_1 === "US")?.rating ?? null;
  const next = d.next_episode_to_air;
  const endYear = !d.in_production && d.last_air_date ? yearFrom(d.last_air_date) : null;
  const span = base.year ? (endYear && endYear !== base.year ? `${base.year}–${endYear}` : d.in_production ? `${base.year}–` : String(base.year)) : null;

  return {
    ...base,
    subtitle: network,
    genres: d.genres?.map((g) => g.name) ?? [],
    highlights: [
      span,
      seasons ? `${seasons} season${seasons === 1 ? "" : "s"}` : null,
      rating,
    ].filter(Boolean) as string[],
    facts: facts([
      ["Seasons", seasons],
      ["Episodes", d.number_of_episodes],
      ["First aired", formatDate(d.first_air_date)],
      ["Last aired", formatDate(d.last_air_date)],
      ["Status", d.status],
      ["Next episode", next ? `S${next.season_number} E${next.episode_number} · ${formatDate(next.air_date) ?? "TBA"}` : null],
      ["Network", network],
      ["Created by", d.created_by?.map((c) => c.name).join(", ")],
      ["Episode length", formatRuntime(d.episode_run_time?.[0])],
    ]),
    cast: castOf(d.credits),
    videos: videosOf(d),
    related: normalizeList(d.recommendations?.results, "tv").slice(0, 18),
    score: score(d),
    metadata: {
      genres: d.genres?.map((g) => g.name) ?? [],
      seasons,
      episodes: d.number_of_episodes ?? null,
      network,
    },
  };
}

/* ------------------------------------------------------- browse (Movies & TV) */

type Paged = TmdbPaged<TmdbListItem>;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/** Today's trending movies and shows together (hero + mixed row). */
export async function trendingAllToday() {
  const data = await tmdb<Paged>("/trending/all/day", {}, 60 * 60 * 3);
  return data.results
    .filter((r): r is TmdbListItem & { media_type: TmdbKind } => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => normalize(r, r.media_type));
}

export async function topRatedMovies() {
  return normalizeList((await tmdb<Paged>("/movie/top_rated", {}, 60 * 60 * 24)).results, "movie");
}

export async function topRatedTv() {
  return normalizeList((await tmdb<Paged>("/tv/top_rated", {}, 60 * 60 * 24)).results, "tv");
}

/** Movies that became available to stream/rent (digital release) in the last ~6 weeks. */
export async function newToStreaming() {
  const data = await tmdb<Paged>("/discover/movie", {
    region: "US",
    with_release_type: "4",
    "release_date.gte": daysAgo(45),
    "release_date.lte": today(),
    sort_by: "popularity.desc",
    "vote_count.gte": "10",
    include_adult: "false",
  });
  return normalizeList(data.results, "movie");
}

/** Upcoming theatrical releases that are actually still in the future. */
export async function comingSoonMovies() {
  const data = await tmdb<Paged>("/movie/upcoming", { region: "US" });
  const now = today();
  return normalizeList(data.results, "movie")
    .filter((m) => m.releaseDate && m.releaseDate > now)
    .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
}

export async function moviesByGenre(genreId: number) {
  const data = await tmdb<Paged>("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
    "vote_count.gte": "300",
    "primary_release_date.gte": daysAgo(365 * 6),
    include_adult: "false",
  });
  return normalizeList(data.results, "movie");
}

export async function tvByGenre(genreId: number) {
  const data = await tmdb<Paged>("/discover/tv", {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
    "vote_count.gte": "150",
    "first_air_date.gte": daysAgo(365 * 8),
  });
  return normalizeList(data.results, "tv");
}

/** "Because you loved …" */
export async function recommendationsFor(kind: TmdbKind, id: string) {
  if (!/^\d+$/.test(id)) return [];
  const data = await tmdb<Paged>(`/${kind}/${id}/recommendations`, {}, 60 * 60 * 24);
  return normalizeList(data.results, kind);
}

/* --------------------------------------------------------------- explore */

/** Generic /discover query. Returns one page of normalized results. */
export async function discoverTmdb(kind: TmdbKind, params: Record<string, string>, page: number) {
  const data = await tmdb<TmdbPaged<TmdbListItem> & { total_pages?: number }>(
    `/discover/${kind}`,
    { include_adult: "false", page: String(page), ...params },
    60 * 60 * 6,
  );
  return {
    items: normalizeList(data.results, kind),
    hasMore: page < Math.min(data.total_pages ?? 1, 50),
  };
}
