"use client";

import { useSyncExternalStore } from "react";

// The viewer's local date; re-checked once a minute so labels roll over at midnight.
let today = "";
const localIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const read = () => (today = localIso(new Date()));
function subscribe(cb: () => void) {
  const id = setInterval(() => {
    const before = today;
    if (read() !== before) cb();
  }, 60_000);
  return () => clearInterval(id);
}
const useToday = () => useSyncExternalStore(subscribe, () => today || read(), () => null);

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" });
const SHORT = fmt({ month: "short", day: "numeric" });
const SHORT_YEAR = fmt({ month: "short", day: "numeric", year: "numeric" });
const MONTH_YEAR = fmt({ month: "short", year: "numeric" });
const WEEKDAY = fmt({ weekday: "long" });
const WEEKDAY_SHORT = fmt({ weekday: "short" });
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** A calendar day (YYYY-MM-DD) as-is; a timestamp as the viewer's local day. */
function dayOf(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : localIso(d);
}

export type FriendlyVariant =
  /** Release days & episodes: "Today", "Tomorrow", "Friday", "In 12 days", "3 days ago". */
  | "event"
  /** Things that already happened: "Today", "Yesterday", "Tuesday", "Sep 12". */
  | "since"
  /** Tiny poster badges: "Today", "Tomorrow", "Fri", "Oct 3", "Mar 2027". */
  | "badge";

export function friendlyDate(day: string, now: string | null, variant: FriendlyVariant = "event", past = false): string {
  const sameYear = !now || day.slice(0, 4) === now.slice(0, 4);
  const plain = sameYear ? SHORT.format(ms(day)) : SHORT_YEAR.format(ms(day));
  if (!now) return variant === "badge" && !sameYear ? MONTH_YEAR.format(ms(day)) : plain;
  const diff = Math.round((ms(day) - ms(now)) / 86_400_000);

  if (diff === 0) return past ? "Out today" : "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (variant === "badge") {
    if (diff > 1 && diff < 7) return WEEKDAY_SHORT.format(ms(day));
    return sameYear ? SHORT.format(ms(day)) : MONTH_YEAR.format(ms(day));
  }
  if (variant === "since") {
    if (diff < 0 && diff > -7) return WEEKDAY.format(ms(day));
    return plain;
  }
  if (diff > 1 && diff < 7) return WEEKDAY.format(ms(day));
  if (diff >= 7 && diff <= 60) return `In ${diff} days`;
  if (diff < -1 && diff > -14) return `${-diff} days ago`;
  return plain;
}

interface Props {
  date: string;
  variant?: FriendlyVariant;
  /** Says "Out today" rather than "Today". */
  past?: boolean;
  /** Mid-sentence: "today", "tomorrow", "yesterday" in lowercase. */
  lower?: boolean;
}

/** A date written the way people say it, in the viewer's own time zone. */
export function FriendlyDate({ date, variant = "event", past, lower }: Props) {
  const now = useToday();
  const day = dayOf(date);
  if (!day) return null;
  const text = friendlyDate(day, now, variant, past);
  return (
    <time dateTime={day} suppressHydrationWarning>
      {lower && /^(Today|Tomorrow|Yesterday|In \d)/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text}
    </time>
  );
}
