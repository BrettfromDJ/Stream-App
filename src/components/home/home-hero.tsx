import Link from "next/link";
import { Search } from "lucide-react";
import { discovery } from "@/lib/providers";
import type { MediaSearchResult } from "@/lib/media/types";
import { Greeting, TodayLabel } from "./greeting";
import { PosterWall } from "./poster-wall";

function interleave(lists: MediaSearchResult[][], take: number) {
  const out: MediaSearchResult[] = [];
  for (let i = 0; out.length < take && lists.some((l) => l[i]); i++) {
    for (const l of lists) if (l[i]?.artworkUrl && out.length < take) out.push(l[i]);
  }
  return out;
}

/** Artwork-first welcome: drifting poster wall, greeting, a status line and a big search bar. */
export async function HomeHero({ status }: { status: string }) {
  const [movies, shows, games, books] = await Promise.all([
    discovery.trendingMovies(),
    discovery.popularShows(),
    discovery.newGames(),
    discovery.popularBooks(),
  ]);
  const pool = interleave([movies, shows, games, books], 36);
  const rows = pool.length >= 12 ? [pool.slice(0, 12), pool.slice(12, 24), pool.slice(24, 36)].filter((r) => r.length >= 6) : [];

  return <HeroFrame status={status} wall={rows.length ? <PosterWall rows={rows} /> : null} />;
}

/** Same layout without artwork (loading state / providers down). */
export function HeroFrame({ status, wall }: { status: string; wall?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      {wall}
      <div className="gutter relative flex min-h-[400px] flex-col justify-end pt-[calc(var(--nav-h)+2.5rem)] pb-8 md:min-h-[460px] md:pb-10">
        <p className="text-[13px] font-semibold tracking-[0.1em] text-fg-2 uppercase">
          <TodayLabel />
        </p>
        <h1 className="mt-1.5 text-[40px] leading-[1.02] font-bold tracking-[-0.035em] md:text-[56px]">
          <Greeting />
        </h1>
        <p className="mt-2 max-w-md text-[16px] leading-snug text-fg-2 md:text-[18px]">{status}</p>
        <Link
          href="/search"
          className="glass mt-6 flex h-14 w-full max-w-xl items-center gap-3 rounded-[20px] px-5 text-[16px] text-fg-2 transition-transform active:scale-[0.99]"
        >
          <Search className="size-5 shrink-0 text-fg" strokeWidth={2.2} />
          <span className="truncate">
            <span className="sm:hidden">Search anything</span>
            <span className="hidden sm:inline">Search movies, shows, books & games</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
