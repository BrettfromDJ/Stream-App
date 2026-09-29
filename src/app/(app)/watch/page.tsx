import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { TYPE_LABEL } from "@/lib/media/labels";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { favoriteOf, notInLibrary } from "@/components/discover/personal";

export const metadata: Metadata = { title: "Movies & TV" };

const w = browse.watch;

export default function WatchPage() {
  // Start every request at once; each row streams in as its data arrives.
  const trending = w.trendingToday();
  return (
    <div className="animate-fade-in">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero
          items={trending}
          needsBackdrop
          eyebrow={(_, i) => `#${i + 1} Trending Today`}
          meta={(m) => [TYPE_LABEL[m.type], m.year ? String(m.year) : null]}
        />
      </Suspense>

      <div className="mt-8 md:-mt-6 md:relative md:z-10">
        <Rows>
          <Lazy>
            <BecauseYouLoved />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Top 10 Movies This Week" items={w.topMovies()} variant="ranked" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Top 10 Shows This Week" items={w.topShows()} variant="ranked" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Trending Today" items={trending.then((t) => t.slice(6))} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="New to Streaming" items={w.newToStreaming()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="In Theaters Now" items={w.inTheaters()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Coming Soon to Theaters" items={w.comingSoon()} dates />
          </Lazy>
          <Lazy>
            <DiscoverRow title="New Episodes This Week" items={w.airing()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Sci-Fi Movies" items={w.movieGenre(878)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Crime Shows" items={w.tvGenre(80)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Comedies" items={w.movieGenre(35)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Sci-Fi & Fantasy Shows" items={w.tvGenre(10765)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Horror" items={w.movieGenre(27)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Documentaries" items={w.movieGenre(99)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Great Movies" items={w.topRatedMovies()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Great Shows" items={w.topRatedShows()} />
          </Lazy>
        </Rows>
      </div>
    </div>
  );
}

async function BecauseYouLoved() {
  const fav = await favoriteOf(["movie", "tv"]);
  if (!fav) return null;
  const recs = await w.recommendations(fav.mediaType as "movie" | "tv", fav.externalId);
  return <DiscoverRow title={`Because You Loved ${fav.title}`} items={notInLibrary(recs)} />;
}
