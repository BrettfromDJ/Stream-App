"use client";

import Link from "next/link";
import { Check, Ellipsis, Plus } from "lucide-react";
import { mediaHref } from "@/lib/media/labels";
import type { CardData } from "@/lib/media/card";
import { useQuickActions } from "@/components/library/quick-actions";
import { cn } from "@/lib/utils";
import { Artwork } from "./artwork";
import { RatingBadge } from "./rating-badge";
import { useLongPress } from "./use-long-press";

interface MediaCardProps {
  media: CardData;
  /** CSS width hint for the artwork, e.g. "(min-width: 1024px) 180px, 38vw". */
  sizes: string;
  priority?: boolean;
  className?: string;
  showRating?: boolean;
  /** Mark titles that are already in the library (discovery rows / search). */
  showInLibrary?: boolean;
  /** Top-10 style: a large outlined number beside the poster, no caption. */
  rank?: number;
  /** Small label on the artwork, e.g. a release date. */
  badge?: string | null;
}

/** Poster card: artwork first, quiet caption, quick actions on hover / long-press. */
export function MediaCard({ media, sizes, priority, className, showRating = true, showInLibrary, rank, badge }: MediaCardProps) {
  const quick = useQuickActions();
  const openQuick = quick ? () => quick.open(media) : undefined;
  const longPress = useLongPress(openQuick);
  // Landscape art cropped into a portrait card needs a wider source image.
  const artSizes = media.landscape ? widen(sizes) : sizes;
  const ranked = rank != null;

  const body = (
    <div className="relative min-w-0 flex-1">
      <Link
        href={mediaHref(media.type, media.externalId)}
        aria-label={ranked ? `#${rank} ${media.title}` : undefined}
        className="block rounded-(--radius-card) outline-offset-4"
        {...longPress}
      >
        <div
          className={cn(
            "relative aspect-[2/3] overflow-hidden rounded-(--radius-card) bg-elevated-2",
            "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.06]",
            "transition-transform duration-300 ease-(--ease-out-soft) will-change-transform",
            "group-hover/card:scale-[1.035] group-active/card:scale-[0.97]",
          )}
        >
          <Artwork
            src={media.artworkUrl}
            title={media.title}
            type={media.type}
            sizes={artSizes}
            priority={priority}
            compactFallback={false}
          />
          {media.landscape && media.artworkUrl ? (
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
          ) : null}
          {showRating && media.rating ? <RatingBadge rating={media.rating} className="absolute bottom-2 left-2" /> : null}
          {badge ? (
            <span className="glass-chip absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tracking-tight text-fg">
              {badge}
            </span>
          ) : null}
          {showInLibrary && media.status ? (
            <span className="glass-chip absolute top-2 left-2 grid size-6 place-items-center rounded-full" aria-label="In your library">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
          ) : null}
        </div>
        {!ranked && (
          <div className="mt-2 px-0.5">
            <p className="truncate text-[13px] leading-tight font-medium text-fg md:text-[14px]">{media.title}</p>
            {media.year ? <p className="mt-0.5 text-[12px] text-fg-3 tabular-nums md:text-[13px]">{media.year}</p> : null}
          </div>
        )}
      </Link>

      {openQuick && (
        <button
          type="button"
          onClick={openQuick}
          aria-label={media.libraryId ? `Change status of ${media.title}` : `Add ${media.title} to library`}
          className={cn(
            "glass-chip absolute top-2 right-2 hidden size-8 place-items-center rounded-full text-fg transition-all duration-200 [@media(hover:hover)]:grid",
            "scale-90 opacity-0 group-hover/card:scale-100 group-hover/card:opacity-100 focus-visible:scale-100 focus-visible:opacity-100",
          )}
        >
          {media.libraryId ? <Ellipsis className="size-4" /> : <Plus className="size-4" strokeWidth={2.25} />}
        </button>
      )}
    </div>
  );

  if (!ranked) return <div className={cn("group/card relative min-w-0", className)}>{body}</div>;

  return (
    <div className={cn("group/card relative flex min-w-0 items-end", className)}>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none relative z-0 -mr-[6%] shrink-0 leading-[0.78] font-black tracking-[-0.08em] text-bg select-none",
          "text-[clamp(88px,26vw,168px)] md:text-[168px] xl:text-[180px]",
          "[-webkit-text-stroke:2px_rgba(255,255,255,0.42)] [paint-order:stroke]",
        )}
      >
        {rank}
      </span>
      <div className="relative z-10 w-[64%] shrink-0">{body}</div>
    </div>
  );
}

function widen(sizes: string) {
  return sizes
    .split(",")
    .map((part) => part.replace(/(\d+(?:\.\d+)?)(px|vw)\s*$/, (_, n: string, unit: string) => `${Math.round(Number(n) * 2.2)}${unit}`))
    .join(",");
}
