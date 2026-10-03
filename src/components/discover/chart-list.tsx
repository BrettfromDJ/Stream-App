import Link from "next/link";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { mediaHref } from "@/lib/media/labels";
import type { MediaSearchResult } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";

function Movement({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (!lastRank) return <span className="text-[10.5px] font-bold tracking-wide text-star">NEW</span>;
  const diff = lastRank - rank;
  if (diff > 0)
    return (
      <span className="flex items-center text-[11.5px] font-semibold text-success tabular-nums">
        <ArrowUp className="size-3" strokeWidth={3} />
        {diff}
      </span>
    );
  if (diff < 0)
    return (
      <span className="flex items-center text-[11.5px] font-semibold text-danger tabular-nums">
        <ArrowDown className="size-3" strokeWidth={3} />
        {-diff}
      </span>
    );
  return <Minus className="size-3 text-fg-3" strokeWidth={3} />;
}

/** Numbered chart: rank, movement since last week, small cover, title. Two columns on desktop. */
export async function ChartList({
  title,
  items,
  detail,
  limit = 10,
}: {
  title: string;
  items: MediaSearchResult[] | Promise<MediaSearchResult[]>;
  /** Secondary line, e.g. weeks on list or player count. */
  detail?: (item: MediaSearchResult) => string | null;
  limit?: number;
}) {
  const list = (await items).slice(0, limit);
  if (list.length < 5) return null;
  return (
    <section aria-label={title} className="cv-auto gutter">
      <h2 className="mb-3 display text-[26px] md:text-[32px]">{title}</h2>
      <ol className="grid gap-x-8 md:grid-cols-2">
        {list.map((item, i) => {
          const rank = Number(item.metadata?.rank) || i + 1;
          const lastRank = Number(item.metadata?.lastRank) || 0;
          const extra = detail?.(item);
          return (
            <li key={item.externalId} className={cn("border-b border-white/[0.06]", i === list.length - 1 && "border-0")}>
              <Link href={mediaHref(item.type, item.externalId)} className="group flex items-center gap-3.5 py-2.5">
                <span className="w-7 shrink-0 text-center text-[22px] font-bold tracking-[-0.04em] tabular-nums">{rank}</span>
                <span className="flex w-7 shrink-0 justify-center">
                  <Movement rank={rank} lastRank={lastRank} />
                </span>
                <span className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-[7px] ring-1 ring-white/[0.08]">
                  <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="48px" compactFallback />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-4">
                    {item.title}
                  </span>
                  <span className="block truncate text-[13px] text-fg-2">
                    {[item.subtitle, extra].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
