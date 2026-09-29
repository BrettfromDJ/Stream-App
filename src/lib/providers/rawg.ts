import "server-only";
import type { MediaDetail, MediaFact, MediaSearchResult } from "@/lib/media/types";
import { cleanDescription, formatDate, yearFrom } from "@/lib/media/format";
import { ProviderError, fetchJson, safely } from "./http";

/** RAWG adapter — video games. Requires RAWG_API_KEY. Attribution is shown on the Profile screen. */

const API = "https://api.rawg.io/api";

interface RawgNamed {
  id?: number;
  name: string;
}

interface RawgListItem {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  tba?: boolean;
  background_image?: string | null;
  metacritic?: number | null;
  rating?: number;
  added?: number;
  platforms?: { platform: RawgNamed }[] | null;
  parent_platforms?: { platform: RawgNamed }[] | null;
  genres?: RawgNamed[];
}

interface RawgDetail extends RawgListItem {
  description_raw?: string;
  description?: string;
  background_image_additional?: string | null;
  playtime?: number;
  developers?: RawgNamed[];
  publishers?: RawgNamed[];
  esrb_rating?: RawgNamed | null;
  website?: string;
}

function key() {
  const k = process.env.RAWG_API_KEY?.trim();
  if (!k) throw new ProviderError("rawg", "not_configured", "RAWG_API_KEY is not set");
  return k;
}

export function isRawgConfigured() {
  return Boolean(process.env.RAWG_API_KEY?.trim());
}

function rawg<T>(path: string, params: Record<string, string> = {}, revalidate = 60 * 60 * 6) {
  const search = new URLSearchParams({ key: key(), ...params });
  return fetchJson<T>(`${API}${path}?${search}`, { provider: "rawg", revalidate, timeoutMs: 9000 });
}

function platformNames(item: RawgListItem, parent = true) {
  const list = (parent ? item.parent_platforms : null) ?? item.platforms ?? [];
  return list.map((p) => p.platform.name);
}

function normalize(item: RawgListItem): MediaSearchResult {
  return {
    externalId: String(item.id),
    type: "game",
    title: item.name,
    subtitle: platformNames(item).slice(0, 3).join(" · ") || null,
    year: yearFrom(item.released),
    releaseDate: item.released ?? null,
    artworkUrl: item.background_image ?? null,
    backdropUrl: item.background_image ?? null,
    description: null,
    metadata: {
      platforms: platformNames(item),
      genres: item.genres?.map((g) => g.name) ?? [],
      metacritic: item.metacritic ?? null,
      landscapeArtwork: true,
    },
  };
}

export async function searchGames(query: string): Promise<MediaSearchResult[]> {
  const data = await rawg<{ results: RawgListItem[] }>(
    "/games",
    { search: query, page_size: "20", search_precise: "true" },
    60 * 60,
  );
  return data.results.map(normalize);
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function newGames(): Promise<MediaSearchResult[]> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  const data = await rawg<{ results: RawgListItem[] }>("/games", {
    dates: `${isoDay(from)},${isoDay(now)}`,
    ordering: "-added",
    page_size: "24",
  });
  return data.results.filter((g) => g.background_image).map(normalize);
}

export async function popularGames(): Promise<MediaSearchResult[]> {
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - 1);
  const data = await rawg<{ results: RawgListItem[] }>("/games", {
    dates: `${isoDay(from)},${isoDay(now)}`,
    ordering: "-rating",
    metacritic: "75,100",
    page_size: "24",
  });
  return data.results.filter((g) => g.background_image).map(normalize);
}

export async function getGame(id: string): Promise<MediaDetail> {
  if (!/^[a-z0-9-]+$/i.test(id)) throw new ProviderError("rawg", "not_found");
  const day = 60 * 60 * 24;
  const [d, shots, series] = await Promise.all([
    rawg<RawgDetail>(`/games/${id}`, {}, day),
    safely(() => rawg<{ results: { image: string }[] }>(`/games/${id}/screenshots`, { page_size: "12" }, day), {
      results: [],
    }),
    safely(() => rawg<{ results: RawgListItem[] }>(`/games/${id}/game-series`, { page_size: "18" }, day), {
      results: [],
    }),
  ]);

  const base = normalize(d);
  const platforms = platformNames(d, false);
  const developers = d.developers?.map((x) => x.name) ?? [];
  const publishers = d.publishers?.map((x) => x.name) ?? [];
  const genres = d.genres?.map((g) => g.name) ?? [];
  const shortPlatforms = platformNames(d).slice(0, 3).join(" · ");

  const facts: MediaFact[] = [
    ["Platforms", platforms.join(", ")],
    ["Developer", developers.join(", ")],
    ["Publisher", publishers.join(", ")],
    ["Release date", d.tba ? "TBA" : formatDate(d.released)],
    ["Average playtime", d.playtime ? `${d.playtime} hours` : null],
    ["ESRB", d.esrb_rating?.name ?? null],
    ["Metacritic", d.metacritic ? String(d.metacritic) : null],
  ]
    .filter((f): f is [string, string] => Boolean(f[1]))
    .map(([label, value]) => ({ label, value }));

  return {
    ...base,
    subtitle: developers[0] ?? null,
    description: cleanDescription(d.description_raw ?? d.description),
    backdropUrl: d.background_image ?? d.background_image_additional ?? null,
    genres,
    highlights: [base.year ? String(base.year) : d.tba ? "TBA" : null, shortPlatforms || null].filter(Boolean) as string[],
    facts,
    screenshots: shots.results.map((s) => s.image).filter(Boolean),
    related: series.results.filter((g) => g.background_image).map(normalize),
    score: d.metacritic ? { value: d.metacritic, max: 100, source: "Metacritic" } : null,
    metadata: { platforms, developers, publishers, genres, metacritic: d.metacritic ?? null, landscapeArtwork: true },
  };
}
