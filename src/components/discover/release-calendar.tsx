import Link from "next/link";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import type { MediaSearchResult } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const utc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** Buckets: This Week, Next Week, then by month. */
function bucketOf(date: Date, today: Date) {
  const startOfWeek = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY); // Monday
  const diff = Math.floor((date.getTime() - startOfWeek.getTime()) / DAY);
  if (diff < 7) return { key: "w0", label: "This Week" };
  if (diff < 14) return { key: "w1", label: "Next Week" };
  const sameYear = date.getUTCFullYear() === today.getUTCFullYear();
  return { key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, label: sameYear ? MONTH.format(date) : MONTH_YEAR.format(date) };
}

/** Upcoming releases grouped by week, then month. */
export async function ReleaseCalendar({
  title,
  items,
  months = 4,
}: {
  title: string;
  items: MediaSearchResult[] | Promise<MediaSearchResult[]>;
  months?: number;
}) {
  const [list, index] = await Promise.all([items, getLibraryIndex()]);
  const now = new Date();
  const today = utc(now.toISOString());
  const horizon = today.getTime() + months * 31 * DAY;
  const seen = new Set<string>();
  const upcoming = list
    .filter((i) => i.releaseDate && i.artworkUrl)
    .filter((i) => {
      const t = utc(i.releaseDate!).getTime();
      return t >= today.getTime() && t <= horizon && !seen.has(i.externalId) && seen.add(i.externalId);
    })
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!));
  if (upcoming.length < 3) return null;

  const groups: { key: string; label: string; items: MediaSearchResult[] }[] = [];
  for (const item of upcoming) {
    const b = bucketOf(utc(item.releaseDate!), today);
    const g = groups.find((x) => x.key === b.key);
    if (g) g.items.push(item);
    else groups.push({ ...b, items: [item] });
  }

  return (
    <section aria-label={title} className="cv-auto gutter">
      <h2 className="mb-4 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <div key={g.key} className="md:grid md:grid-cols-[140px_1fr] md:gap-6">
            <p className="mb-2 text-[13px] font-bold tracking-[0.08em] text-fg-3 uppercase md:mt-1">{g.label}</p>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {g.items.slice(0, 9).map((item) => {
                const d = utc(item.releaseDate!);
                const card = cardFromResult(item, index);
                return (
                  <li key={item.externalId}>
                    <Link
                      href={mediaHref(item.type, item.externalId)}
                      className="group flex items-center gap-3 rounded-2xl bg-white/[0.035] p-2 pr-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="flex w-11 shrink-0 flex-col items-center leading-none">
                        <span className="text-[10.5px] font-bold tracking-wide text-fg-3 uppercase">{WEEKDAY.format(d)}</span>
                        <span className="mt-1 text-[19px] font-bold tabular-nums">{d.getUTCDate()}</span>
                      </span>
                      <span className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-[6px] ring-1 ring-white/[0.08]">
                        <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="40px" compactFallback />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-semibold">{item.title}</span>
                        <span className={cn("block truncate text-[12.5px]", card.status ? "text-success" : "text-fg-2")}>
                          {card.status ? "In your library" : [item.subtitle, MONTH_DAY.format(d)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
