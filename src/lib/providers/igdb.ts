import "server-only";
import type { MediaDetail, MediaFact, MediaSearchResult, MediaVideo } from "@/lib/media/types";
import { cleanDescription, formatDate } from "@/lib/media/format";
import { ProviderError, fetchJson, safely } from "./http";

/**
 * IGDB adapter — video games. Uses a Twitch app (IGDB_CLIENT_ID + IGDB_CLIENT_SECRET).
 * Queries are written in IGDB's Apicalypse syntax and sent as POST bodies.
 * Docs: https://api-docs.igdb.com
 */

const API = "https://api.igdb.com/v4";
const IMG = "https://images.igdb.com/igdb/image/upload";

interface IgdbImage {
  image_id: string;
}

interface IgdbNamed {
  id: number;
  name: string;
  abbreviation?: string;
}

interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number; // unix seconds
  cover?: IgdbImage;
  artworks?: IgdbImage[];
  screenshots?: IgdbImage[];
  videos?: { name?: string; video_id?: string }[];
  platforms?: IgdbNamed[];
  genres?: IgdbNamed[];
  themes?: IgdbNamed[];
  game_modes?: IgdbNamed[];
  involved_companies?: { company: IgdbNamed; developer: boolean; publisher: boolean }[];
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  total_rating?: number;
  total_rating_count?: number;
  similar_games?: IgdbGame[];
  franchises?: IgdbNamed[];
}

/* ------------------------------------------------------------------ auth */

function credentials() {
  const id = process.env.IGDB_CLIENT_ID?.trim();
  const secret = process.env.IGDB_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new ProviderError("igdb", "not_configured", "IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are not set");
  return { id, secret };
}

export function isIgdbConfigured() {
  return Boolean(process.env.IGDB_CLIENT_ID?.trim() && process.env.IGDB_CLIENT_SECRET?.trim());
}

/**
 * Twitch app tokens last ~60 days. The token response is kept in the Next.js data cache
 * for a day (shared across server instances); a rejected token is replaced immediately.
 */
