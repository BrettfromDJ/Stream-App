import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { mediaHref } from "@/lib/media/labels";
import type { LibraryItem } from "@/lib/media/types";
import { getReminders, reminderDetail, withinDays } from "@/lib/reminders/reminders";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";
import { RelativeDay } from "./relative-day";

/** Home strip: what just came out and what lands this week. Hidden when there's nothing. */
export async function HeadsUp({ items }: { items: LibraryItem[] }) {
  const { recent, upcoming } = await getReminders(items);
  const list = [...recent.slice(0, 6).map((r) => ({ r, past: true })), ...withinDays(upcoming, 7).map((r) => ({ r, past: false }))].slice(0, 10);
  if (!list.length) return null;

  return (
    <section aria-label="Heads up" className="cv-auto">
      <div className="gutter mb-3">
        <Link href="/reminders" className="group/title -my-1 inline-flex items-center gap-0.5 py-1">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">Heads Up</h2>
          <ChevronRight aria-hidden className="size-5 text-fg-3 transition-transform group-hover/title:translate-x-0.5" strokeWidth={2.5} />
        </Link>
      </div>
      <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
        {list.map(({ r, past }) => (
          <Link
            key={r.key}
            href={mediaHref(r.media.type, r.media.externalId)}
            className="flex w-[78vw] max-w-[320px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 pr-3.5 ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-[8px] bg-elevated-2">
              <Artwork src={r.media.artworkUrl} title={r.media.title} type={r.media.type} sizes="96px" compactFallback />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[11.5px] font-bold tracking-[0.06em] uppercase", past ? "text-success" : "text-fg-3")}>
                <RelativeDay date={r.date} past={past} />
              </p>
              <p className="truncate text-[15px] font-semibold">{r.media.title}</p>
              <p className="truncate text-[12.5px] text-fg-2">{reminderDetail(r)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
