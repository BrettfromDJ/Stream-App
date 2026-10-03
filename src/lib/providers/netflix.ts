import "server-only";
import type { MediaSearchResult } from "@/lib/media/types";
import { ProviderError } from "./http";
import { searchTmdb } from "./tmdb";

/**
 * Netflix's official weekly Top 10 (top10.netflix.com), published as a public TSV every Tuesday.
 * Columns: week, category, weekly_rank, show_title, season_title, weekly_hours_viewed, runtime,
 * weekly_views, cumulative_weeks_in_top_10, … — newest week first.
 * Titles are matched to TMDB so they get posters and open the normal detail pages.
 */

const GLOBAL_TSV = "https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv";

export interface NetflixTop10 {
  /** Last day (Sunday) of the reported week, YYYY-MM-DD. Netflix weeks run Monday–Sunday. */
  week: string;
  shows: MediaSearchResult[];
  movies: MediaSearchResult[];
}

interface Row {
  week: string;
  category: string;
  rank: number;
  title: string;
  weeks: number;
}

async function fetchTsv(range?: string) {
  let res: Response;
  try {
    res = await fetch(GLOBAL_TSV, {
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 * 60 * 6 },
    });
  } catch (err) {
    throw new ProviderError("netflix", "unavailable", (err as Error).message);
  }
  if (!res.ok) throw new ProviderError("netflix", "unavailable", `HTTP ${res.status}`);
  return res.text();
}

function parse(tsv: string): Row[] {
  const lines = tsv.split(/\r?\n/);
  const header = lines[0]?.split("\t") ?? [];
  const col = (name: string) => header.indexOf(name);
  const [week, category, rank, title, weeks] = ["week", "category", "weekly_rank", "show_title", "cumulative_weeks_in_top_10"].map(col);
  if ([week, category, rank, title].some((i) => i < 0)) throw new ProviderError("netflix", "unavailable", "Unexpected Top 10 format");
  return lines
    .slice(1)
    .map((l) => l.split("\t"))
    .filter((c) => c.length > title && c[title] && /^\d{4}-\d{2}-\d{2}$/.test(c[week]))
    .map((c) => ({ week: c[week], category: c[category], rank: Number(c[rank]), title: c[title], weeks: Number(c[weeks]) || 0 }));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

async function toTmdb(row: Row, kind: "movie" | "tv"): Promise<MediaSearchResult | null> {
  try {
    const results = (await searchTmdb(row.title, kind)).filter((r) => r.artworkUrl);
    const exact = results.find((r) => norm(r.title) === norm(row.title));
    const match = exact ?? results[0];
    if (!match) return null;
    return { ...match, metadata: { ...match.metadata, ...(row.weeks === 1 ? { badge: "New" } : row.weeks > 1 ? { badge: `${row.weeks} weeks` } : {}) } };
  } catch {
    return null;
  }
}

/** This week's English-language Top 10 shows and movies on Netflix, worldwide. */
export async function netflixTop10(): Promise<NetflixTop10> {
  // The newest week sits at the top of a multi-year file: read just the first chunk when the server allows it.
  let rows = parse(await fetchTsv("bytes=0-60000")).filter((r) => r.title);
  let latest = rows.reduce((m, r) => (r.week > m ? r.week : m), "");
  const stale = !latest || Date.parse(latest) < Date.now() - 21 * 86_400_000;
  if (stale) {
    rows = parse(await fetchTsv());
    latest = rows.reduce((m, r) => (r.week > m ? r.week : m), "");
  }

  const pick = (category: string) =>
    rows
      .filter((r) => r.week === latest && r.category === category)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10);

  const [shows, movies] = await Promise.all([
    Promise.all(pick("TV (English)").map((r) => toTmdb(r, "tv"))),
    Promise.all(pick("Films (English)").map((r) => toTmdb(r, "movie"))),
  ]);
  const clean = (list: (MediaSearchResult | null)[]) => list.filter((m): m is MediaSearchResult => m !== null);
  return { week: latest, shows: clean(shows), movies: clean(movies) };
}