async function getToken(fresh = false): Promise<string> {
  const { id, secret } = credentials();
  const url = `https://id.twitch.tv/oauth2/token?${new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
  })}`;
  let res: Response;
  try {
    res = await fetch(url, fresh ? { method: "POST", cache: "no-store" } : { method: "POST", next: { revalidate: 60 * 60 * 24 } });
  } catch (err) {
    throw new ProviderError("igdb", "unavailable", (err as Error).message);
  }
  if (!res.ok) throw new ProviderError("igdb", "not_configured", `Twitch token request failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new ProviderError("igdb", "not_configured", "Twitch returned no token");
  return data.access_token;
}

async function igdb<T>(endpoint: string, query: string, revalidate = 60 * 60 * 6): Promise<T> {
  const { id } = credentials();
  const send = async (token: string) =>
    fetchJson<T>(`${API}/${endpoint}`, {
      provider: "igdb",
      method: "POST",
      body: query.replace(/\s+/g, " ").trim(),
      revalidate,
      timeoutMs: 9000,
      headers: { "Client-ID": id, Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    });
  try {
    return await send(await getToken());
  } catch (err) {
    // Expired / revoked token: fetch a new one and retry once.
    if (err instanceof ProviderError && err.kind === "not_configured") return send(await getToken(true));
    throw err;
  }
}

/* ---------------------------------------------------------------- mapping */

// Stored at high resolution; src/lib/image-loader.ts steps down per rendered width.
const cover = (img?: IgdbImage) => (img ? `${IMG}/t_cover_big_2x/${img.image_id}.jpg` : null);
const wide = (img?: IgdbImage) => (img ? `${IMG}/t_1080p/${img.image_id}.jpg` : null);

const escape = (q: string) => q.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const now = () => Math.floor(Date.now() / 1000);

function isoDate(unix?: number) {
  return unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null;
}

function platformLabels(g: IgdbGame) {
  return (g.platforms ?? []).map((p) => p.abbreviation || p.name);
}

function companies(g: IgdbGame, role: "developer" | "publisher") {
  return (g.involved_companies ?? []).filter((c) => c[role]).map((c) => c.company.name);
}

function normalize(g: IgdbGame): MediaSearchResult {
  const releaseDate = isoDate(g.first_release_date);
  const backdrop = wide(g.artworks?.[0] ?? g.screenshots?.[0]);
  const developers = companies(g, "developer");
  return {
    externalId: String(g.id),
    type: "game",
    title: g.name,
    subtitle: developers[0] ?? (platformLabels(g).slice(0, 3).join(" · ") || null),
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    releaseDate,
    artworkUrl: cover(g.cover),
    backdropUrl: backdrop,
    description: g.summary ?? null,
    metadata: {
      platforms: platformLabels(g),
      genres: g.genres?.map((x) => x.name) ?? [],
      developers,
    },
  };
}

/** Fields needed for cards and search results. */
const LIST_FIELDS = `fields name, first_release_date, cover.image_id, artworks.image_id, screenshots.image_id,
  platforms.name, platforms.abbreviation, genres.name,
  involved_companies.company.name, involved_companies.developer, involved_companies.publisher;`;

/* ------------------------------------------------------------ list/search */

export async function searchGames(query: string): Promise<MediaSearchResult[]> {
  // `version_parent = null` drops "Deluxe/GOTY edition" duplicates.
  const data = await igdb<IgdbGame[]>(
    "games",
    `search "${escape(query)}"; ${LIST_FIELDS} where version_parent = null; limit 24;`,
    60 * 60,
  );
  const results = data.map(normalize);
  return [...results.filter((r) => r.artworkUrl), ...results.filter((r) => !r.artworkUrl)];
}

/** Notable recent releases: out in the last 90 days, ordered by pre-release interest. */
export async function newGames(): Promise<MediaSearchResult[]> {
  const t = now();
  const data = await igdb<IgdbGame[]>(
    "games",
    `${LIST_FIELDS}
     where first_release_date >= ${t - 90 * 86400} & first_release_date <= ${t}
       & cover != null & version_parent = null & hypes > 0;
     sort hypes desc; limit 24;`,
  );
  return data.map(normalize);
}

/** Best-reviewed games released in the past year. */
export async function popularGames(): Promise<MediaSearchResult[]> {
  const t = now();
  const data = await igdb<IgdbGame[]>(
    "games",
    `${LIST_FIELDS}
     where first_release_date >= ${t - 365 * 86400} & first_release_date <= ${t}
       & cover != null & version_parent = null & total_rating_count >= 10;
     sort total_rating desc; limit 24;`,
  );
  return data.map(normalize);
}

/** Most anticipated upcoming releases. */
export async function upcomingGames(): Promise<MediaSearchResult[]> {
  const t = now();
  const data = await igdb<IgdbGame[]>(
    "games",
    `${LIST_FIELDS}
     where first_release_date > ${t} & cover != null & version_parent = null & hypes > 0;
     sort hypes desc; limit 24;`,
  );
  return data.map(normalize);
}

/* ------------------------------------------------------------------ detail */

/** Trailers first (launch/release trailers before announcements), then everything else. */
function orderVideos(videos: IgdbGame["videos"]): MediaVideo[] {
  const score = (name: string) =>
    /launch|release/i.test(name) ? 0 : /official trailer|^trailer$/i.test(name) ? 1 : /trailer/i.test(name) ? 2 : /gameplay/i.test(name) ? 3 : 4;
  const seen = new Set<string>();
  return (videos ?? [])
    .filter((v): v is { name?: string; video_id: string } => Boolean(v.video_id && /^[\w-]{6,20}$/.test(v.video_id)))
    .filter((v) => !seen.has(v.video_id) && seen.add(v.video_id))
    .map((v) => ({ youtubeId: v.video_id, name: v.name?.trim() || "Trailer" }))
    .sort((a, b) => score(a.name) - score(b.name))
    .slice(0, 12);
}

/* ------------------------------------------------- time to beat + stores */

const STORES: { name: string; match: RegExp }[] = [
  { name: "Steam", match: /(^|\.)store\.steampowered\.com$|(^|\.)steamcommunity\.com$/ },
  { name: "PlayStation Store", match: /(^|\.)store\.playstation\.com$|(^|\.)playstation\.com$/ },
  { name: "Xbox", match: /(^|\.)xbox\.com$|(^|\.)microsoft\.com$/ },
  { name: "Nintendo eShop", match: /(^|\.)nintendo\.com$|(^|\.)nintendo\.co\.uk$/ },
  { name: "Epic Games Store", match: /(^|\.)epicgames\.com$/ },
  { name: "GOG", match: /(^|\.)gog\.com$/ },
  { name: "App Store", match: /(^|\.)apps\.apple\.com$|(^|\.)itunes\.apple\.com$/ },
  { name: "Google Play", match: /(^|\.)play\.google\.com$/ },
  { name: "itch.io", match: /(^|\.)itch\.io$/ },
  { name: "Humble Store", match: /(^|\.)humblebundle\.com$/ },
];

// PlayStation/Xbox/Nintendo hosts also serve non-store pages; only keep store-looking paths.
const STORE_PATH: Record<string, RegExp> = {
  Steam: /\/app\/\d+/,
  "PlayStation Store": /store\.playstation\.com|\/games\//,
  Xbox: /\/games\/store\/|\/p\/|\/store\//,
  "Nintendo eShop": /\/store\/|\/games\/detail\//,
  "Humble Store": /\/store\//,
};

function storeLinks(urls: string[]) {
  const out = new Map<string, string>();
  for (const raw of urls) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const store = STORES.find((s) => s.match.test(url.hostname));
    if (!store || out.has(store.name)) continue;
    const path = STORE_PATH[store.name];
    if (path && !path.test(url.href)) continue;
    url.protocol = "https:";
    out.set(store.name, url.href);
  }
  // Keep a stable, familiar order.
  return STORES.filter((s) => out.has(s.name)).map((s) => ({ name: s.name, url: out.get(s.name)! }));
}

async function steamPrice(appId: string) {
  const data = await fetchJson<Record<string, { success?: boolean; data?: { price_overview?: { final_formatted?: string; initial_formatted?: string; discount_percent?: number } } | [] }>>(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&filters=price_overview`,
    { provider: "steam", revalidate: 60 * 60 * 3, timeoutMs: 6000 },
  );
  const entry = data[appId];
  const price = entry?.success && !Array.isArray(entry.data) ? entry.data?.price_overview : undefined;
  if (!price?.final_formatted) return null;
  return {
    price: price.final_formatted,
    originalPrice: price.discount_percent ? price.initial_formatted ?? null : null,
    discount: price.discount_percent || null,
  };
}

