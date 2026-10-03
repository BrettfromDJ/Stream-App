"use client";

import Link from "next/link";
import type { LibraryItem } from "@/lib/media/types";
import { cardFromItem } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { progressPercent } from "@/lib/media/progress";
import { formatRating } from "@/lib/media/format";
import { BookCover } from "@/components/detail/book-hero";
import { useQuickActions } from "@/components/library/quick-actions";
import { useLongPress } from "@/components/media/use-long-press";
import { cn } from "@/lib/utils";

const SIZES = "(min-width: 1280px) 12vw, (min-width: 1024px) 14vw, (min-width: 768px) 17vw, (min-width: 640px) 21vw, 28vw";

/**
 * Books as a bookcase: 3D covers standing on shelf ledges, row after row.
 * Each book carries its own stretch of shelf (overlapping into the gap), so rows read as one
 * continuous ledge at any column count.
 */
export function Bookshelf({ items }: { items: LibraryItem[] }) {
  return (
    <div className="gutter mt-6 grid grid-cols-3 gap-x-5 gap-y-9 sm:grid-cols-4 md:grid-cols-5 md:gap-x-8 lg:grid-cols-6 xl:grid-cols-7">
      {items.map((item, i) => (
        <ShelfBook key={item.id} item={item} priority={i < 6} />
      ))}
    </div>
  );
}

function ShelfBook({ item, priority }: { item: LibraryItem; priority: boolean }) {
  const quick = useQuickActions();
  const card = cardFromItem(item);
  const longPress = useLongPress(quick ? () => quick.open(card) : undefined);
  const percent = item.status === "in_progress" ? progressPercent(item.progress) : null;
  const author = Array.isArray(item.metadata.authors) ? (item.metadata.authors as string[])[0] : item.subtitle;

  return (
    <Link href={mediaHref("book", item.externalId)} className="group/book relative block min-w-0 outline-offset-4" {...longPress}>
      {/* The book, standing on the ledge */}
      <div className="relative px-[7%] pt-2">
        <BookCover
          src={item.artworkUrl}
          title={item.title}
          sizes={SIZES}
          priority={priority}
          size="sm"
          className="w-full transition-transform duration-300 ease-(--ease-out-soft) group-hover/book:-translate-y-1.5 group-active/book:-translate-y-0.5"
        />
        {item.rating ? (
          <span className="chip-solid absolute bottom-1.5 left-[calc(7%+6px)] inline-flex h-5 items-center gap-0.5 rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
            <span aria-hidden className="text-star">★</span>
            {formatRating(item.rating)}
          </span>
        ) : null}
      </div>

      {/* The ledge: lit top face, darker front edge, and a shadow cast on the wall below */}
      <div aria-hidden className="relative -mx-2.5 md:-mx-4">
        <div className="h-[7px] bg-gradient-to-b from-[#3a332c] to-[#2a241f] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] md:h-[9px]" />
        <div className="h-[6px] bg-gradient-to-b from-[#1d1915] to-[#141110] md:h-[8px]" />
        <div className="h-4 bg-gradient-to-b from-black/50 to-transparent" />
      </div>

      <div className="-mt-2 px-0.5">
        <p className="truncate text-[13px] leading-tight font-medium md:text-[14px]">{item.title}</p>
        {author ? <p className="mt-0.5 truncate text-[12px] text-fg-3 md:text-[12.5px]">{author}</p> : null}
        {percent != null && percent > 0 && (
          <div className={cn("mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/15")}>
            <div className="h-full rounded-full bg-fg" style={{ width: `${Math.min(100, percent)}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
