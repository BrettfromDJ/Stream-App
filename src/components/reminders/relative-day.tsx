"use client";

import { FriendlyDate } from "@/components/ui/friendly-date";

/** Reminder dates: "Today", "Tomorrow", "Friday", "In 12 days", "3 days ago". */
export function RelativeDay({ date, past }: { date: string; past?: boolean }) {
  return <FriendlyDate date={date} past={past} />;
}
