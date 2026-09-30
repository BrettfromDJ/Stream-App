"use client";

import Link from "next/link";
import type { CardData } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { statusLabel } from "@/lib/media/status";
import { useQuickActions } from "@/components/library/quick-actions";
import { progressLabel, progressPercent } from "@/lib/media/progress";
import { cn } from "@/lib/utils";
import { Artwork } from "./artwork";
import { useLongPress } from "./use-long-press";

const SIZES = "(min-width: 1024px) 420px, (min-width: 768px) 46vw, 82vw";

/** Larger, landscape card for things currently in progress. */
export function ContinueCard({ media, priority }: { media: CardData; priority?: boolean }) {
  const quick = useQuickActions();
  const longPress = useLongPress(quick ? () => quick.open(media) : undefined);
  const wide = media.backdropUrl ?? (media.landscape ? media.artworkUrl : null);
  const percent = progressPercent(media.progress);
  const detail = progressLabel(media.progress) ?? media.subtitle;

  return (
    <Link
      href={mediaHref(media.type, media.externalId)}
      className="group/continue block rounded-[18px] outline-offset-4"
      {...longPress}
    >
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-[18px] bg-elevated-2 ring-1 ring-white/[0.07]",
          "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-(--ease-out-soft)",
          "group-hover/continue:scale-[1.02] group-active/continue:scale-[0.98]",
        )}
      >
        {wide ? (
          <Artwork src={wide} title={media.title} type={media.type} sizes={SIZES} priority={priority} compactFallback />
        ) : (
          // Portrait-only artwork (books, some shows): blurred wash + inset cover.
          <>
            <Artwork
              src={media.artworkUrl}
              title={media.title}
              type={media.type}
              sizes="200px"
              compactFallback
              imageClassName="scale-125 blur-2xl saturate-150 opacity-70"
            />
            {media.artworkUrl && (
              <div className="absolute top-[9%] right-[6%] bottom-[9%] aspect-[2/3] overflow-hidden rounded-[10px] shadow-2xl ring-1 ring-white/10">
                <Artwork src={media.artworkUrl} title={media.title} type={media.type} sizes="(min-width: 768px) 180px, 34vw" />
              </div>
            )}
          </>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <p className="text-[12px] font-semibold tracking-[0.06em] text-fg-2 uppercase">
            {media.status ? statusLabel(media.status, media.type) : null}
          </p>
          <p className="mt-0.5 line-clamp-2 max-w-[70%] text-[19px] leading-tight font-semibold tracking-[-0.02em] text-balance md:text-[21px]">
            {media.title}
          </p>
          {detail ? <p className="mt-1 truncate text-[13px] text-fg-2">{detail}</p> : null}
          {percent != null && (
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-fg" style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
