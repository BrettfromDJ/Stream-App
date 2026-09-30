"use client";

import { useSyncExternalStore } from "react";

// Day changes are rare; checking once a minute keeps labels right past midnight.
let today = "";
const read = () => {
  const d = new Date();
  today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return today;
};
function subscribe(cb: () => void) {
  const id = setInterval(() => {
    const before = today;
    if (read() !== before) cb();
  }, 60_000);
  return () => clearInterval(id);
}
const useToday = () => useSyncExternalStore(subscribe, () => today || read(), () => null);

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** "Today", "Tomorrow", "Friday", "In 12 days", "3 days ago" — in the viewer's own time zone. */
export function RelativeDay({ date, past }: { date: string; past?: boolean }) {
  const now = useToday();
  if (!now) return <>{SHORT.format(ms(date))}</>;
  const diff = Math.round((ms(date) - ms(now)) / 86_400_000);
  let label: string;
  if (diff === 0) label = past ? "Out today" : "Today";
  else if (diff === 1) label = "Tomorrow";
  else if (diff === -1) label = "Yesterday";
  else if (diff > 1 && diff < 7) label = WEEKDAY.format(ms(date));
  else if (diff >= 7 && diff <= 60) label = `In ${diff} days`;
  else if (diff < -1 && diff > -14) label = `${-diff} days ago`;
  else label = SHORT.format(ms(date));
  return <>{label}</>;
}