/** Store links + Steam price + time to beat. Each part fails independently. */
async function gameExtras(id: string): Promise<Pick<MediaDetail, "stores" | "timeToBeat">> {
  const day = 60 * 60 * 24;
  const [websites, external, ttb] = await Promise.all([
    safely(() => igdb<{ websites?: { url?: string }[] }[]>("games", `fields websites.url; where id = ${id};`, day), []),
    safely(() => igdb<{ url?: string }[]>("external_games", `fields url; where game = ${id}; limit 50;`, day), []),
    safely(
      () =>
        igdb<{ hastily?: number; normally?: number; completely?: number; count?: number }[]>(
          "game_time_to_beats",
          `fields hastily, normally, completely, count; where game_id = ${id};`,
          day,
        ),
      [],
    ),
  ]);

  const urls = [
    ...(websites[0]?.websites ?? []).map((w) => w.url),
    ...external.map((e) => e.url),
  ].filter((u): u is string => Boolean(u));
  const stores: NonNullable<MediaDetail["stores"]> = storeLinks(urls);

  const steam = stores.find((s) => s.name === "Steam");
  const appId = steam?.url.match(/\/app\/(\d+)/)?.[1];
  if (steam && appId) Object.assign(steam, (await safely(() => steamPrice(appId), null)) ?? {});

  const t = ttb[0];
  const hours = (seconds?: number) => (seconds && seconds > 0 ? Math.max(0.5, Math.round((seconds / 3600) * 2) / 2) : null);
  const entries = [
    { label: "Main Story", hours: hours(t?.hastily) },
    { label: "Main + Extras", hours: hours(t?.normally) },
    { label: "Completionist", hours: hours(t?.completely) },
  ].filter((e): e is { label: string; hours: number } => e.hours !== null);

  return {
    stores,
    timeToBeat: entries.length ? { entries, submissions: t?.count ?? null } : null,
  };
}

