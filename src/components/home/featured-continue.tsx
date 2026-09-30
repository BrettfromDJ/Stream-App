import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { mediaHref } from "@/lib/media/labels";
import { statusLabel } from "@/lib/media/status";
import type { LibraryItem } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { progressLabel, progressPercent } from "@/lib/media/progress";

/** The one thing you're most likely to go back to, given pride of place. */
export function FeaturedContinue({ item }: { item: LibraryItem }) {
  const wide = item.backdropUrl ?? (item.mediaType === "game" ? item.artworkUrl : null);
  const progress = item.progress;
  const percent = progressPercent(progress);
  const detail = progressLabel(progress) ?? item.subtitle;
  const verb = item.mediaType === "book" ? "reading" : item.mediaType === "game" ? "playing" : "watching";

  return (
    <section className="gutter" aria-label="Pick up where you left off">
      <Link
        href={mediaHref(item.mediaType, item.externalId)}
        className="group relative block overflow-hidden rounded-[24px] bg-elevated ring-1 ring-white/[0.08] transition-transform active:scale-[0.99]"
      >
        <div className="relative aspect-[4/3] sm:aspect-[16/8] lg:aspect-[16/6]">
          {wide ? (
            <Image
              src={wide}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 1100px, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <>
              <Artwork src={item.artworkUrl} title={item.title} type={item.mediaType} sizes="300px" imageClassName="scale-125 blur-2xl opacity-60" compactFallback />
              {item.artworkUrl && (
                <div className="absolute top-[10%] right-[6%] bottom-[10%] aspect-[2/3] overflow-hidden rounded-[12px] shadow-2xl ring-1 ring-white/10">
                  <Artwork src={item.artworkUrl} title={item.title} type={item.mediaType} sizes="(min-width: 768px) 240px, 40vw" priority />
                </div>
              )}
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
            <p className="text-[12px] font-bold tracking-[0.12em] text-fg-2 uppercase">Pick up where you left off</p>
            <h2 className="mt-1 max-w-[80%] text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[40px]">{item.title}</h2>
            <p className="mt-1.5 text-[14px] text-fg-2 md:text-[15px]">
              {[statusLabel(item.status, item.mediaType), detail].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-semibold text-black">
                <Play className="size-4 fill-current" /> Keep {verb}
              </span>
              {percent != null && percent > 0 && (
                <span className="flex min-w-0 flex-1 items-center gap-3 md:max-w-xs">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <span className="block h-full rounded-full bg-fg" style={{ width: `${Math.min(100, percent)}%` }} />
                  </span>
                  <span className="text-[12.5px] font-semibold text-fg-2 tabular-nums">{Math.round(percent)}%</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
