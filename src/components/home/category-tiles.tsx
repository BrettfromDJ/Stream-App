import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { discovery } from "@/lib/providers";
import type { MediaSearchResult } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";

const TILES = [
  { href: "/watch", label: "Movies & TV", blurb: "Trending, streaming & coming soon", hue: 12, load: () => Promise.all([discovery.trendingMovies(), discovery.popularShows()]).then(([a, b]) => [a[0], b[0], a[1]]) },
  { href: "/books", label: "Books", blurb: "Bestsellers & what people are reading", hue: 35, load: () => discovery.popularBooks().then((l) => l.slice(0, 3)) },
  { href: "/games", label: "Games", blurb: "New releases, charts & countdowns", hue: 265, load: () => discovery.newGames().then((l) => l.slice(0, 3)) },
];

/** Visual doorways into each tab: a fan of trending covers over a tinted card. */
export async function CategoryTiles() {
  const fans = await Promise.all(TILES.map((t) => t.load().then((l) => l.filter((x): x is MediaSearchResult => Boolean(x?.artworkUrl)))));
  return (
    <section aria-label="Browse" className="gutter grid gap-3 md:grid-cols-3">
      {TILES.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          className="group relative flex h-[140px] overflow-hidden rounded-[22px] ring-1 ring-white/[0.07] transition-transform active:scale-[0.99] md:h-[190px]"
          style={{
            background: `radial-gradient(120% 120% at 100% 0%, hsl(${t.hue} 50% 30% / 0.8), transparent 60%), linear-gradient(135deg, hsl(${t.hue} 25% 16%), hsl(${t.hue} 20% 9%))`,
          }}
        >
          <div className="relative z-10 flex flex-col justify-end p-5">
            <p className="text-[22px] leading-tight font-bold tracking-[-0.025em]">{t.label}</p>
            <p className="mt-1 max-w-[9.5rem] text-[13px] leading-snug text-fg-2 md:max-w-[11rem]">{t.blurb}</p>
            <ArrowRight className="mt-3 size-5 text-fg-2 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="absolute top-[14%] right-3 h-full w-[44%] md:w-[48%]">
            {fans[i].slice(0, 3).map((item, j) => (
              <div
                key={item.externalId}
                className="absolute top-0 aspect-[2/3] w-[46%] overflow-hidden rounded-[10px] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1"
                style={{
                  right: `${j * 26}%`,
                  transform: `rotate(${(j - 1) * -8}deg) translateY(${j === 1 ? 0 : 10}px)`,
                  zIndex: 3 - j,
                }}
              >
                <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="110px" compactFallback />
              </div>
            ))}
          </div>
        </Link>
      ))}
    </section>
  );
}
