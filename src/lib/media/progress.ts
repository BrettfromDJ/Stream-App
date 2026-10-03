import type { MediaProgress } from "./types";

export function formatHours(h: number) {
  const r = Math.round(h * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function progressLabel(p?: MediaProgress | null): string | null {
  if (!p) return null;
  switch (p.kind) {
    case "episode":
      if (p.done) return "All caught up";
      return p.watchedCount ? `Next: S${p.season} E${p.episode}` : `Start with S${p.season} E${p.episode}`;
    case "page":
      return p.totalPages ? `Page ${p.page} of ${p.totalPages}` : `Page ${p.page}`;
    case "hours":
      // Play-time tracking was retired; any saved hours stay in the data but aren't shown.
      return null;
    case "percent":
      return `${Math.round(p.percent)}% read`;
  }
}

export function progressPercent(p?: MediaProgress | null): number | null {
  if (!p) return null;
  if (p.kind === "hours") return null;
  if (p.percent != null) return p.percent;
  if (p.kind === "page" && p.totalPages) return (p.page / p.totalPages) * 100;
  return null;
}

/** The number a log tracks for this kind of progress. */
export function progressValue(p: MediaProgress): number {
  switch (p.kind) {
    case "page":
      return p.page;
    case "hours":
      return p.hours;
    case "percent":
      return p.percent;
    case "episode":
      return p.watchedCount ?? 0;
  }
}

const DAY = 86_400_000;
const dayMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/**
 * Average progress per day over the last month of activity (pages, hours or percent),
 * or null when there isn't enough history yet.
 */
export function dailyPace(p?: MediaProgress | null): number | null {
  if (!p || p.kind === "episode" || !p.log || p.log.length < 2) return null;
  const last = p.log[p.log.length - 1];
  const since = dayMs(last[0]) - 30 * DAY;
  const recent = p.log.filter(([d]) => dayMs(d) >= since);
  if (recent.length < 2) return null;
  const first = recent[0];
  const days = Math.max(1, (dayMs(last[0]) - dayMs(first[0])) / DAY);
  const perDay = (last[1] - first[1]) / days;
  return perDay > 0 ? perDay : null;
}

/** Days left at the current pace, when there's a finish line and a pace. */
export function daysToFinish(p?: MediaProgress | null): number | null {
  const pace = dailyPace(p);
  if (!p || !pace) return null;
  const remaining =
    p.kind === "page" && p.totalPages
      ? p.totalPages - p.page
      : p.kind === "percent"
        ? 100 - p.percent
        : p.kind === "hours" && p.targetHours
          ? p.targetHours - p.hours
          : null;
  if (remaining == null || remaining <= 0) return null;
  return Math.max(1, Math.ceil(remaining / pace));
}
