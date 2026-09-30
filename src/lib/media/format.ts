export function yearFrom(date?: string | null): number | null {
  if (!date) return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

export function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Formats a date-only value (YYYY-MM-DD) without timezone drift. */
export function formatDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date.length === 10 ? `${date}T00:00:00Z` : date);
  return Number.isNaN(d.getTime()) ? null : LONG_DATE.format(d);
}

export function formatShortDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : SHORT_DATE.format(d);
}

/** Normalizes partial dates ("2019", "2019-05") to a sortable YYYY-MM-DD, or null. */
export function normalizeDate(input?: string | null): string | null {
  if (!input) return null;
  const iso = input.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (iso) return `${iso[1]}-${iso[2] ?? "01"}-${iso[3] ?? "01"}`;
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const year = input.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return year ? `${year[1]}-01-01` : null;
}

export function formatRating(rating?: number | null) {
  if (rating == null) return null;
  return Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Strips HTML / markdown-ish noise some providers include in descriptions. */
export function cleanDescription(text?: string | null): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/-{3,}[\s\S]*$/, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned || null;
}

/** Days since the epoch — for "pick of the day" rotation that stays stable within a day. */
export function dayNumber() {
  return Math.floor(Date.now() / 86_400_000);
}
