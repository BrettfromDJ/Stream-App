import Link from "next/link";
import { mediaHref, TYPE_LABEL } from "@/lib/media/labels";
import { reminderDetail, type Reminder } from "@/lib/reminders/reminders";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";
import { RelativeDay } from "./relative-day";

/** Stacked rows: cover, title, what's happening, and when. */
export function ReminderList({ reminders, past }: { reminders: Reminder[]; past?: boolean }) {
  return (
    <ul className="overflow-hidden rounded-2xl bg-white/[0.04]">
      {reminders.map((r) => (
        <li key={r.key} className="border-b border-white/[0.06] last:border-0">
          <Link
            href={mediaHref(r.media.type, r.media.externalId)}
            className="flex items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
          >
            <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-[8px] bg-elevated-2 ring-1 ring-white/10">
              <Artwork src={r.media.artworkUrl} title={r.media.title} type={r.media.type} sizes="96px" compactFallback />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15.5px] font-semibold">{r.media.title}</p>
              <p className="truncate text-[13px] text-fg-2">
                <span className="text-fg-3">{TYPE_LABEL[r.media.type]} · </span>
                {reminderDetail(r)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap tabular-nums",
                past ? "bg-fg text-black" : "bg-white/[0.08] text-fg-2",
              )}
            >
              <RelativeDay date={r.date} past={past} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
