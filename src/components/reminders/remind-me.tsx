"use client";

import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import type { CardData } from "@/lib/media/card";
import { buttonClasses } from "@/components/ui/button";
import { applyStatus, haptic } from "@/components/library/use-library-mutations";
import { RelativeDay } from "./relative-day";

/**
 * For titles that aren't out yet (or shows with an episode on the way):
 * one tap adds it to Want to, which is what puts it on the Reminders list and calendar.
 */
export function RemindMe({ media, date }: { media: CardData; date: string }) {
  const [on, setOn] = useOptimistic(Boolean(media.libraryId && media.status !== "dropped"));
  const [, startTransition] = useTransition();

  if (on) {
    return (
      <Link href="/reminders" className={buttonClasses("glass", "md", "max-md:h-[52px] max-md:text-[16px]")}>
        <BellRing /> {media.type === "tv" ? "Next Episode" : "Reminder On"}
        <span className="font-medium text-fg-2">
          · <RelativeDay date={date} />
        </span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={buttonClasses("glass", "md", "max-md:h-[52px] max-md:text-[16px]")}
      onClick={() => {
        haptic();
        startTransition(async () => {
          setOn(true);
          await applyStatus(media, "backlog");
        });
      }}
    >
      <Bell /> Remind Me
    </button>
  );
}
