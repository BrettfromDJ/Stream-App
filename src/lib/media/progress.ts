import type { MediaProgress } from "./types";

export function progressLabel(p?: MediaProgress | null): string | null {
  if (!p) return null;
  switch (p.kind) {
    case "episode":
      if (p.done) return "All caught up";
      return p.watchedCount ? `Next: S${p.season} E${p.episode}` : `Start with S${p.season} E${p.episode}`;
    case "page":
      return p.totalPages ? `Page ${p.page} of ${p.totalPages}` : `Page ${p.page}`;
    case "hours":
      return `${p.hours} h played`;
    case "percent":
      return `${Math.round(p.percent)}%`;
  }
}

export function progressPercent(p?: MediaProgress | null): number | null {
  if (!p) return null;
  if (p.percent != null) return p.percent;
  if (p.kind === "page" && p.totalPages) return (p.page / p.totalPages) * 100;
  return null;
}
