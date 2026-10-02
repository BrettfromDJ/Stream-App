import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { exploreHref, genresFor, presetsFor } from "@/lib/discover/taxonomy";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { presetItems } from "./collection-row";

export interface Tile {
  href: string;
  label: string;
  hue: number;
  blurb?: string;
  /** Mood/collection tiles: the preset whose covers decorate the card. */
  preset?: { type: MediaType; slug: string };
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

/** Larger editorial mood cards: a fan of real covers from the collection, then the name and a one-liner. */
export function MoodTiles({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <Suspense fallback={<MoodTileRow title={title} tiles={tiles} />}>
      <MoodTilesWithArt title={title} tiles={tiles} />
    </Suspense>
  );
}

async function MoodTilesWithArt({ title, tiles }: { title: string; tiles: Tile[] }) {
  const covers = await Promise.all(
    tiles.map((t) =>
      t.preset
        ? presetItems(t.preset.type, t.preset.slug)
            .then((l) => l.filter((x) => x.artworkUrl).slice(0, 3))
            .catch(() => [])
        : Promise.resolve([]),
    ),
  );
  return <MoodTileRow title={title} tiles={tiles} covers={covers} />;
}

function MoodTileRow({ title, tiles, covers }: { title: string; tiles: Tile[]; covers?: MediaSearchResult[][] }) {
  return (
    <section aria-label={title}>
      <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
      <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {tiles.map((t, i) => {
          const fan = covers?.[i] ?? [];
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "group relative flex aspect-square w-[64vw] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[22px] p-4 ring-1 ring-white/[0.07]",
                "transition-transform duration-300 active:scale-[0.98] sm:w-[40vw] md:w-[280px] md:hover:scale-[1.02]",
              )}
              style={tileStyle(t.hue)}
            >
              {fan.length > 0 && (
                <div aria-hidden className="absolute inset-x-0 top-[9%] flex h-[58%] justify-center">
                  {fan.map((item, j) => {
                    const pos = fan.length === 1 ? 0 : j - (fan.length - 1) / 2;
                    return (
                      <div
                        key={item.externalId}
                        className="absolute top-0 aspect-[2/3] h-full overflow-hidden rounded-[10px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1"
                        style={{
                          transform: `translateX(${pos * 62}%) rotate(${pos * 9}deg) translateY(${Math.abs(pos) * 8}%) scale(${pos === 0 ? 1 : 0.9})`,
                          zIndex: 3 - Math.abs(pos),
                        }}
                      >
                        <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="120px" compactFallback />
                      </div>
                    );
                  })}
                </div>
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              <p className="relative text-[21px] leading-tight font-bold tracking-[-0.02em] text-white">{t.label}</p>
              {t.blurb && <p className="relative mt-1 line-clamp-2 text-[13.5px] leading-snug text-white/75">{t.blurb}</p>}
            </Link>
          );
        })}
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
    preset: { type: p.type, slug: p.slug },
  }));
}
