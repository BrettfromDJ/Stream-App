import "server-only";
import type { MediaSearchResult } from "@/lib/media/types";
import { fetchJson } from "./http";
import { gamesForSteamApps } from "./igdb";

/**
 * Steam store charts. These are Steam's public (unofficial, key-free) store feeds, so they're
 * cached and every row quietly disappears if Steam changes or blocks them.
 * Each Steam app is matched to its IGDB entry for consistent art and detail pages.
 */

interface SteamItem {
  id: number;
  type?: number; // 0 = game/app; bundles & packages use other values
  name: string;
  discounted?: boolean;
  discount_percent?: number;
  final_price?: number;
  currency?: string;
}

interface Featured {
  specials?: { items?: SteamItem[] };
  coming_soon?: { items?: SteamItem[] };
  top_sellers?: { items?: SteamItem[] };
  new_releases?: { items?: SteamItem[] };
}

interface MostPlayed {
  response?: { ranks?: { rank: number; appid: number; peak_in_game?: number; last_week_rank?: number }[] };
}

export interface SteamCharts {
  topSellers: MediaSearchResult[];
  mostPlayed: MediaSearchResult[];
  newReleases: MediaSearchResult[];
  deals: MediaSearchResult[];
  comingSoon: MediaSearchResult[];
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function games(items?: SteamItem[]) {
  const seen = new Set<number>();
  return (items ?? []).filter((i) => (i.type ?? 0) === 0 && !seen.has(i.id) && seen.add(i.id));
}

interface SearchResults {
  items?: { name: string; logo?: string }[];
}

/**
 * Steam store search lists (the same data behind store.steampowered.com/search), games only,
 * in Steam's own ranking order. Returns app IDs parsed from each item's capsule image URL.
 */
async function searchList(filter: "topsellers" | "popularnew" | "popularcomingsoon" | "specials"): Promise<string[]> {
  const params = new URLSearchParams({ start: "0", count: "50", category1: "998", cc: "us", l: "english", json: "1" });
  if (filter === "specials") params.set("specials", "1");
  else params.set("filter", filter);
  // Steam's "Popular New Releases" list = popular new games, newest first.
  if (filter === "popularnew") params.set("sort_by", "Released_DESC");
  const data = await fetchJson<SearchResults>(`https://store.steampowered.com/search/results/?${params}`, {
    provider: "steam",
    revalidate: 60 * 60 * 2,
    timeoutMs: 9000,
  }).catch(() => ({}) as SearchResults);
  const ids = (data.items ?? [])
    .map((i) => i.logo?.match(/\/apps\/(\d+)\//)?.[1])
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}

export async function steamCharts(): Promise<SteamCharts> {
  const [featured, played, topSellers, newReleases, comingSoon, specials] = await Promise.all([
    fetchJson<Featured>("https://store.steampowered.com/api/featuredcategories?cc=us&l=english", {
      provider: "steam",
      revalidate: 60 * 60 * 2,
      timeoutMs: 9000,
    }).catch(() => ({}) as Featured),
    fetchJson<MostPlayed>("https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/", {
      provider: "steam",
      revalidate: 60 * 60 * 2,
      timeoutMs: 9000,
    }).catch(() => ({}) as MostPlayed),
    searchList("topsellers"),
    searchList("popularnew"),
    searchList("popularcomingsoon"),
    searchList("specials"),
  ]);

  // Prefer the long search lists; fall back to the short featured lists if search is unavailable.
  const pickIds = (search: string[], items?: SteamItem[]) =>
    (search.length ? search : games(items).map((i) => String(i.id))).slice(0, 40);
  const discount = new Map(games(featured.specials?.items).map((i) => [String(i.id), i.discount_percent ?? 0]));

  const lists = {
    topSellers: pickIds(topSellers, featured.top_sellers?.items),
    newReleases: pickIds(newReleases, featured.new_releases?.items),
    comingSoon: pickIds(comingSoon, featured.coming_soon?.items),
    deals: pickIds(specials, featured.specials?.items),
  };
  const ranks = (played.response?.ranks ?? []).sort((a, b) => a.rank - b.rank).slice(0, 40);

  const igdb = await gamesForSteamApps([
    ...lists.topSellers.slice(0, 30),
    ...ranks.slice(0, 30).map((r) => String(r.appid)),
    ...lists.newReleases.slice(0, 20),
    ...lists.deals.slice(0, 20),
    ...lists.comingSoon.slice(0, 20),
  ]);

  const map = (ids: string[], badge?: (id: string) => string | null) =>
    ids.flatMap((id) => {
      const g = igdb.get(id);
      if (!g) return [];
      const label = badge?.(id);
      return [{ ...g, metadata: { ...g.metadata, ...(label ? { badge: label } : {}) } }];
    });

  return {
    topSellers: map(lists.topSellers),
    newReleases: map(lists.newReleases),
    deals: map(lists.deals, (id) => (discount.get(id) ? `−${discount.get(id)}%` : null)),
    comingSoon: map(lists.comingSoon),
    mostPlayed: ranks.flatMap((r) => {
      const g = igdb.get(String(r.appid));
      if (!g) return [];
      return [
        {
          ...g,
          metadata: {
            ...g.metadata,
            rank: r.rank,
            lastRank: r.last_week_rank ?? 0,
            ...(r.peak_in_game ? { badge: `${compact.format(r.peak_in_game)} playing` } : {}),
          },
        },
      ];
    }),
  };
}
