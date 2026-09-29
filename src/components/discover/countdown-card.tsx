"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { CardData } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { useQuickActions } from "@/components/library/quick-actions";
import { Artwork } from "@/components/media/artwork";
import { useLongPress } from "@/components/media/use-long-press";
import { cn } from "@/lib/utils";

/* One shared 1-second clock for every countdown on the page. */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const useNow = () => useSyncExternalStore(subscribe, () => now, () => null);

const DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

function releaseTime(date: string) {
  // Local midnight on release day.
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

const SIZES = "(min-width: 1024px) 420px, (min-width: 768px) 46vw, 82vw";

/** Wide card with a live countdown to release day. */
export function CountdownCard({ media }: { media: CardData }) {
  const current = useNow();
  const quick = useQuickActions();
  const longPress = useLongPress(quick ? () => quick.open(media) : undefined);
  const target = media.releaseDate ? releaseTime(media.releaseDate) : null;
  const remaining = target != null && current != null ? Math.max(0, target - current) : null;
  const wide = media.backdropUrl;

  const parts =
    remaining == null
      ? null
      : [
          { value: Math.floor(remaining / 86_400_000), label: "days" },
          { value: Math.floor((remaining / 3_600_000) % 24), label: "hrs" },
          { value: Math.floor((remaining / 60_000) % 60), label: "min" },
          { value: Math.floor((remaining / 1000) % 60), label: "sec" },
        ];

  return (
    <Link href={mediaHref(media.type, media.externalId)} className="group/cd block rounded-[18px] outline-offset-4" {...longPress}>
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-[18px] bg-elevated-2 ring-1 ring-white/[0.07]",
          "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-(--ease-out-soft)",
          "group-hover/cd:scale-[1.02] group-active/cd:scale-[0.98]",
        )}
      >
        {wide ? (
          <Artwork src={wide} title={media.title} type={media.type} sizes={SIZES} compactFallback />
        ) : (
          <Artwork
            src={media.artworkUrl}
            title={media.title}
            type={media.type}
            sizes="200px"
            compactFallback
            imageClassName="scale-125 blur-2xl saturate-150 opacity-70"
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

        {media.artworkUrl && (
          <div className="absolute top-3 right-3 aspect-[2/3] w-[22%] overflow-hidden rounded-[8px] shadow-xl ring-1 ring-white/15 md:top-4 md:right-4">
            <Artwork src={media.artworkUrl} title={media.title} type={media.type} sizes="120px" />
          </div>
        )}

        {media.releaseDate && (
          <span className="glass-chip absolute top-3 left-3 rounded-full px-2.5 py-1 text-[12px] font-semibold md:top-4 md:left-4">
            {DATE.format(new Date(releaseTime(media.releaseDate)))}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <p className="line-clamp-1 text-[18px] leading-tight font-semibold tracking-[-0.02em] md:text-[20px]">{media.title}</p>
          <div className="mt-2.5 flex gap-1.5" aria-label="Time until release">
            {(parts ?? [null, null, null, null]).map((p, i) => (
              <div key={i} className="glass-chip min-w-[3.25rem] rounded-[10px] px-2 py-1.5 text-center">
                <p className="text-[18px] leading-none font-bold tracking-[-0.02em] tabular-nums md:text-[20px]">
                  {p ? String(p.value).padStart(i === 0 ? 1 : 2, "0") : "–"}
                </p>
                <p className="mt-1 text-[9.5px] font-semibold tracking-[0.08em] text-fg-2 uppercase">
                  {p?.label ?? ["days", "hrs", "min", "sec"][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
