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
  response?: { ranks?: { rank: number; appid: number; peak_in_game?: number }[] };
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

export async function steamCharts(): Promise<SteamCharts> {
  const [featured, played] = await Promise.all([
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
  ]);

  const lists = {
    topSellers: games(featured.top_sellers?.items),
    newReleases: games(featured.new_releases?.items),
    deals: games(featured.specials?.items),
    comingSoon: games(featured.coming_soon?.items),
  };
  const ranks = (played.response?.ranks ?? []).sort((a, b) => a.rank - b.rank).slice(0, 30);

  const allIds = [
    ...Object.values(lists).flatMap((l) => l.map((i) => String(i.id))),
    ...ranks.map((r) => String(r.appid)),
  ];
  const igdb = await gamesForSteamApps(allIds);

  const map = (items: SteamItem[], badge?: (i: SteamItem) => string | null) =>
    items.flatMap((i) => {
      const g = igdb.get(String(i.id));
      if (!g) return [];
      const label = badge?.(i);
      return [{ ...g, metadata: { ...g.metadata, ...(label ? { badge: label } : {}) } }];
    });

  return {
    topSellers: map(lists.topSellers),
    newReleases: map(lists.newReleases),
    deals: map(lists.deals, (i) => (i.discount_percent ? `−${i.discount_percent}%` : null)),
    comingSoon: map(lists.comingSoon),
    mostPlayed: ranks.flatMap((r) => {
      const g = igdb.get(String(r.appid));
      if (!g) return [];
      return [{ ...g, metadata: { ...g.metadata, ...(r.peak_in_game ? { badge: `${compact.format(r.peak_in_game)} playing` } : {}) } }];
    }),
  };
}
