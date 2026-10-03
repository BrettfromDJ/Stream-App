import Link from "next/link";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { exploreHref, genresFor, presetsFor } from "@/lib/discover/taxonomy";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { blockStyle, ColorBlock } from "@/components/editorial/color-block";
import { presetItems } from "./collection-row";

export interface Tile {
  href: string;
  label: string;
  hue: number;
  blurb?: string;
  /** Mood/collection tiles: the preset whose covers decorate the card. */
  preset?: { type: MediaType; slug: string };
}

/** Genre doorways as flat print-style color blocks: a 2-row swipeable grid on phones, a wrapping grid on desktop. */
export function GenreTiles({ title, tiles, allHref }: { title: string; tiles: Tile[]; allHref?: string }) {
  return (
    <section aria-label={title}>
      <div className="gutter mb-3 flex items-baseline justify-between">
        <h2 className="display text-[26px] md:text-[32px]">{title}</h2>
        {allHref && (
          <Link href={allHref} className="text-[14px] font-medium text-fg-2 hover:text-fg">
            See all
          </Link>
        )}
      </div>
      <div className="no-scrollbar gutter snap-gutter grid auto-cols-[42vw] grid-flow-col grid-rows-2 gap-2 overflow-x-auto snap-x md:auto-cols-auto md:grid-flow-row md:grid-cols-4 md:grid-rows-none md:overflow-visible lg:grid-cols-6">
        {tiles.map((t, i) => {
          const { color, shape } = blockStyle(i);
          const [first, ...rest] = t.label.split(" ");
          return (
            <Link key={t.href} href={t.href} className="snap-start transition-transform active:scale-[0.97]">
              <ColorBlock title={first} soft={rest.join(" ") || undefined} color={color} shape={shape} className="h-[112px] md:h-[128px]" />
            </Link>
          );
        })}
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
      <h2 className="gutter mb-3 display text-[26px] md:text-[32px]">{title}</h2>
      <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {tiles.map((t, i) => {
          const fan = covers?.[i] ?? [];
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "group relative flex aspect-square w-[64vw] shrink-0 snap-start flex-col justify-start overflow-hidden rounded-[10px] p-4",
                "transition-transform duration-300 active:scale-[0.98] sm:w-[40vw] md:w-[280px] md:hover:scale-[1.02]",
              )}
              style={{ background: blockStyle(i + 2).color }}
            >
              {fan.length > 0 && (
                <div aria-hidden className="absolute inset-x-0 bottom-[-6%] flex h-[56%] justify-center">
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
              <p className="display relative z-10 text-[24px] text-ink">{t.label}</p>
              {t.blurb && <p className="display relative z-10 mt-0.5 line-clamp-2 text-[17px] leading-[1.05] text-ink/45">{t.blurb}</p>}
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
