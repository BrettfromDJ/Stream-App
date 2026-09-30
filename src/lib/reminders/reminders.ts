import "server-only";
import { getMediaDetail, getSeason } from "@/lib/providers";
import { cardFromItem, type CardData } from "@/lib/media/card";
import type { EpisodeRef, LibraryItem } from "@/lib/media/types";

export type ReminderKind = "release" | "premiere" | "episode";

export interface Reminder {
  key: string;
  kind: ReminderKind;
  /** YYYY-MM-DD */
  date: string;
  media: CardData;
  season?: number;
  episode?: number;
  episodeName?: string | null;
}

export interface Reminders {
  /** Out in the last two weeks, newest first. */
  recent: Reminder[];
  /** Still to come, soonest first. */
  upcoming: Reminder[];
}

const RECENT_DAYS = 14;
const DAY = 86_400_000;

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const todayIso = () => isoDay(Date.now());

/** Runs `fn` over `items` with at most `limit` in flight. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function detailOf(item: LibraryItem) {
  try {
    return await getMediaDetail(item.mediaType, item.externalId);
  } catch {
    return null;
  }
}

const isWatched = (item: LibraryItem, ep: EpisodeRef) =>
  item.progress?.kind === "episode" && Boolean(item.progress.watched?.[String(ep.season)]?.includes(ep.episode));

const episodeReminder = (item: LibraryItem, ep: EpisodeRef, date: string): Reminder => ({
  key: `tv:${item.externalId}:s${ep.season}e${ep.episode}`,
  kind: ep.episode === 1 ? "premiere" : "episode",
  date,
  media: cardFromItem(item),
  season: ep.season,
  episode: ep.episode,
  episodeName: ep.name,
});

/**
 * Release days and new episodes for things on your shelf.
 * - Movies, games and books you want (or have started) that aren't out yet, or just came out.
 * - Shows you're watching: new and upcoming episodes. Shows you want or finished: new seasons.
 * `allEpisodes` lists every upcoming episode of the current season (for the calendar feed).
 */
export async function getReminders(
  items: LibraryItem[],
  opts: { now?: number; allEpisodes?: boolean } = {},
): Promise<Reminders> {
  const now = opts.now ?? Date.now();
  const today = isoDay(now);
  const since = isoDay(now - RECENT_DAYS * DAY);
  const horizon = isoDay(now + 400 * DAY);
  const out: Reminder[] = [];

  // Releases: refresh dates from the provider since games and books slip.
  const releases = items
    .filter(
      (i) =>
        i.mediaType !== "tv" &&
        (i.status === "backlog" || i.status === "in_progress") &&
        (i.releaseDate ? i.releaseDate >= isoDay(now - 60 * DAY) : i.mediaType === "game" && i.status === "backlog"),
    )
    .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"))
    .slice(0, 24);

  const shows = items
    .filter((i) => i.mediaType === "tv" && i.status !== "dropped")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);

  const [releaseDetails, showDetails] = await Promise.all([
    mapLimited(releases, 6, detailOf),
    mapLimited(shows, 6, detailOf),
  ]);

  releases.forEach((item, i) => {
    const date = releaseDetails[i]?.releaseDate ?? item.releaseDate;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > horizon) return;
    // Recent releases only matter if you haven't started them.
    if (date < since || (date <= today && item.status !== "backlog")) return;
    out.push({ key: `${item.mediaType}:${item.externalId}:release`, kind: "release", date, media: { ...cardFromItem(item), releaseDate: date } });
  });

  await mapLimited(shows, 4, async (item) => {
    const d = showDetails[shows.indexOf(item)];
    if (!d) return;
    const watching = item.status === "in_progress";
    // Not watching yet (or finished): only a first episode — a new show or season — is news.
    const relevant = (ep: EpisodeRef) => watching || ep.episode === 1;

    // First-ever premiere of a show you want to watch.
    if (item.status === "backlog" && d.releaseDate && d.releaseDate > today && !d.lastEpisode) {
      out.push({ key: `tv:${item.externalId}:release`, kind: "premiere", date: d.releaseDate, media: cardFromItem(item), season: 1, episode: 1 });
      return;
    }

    const last = d.lastEpisode;
    if (last?.airDate && last.airDate >= since && last.airDate <= today && relevant(last) && !isWatched(item, last)) {
      out.push(episodeReminder(item, last, last.airDate));
    }

    const next = d.nextEpisode;
    if (!next?.airDate || next.airDate < today || next.airDate > horizon) return;
    if (opts.allEpisodes && watching) {
      try {
        const season = await getSeason(item.externalId, next.season);
        season.episodes
          .filter((e) => e.airDate && e.airDate >= today && e.number >= next.episode)
          .slice(0, 26)
          .forEach((e) =>
            out.push(episodeReminder(item, { season: next.season, episode: e.number, airDate: e.airDate, name: e.name }, e.airDate!)),
          );
        return;
      } catch {
        // Fall through to just the next episode.
      }
    }
    if (relevant(next)) out.push(episodeReminder(item, next, next.airDate));
  });

  const seen = new Set<string>();
  const unique = out.filter((r) => !seen.has(r.key) && seen.add(r.key));
  return {
    recent: unique.filter((r) => r.date <= today).sort((a, b) => b.date.localeCompare(a.date)),
    upcoming: unique.filter((r) => r.date > today).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** One line describing what happens, e.g. "S2 E5 · The We We Are" or "Season 3 premiere". */
export function reminderDetail(r: Reminder): string {
  if (r.kind === "release") {
    return { movie: "Movie release", book: "Book release", game: "Game release", tv: "Series premiere" }[r.media.type];
  }
  if (r.kind === "premiere") return r.season === 1 ? "Series premiere" : `Season ${r.season} premiere`;
  return `S${r.season} E${r.episode}${r.episodeName ? ` · ${r.episodeName}` : ""}`;
}

/** Upcoming reminders landing in the next `days` days. */
export function withinDays(upcoming: Reminder[], days: number, now = Date.now()) {
  const until = isoDay(now + days * DAY);
  return upcoming.filter((r) => r.date <= until);
}