export async function getGame(id: string): Promise<MediaDetail> {
  if (!/^\d+$/.test(id)) throw new ProviderError("igdb", "not_found");
  const extras = gameExtras(id);
  const data = await igdb<IgdbGame[]>(
    "games",
    `fields name, summary, storyline, first_release_date, cover.image_id, artworks.image_id, screenshots.image_id,
       videos.name, videos.video_id,
       platforms.name, platforms.abbreviation, genres.name, themes.name, game_modes.name, franchises.name,
       involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
       aggregated_rating, aggregated_rating_count, total_rating, total_rating_count,
       similar_games.name, similar_games.first_release_date, similar_games.cover.image_id;
     where id = ${id};`,
    60 * 60 * 24,
  );
  const g = data[0];
  if (!g) throw new ProviderError("igdb", "not_found");

  const base = normalize(g);
  const platforms = (g.platforms ?? []).map((p) => p.name);
  const developers = companies(g, "developer");
  const publishers = companies(g, "publisher");
  const genres = g.genres?.map((x) => x.name) ?? [];
  const critic = g.aggregated_rating && (g.aggregated_rating_count ?? 0) >= 3 ? Math.round(g.aggregated_rating) : null;
  const users = !critic && g.total_rating && (g.total_rating_count ?? 0) >= 5 ? Math.round(g.total_rating) : null;
  const upcoming = g.first_release_date ? g.first_release_date > now() : false;

  const facts: MediaFact[] = [
    ["Platforms", platforms.join(", ")],
    ["Developer", developers.join(", ")],
    ["Publisher", publishers.join(", ")],
    ["Release date", g.first_release_date ? formatDate(base.releaseDate) : "TBA"],
    ["Modes", g.game_modes?.map((m) => m.name).join(", ")],
    ["Franchise", g.franchises?.map((f) => f.name).join(", ")],
    ["Critic score", critic ? `${critic} / 100` : null],
  ]
    .filter((f): f is [string, string] => Boolean(f[1]))
    .map(([label, value]) => ({ label, value }));

  return {
    ...base,
    subtitle: developers[0] ?? publishers[0] ?? null,
    description: cleanDescription(g.summary ?? g.storyline),
    genres: [...genres, ...(g.themes?.map((x) => x.name) ?? [])].slice(0, 4),
    highlights: [
      base.year ? (upcoming ? `Coming ${base.year}` : String(base.year)) : "TBA",
      platformLabels(g).slice(0, 3).join(" · ") || null,
    ].filter(Boolean) as string[],
    facts,
    screenshots: [...(g.screenshots ?? []), ...(g.artworks ?? [])].slice(0, 12).map((s) => wide(s)!),
    videos: orderVideos(g.videos),
    ...(await extras),
    related: (g.similar_games ?? []).filter((s) => s.cover).map(normalize).slice(0, 18),
    score: critic
      ? { value: critic, max: 100, source: "Critics" }
      : users
        ? { value: users, max: 100, source: "IGDB" }
        : null,
    metadata: { platforms: platformLabels(g), developers, publishers, genres },
  };
}

/* -------------------------------------------------------------- games hub */

interface MultiResult {
  name: string;
  result?: IgdbGame[] | { game?: number; game_id?: number; value?: number }[];
}

export interface GamesHub {
  featured: MediaSearchResult[];
  countdown: MediaSearchResult[];
  justReleased: MediaSearchResult[];
  topThisYear: MediaSearchResult[];
  anticipated: MediaSearchResult[];
  allTime: MediaSearchResult[];
  rpg: MediaSearchResult[];
  indie: MediaSearchResult[];
  shooter: MediaSearchResult[];
}

/**
 * Everything on the Games tab in a single IGDB multiquery (IGDB allows 4 requests/second,
 * so one batched request per cache window keeps us well clear of it).
 */
