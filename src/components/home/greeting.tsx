"use client";

import { useSyncExternalStore } from "react";

function greeting(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const subscribe = () => () => {};

/** Uses the viewer's local time; falls back to "My Library" during server render. */
export function Greeting() {
  const text = useSyncExternalStore(
    subscribe,
    () => greeting(new Date().getHours()),
    () => "My Library",
  );
  return <>{text}</>;
}

const TODAY = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

export function TodayLabel() {
  const text = useSyncExternalStore(
    subscribe,
    () => TODAY.format(new Date()),
    () => "\u00a0",
  );
  return <>{text}</>;
}
