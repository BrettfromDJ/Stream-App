import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { exploreHref, genresFor, presetsFor } from "@/lib/discover/taxonomy";
import type { MediaType } from "@/lib/media/types";

export interface Tile {
  href: string;
  label: string;
  hue: number;
  blurb?: string;
}

function tileStyle(hue: number) {
  return {
    background: `radial-gradient(120% 140% at 100% 0%, hsl(${hue} 55% 34% / 0.9) 0%, transparent 55%), linear-gradient(135deg, hsl(${hue} 32% 20%), hsl(${(hue + 40) % 360} 26% 11%))`,
  };
}

/** Compact genre tiles: a 2-row swipeable grid on phones, a wrapping grid on desktop. */
export function GenreTiles({ title, tiles, allHref }: { title: string; tiles: Tile[]; allHref?: string }) {
  return (
    <section aria-label={title}>
      <div className="gutter mb-3 flex items-baseline justify-between">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
        {allHref && (
          <Link href={allHref} className="text-[14px] font-medium text-fg-2 hover:text-fg">
            See all
          </Link>
        )}
      </div>
      <div className="no-scrollbar gutter snap-gutter grid auto-cols-[40vw] grid-flow-col grid-rows-2 gap-2 overflow-x-auto snap-x md:auto-cols-auto md:grid-flow-row md:grid-cols-4 md:grid-rows-none md:overflow-visible lg:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative flex h-[68px] snap-start items-end overflow-hidden rounded-[14px] px-3.5 pb-3 ring-1 ring-white/[0.06] transition-transform active:scale-[0.97] md:h-[76px]"
            style={tileStyle(t.hue)}
          >
            <span className="relative text-[15px] leading-tight font-semibold tracking-[-0.01em] text-white/95">{t.label}</span>
            <ArrowRight
              aria-hidden
              className="absolute top-3 right-3 size-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Larger editorial mood cards with a one-line description. */
export function MoodTiles({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section aria-label={title}>
      <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
      <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "group relative flex aspect-[5/4] w-[62vw] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[20px] p-4 ring-1 ring-white/[0.06]",
              "transition-transform duration-300 active:scale-[0.98] sm:w-[40vw] md:w-[260px] md:hover:scale-[1.02]",
            )}
            style={tileStyle(t.hue)}
          >
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="relative text-[21px] leading-tight font-bold tracking-[-0.02em] text-white">{t.label}</p>
            {t.blurb && <p className="relative mt-1 line-clamp-2 text-[13.5px] leading-snug text-white/70">{t.blurb}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}


export function genreTilesFor(type: MediaType, limit = 12): Tile[] {
  return genresFor(type)
    .slice(0, limit)
    .map((g) => ({ href: exploreHref({ type, genre: g.slug }), label: g.label, hue: g.hue }));
}

export function moodTilesFor(types: MediaType[]): Tile[] {
  return presetsFor(types, "mood").map((p) => ({
    href: exploreHref({ type: p.type, preset: p.slug }),
    label: p.title,
    hue: p.hue,
    blurb: p.blurb,
  }));
}