export async function gamesHub(): Promise<GamesHub> {
  const t = now();
  const day = 86_400;
  const base = "cover != null & version_parent = null";
  const q = (name: string, where: string, sort: string, limit = 20) =>
    `query games "${name}" { ${LIST_FIELDS} where ${base} & ${where}; sort ${sort}; limit ${limit}; };`;

  const body = [
    q("featured", `first_release_date >= ${t - 45 * day} & first_release_date <= ${t} & hypes >= 5`, "hypes desc", 8),
    q("countdown", `first_release_date > ${t} & first_release_date <= ${t + 150 * day} & hypes >= 3`, "first_release_date asc", 16),
    q("justReleased", `first_release_date >= ${t - 30 * day} & first_release_date <= ${t} & hypes > 0`, "first_release_date desc"),
    q("topThisYear", `first_release_date >= ${t - 365 * day} & first_release_date <= ${t} & total_rating_count >= 15`, "total_rating desc", 10),
    q("anticipated", `first_release_date > ${t} & hypes >= 10`, "hypes desc"),
    q("allTime", `total_rating_count >= 800`, "total_rating desc"),
    q("rpg", `genres = (12) & first_release_date >= ${t - 3 * 365 * day} & total_rating_count >= 20`, "total_rating desc"),
    q("indie", `genres = (32) & first_release_date >= ${t - 3 * 365 * day} & total_rating_count >= 20`, "total_rating desc"),
    q("shooter", `genres = (5) & first_release_date >= ${t - 3 * 365 * day} & total_rating_count >= 15`, "total_rating desc"),
  ].join("\n");

  const results = await igdb<MultiResult[]>("multiquery", body, 60 * 60 * 3);
  const pick = (name: string) =>
    ((results.find((r) => r.name === name)?.result ?? []) as IgdbGame[]).map(normalize);

  return {
    featured: pick("featured").filter((g) => g.backdropUrl),
    countdown: pick("countdown"),
    justReleased: pick("justReleased"),
    topThisYear: pick("topThisYear"),
    anticipated: pick("anticipated"),
    allTime: pick("allTime"),
    rpg: pick("rpg"),
    indie: pick("indie"),
    shooter: pick("shooter"),
  };
}

/** What IGDB members are playing right now (popularity primitives, type 3 = "Playing"). */
export async function popularNow(): Promise<MediaSearchResult[]> {
  const pop = await igdb<{ game_id: number; value: number }[]>(
    "popularity_primitives",
    `fields game_id, value; where popularity_type = 3; sort value desc; limit 30;`,
    60 * 60 * 6,
  );
  const ids = pop.map((p) => p.game_id).filter(Boolean);
  if (!ids.length) return [];
  const games = await igdb<IgdbGame[]>(
    "games",
    `${LIST_FIELDS} where id = (${ids.join(",")}) & cover != null; limit ${ids.length};`,
    60 * 60 * 6,
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  return games.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).map(normalize).slice(0, 20);
}

/** "Because you loved …" */
export async function similarTo(id: string): Promise<MediaSearchResult[]> {
  if (!/^\d+$/.test(id)) return [];
  const data = await igdb<IgdbGame[]>(
    "games",
    `fields similar_games.name, similar_games.first_release_date, similar_games.cover.image_id,
       similar_games.artworks.image_id, similar_games.screenshots.image_id;
     where id = ${id};`,
    60 * 60 * 24,
  );
  return (data[0]?.similar_games ?? []).filter((g) => g.cover).map(normalize);
}

/* ------------------------------------------------------- Steam → IGDB */

/**
 * Maps Steam app IDs to IGDB games (via IGDB's external_games, source 1 = Steam) so Steam
 * charts show the same box art and open the same detail pages as everything else.
 */
export async function gamesForSteamApps(appIds: string[]): Promise<Map<string, MediaSearchResult>> {
  const ids = [...new Set(appIds.filter((id) => /^\d+$/.test(id)))].slice(0, 150);
  const out = new Map<string, MediaSearchResult>();
  if (!ids.length) return out;
  const uids = ids.map((id) => `"${id}"`).join(",");
  const lookup = (where: string) =>
    igdb<{ game?: number; uid?: string }[]>(
      "external_games",
      `fields game, uid; where uid = (${uids}) & ${where}; limit 500;`,
      60 * 60 * 12,
    );
  // IGDB renamed `category` to `external_game_source`; try the new name first.
  let links: { game?: number; uid?: string }[];
  try {
    links = await lookup("external_game_source = 1");
  } catch {
    links = await lookup("category = 1");
  }
  const gameByApp = new Map<string, number>();
  for (const l of links) if (l.uid && l.game && !gameByApp.has(l.uid)) gameByApp.set(l.uid, l.game);
  const gameIds = [...new Set(gameByApp.values())];
  if (!gameIds.length) return out;

  const games = await igdb<IgdbGame[]>(
    "games",
    `${LIST_FIELDS} where id = (${gameIds.join(",")}); limit ${gameIds.length};`,
    60 * 60 * 12,
  );
  const byId = new Map(games.map((g) => [g.id, normalize(g)]));
  for (const [app, game] of gameByApp) {
    const g = byId.get(game);
    if (g?.artworkUrl) out.set(app, g);
  }
  return out;
}
