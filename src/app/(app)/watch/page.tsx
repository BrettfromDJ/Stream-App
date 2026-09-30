import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { TYPE_LABEL } from "@/lib/media/labels";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { favoriteOf, notInLibrary } from "@/components/discover/personal";
import { GenreTiles, MoodTiles, genreTilesFor, moodTilesFor } from "@/components/explore/tiles";
import { CollectionRow } from "@/components/explore/collection-row";
import { ServiceRows } from "@/components/explore/service-rows";
import { exploreHref } from "@/lib/discover/taxonomy";


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
          <GenreTiles title="Browse by Genre" tiles={genreTilesFor("movie")} allHref={exploreHref({ type: "movie" })} />
          <Lazy>
            <DiscoverRow title="Top 10 Shows This Week" items={w.topShows()} variant="ranked" />
          </Lazy>
          <MoodTiles title="What Are You in the Mood For?" tiles={moodTilesFor(["movie", "tv"])} />
          <Lazy>
            <DiscoverRow title="Trending Today" items={trending.then((t) => t.slice(6))} />
          </Lazy>
          <Suspense fallback={null}>
            <ServiceRows />
          </Suspense>
          <Lazy>
            <DiscoverRow title="New to Streaming" items={w.newToStreaming()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="In Theaters Now" items={w.inTheaters()} />
          </Lazy>
          <Lazy>
            <CollectionRow type="movie" preset="short-and-sweet" />
          </Lazy>
          <Lazy>
            <CollectionRow type="tv" preset="limited-series" />
          </Lazy>
          <Lazy>
            <CollectionRow type="movie" preset="hidden-gems" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Coming Soon to Theaters" items={w.comingSoon()} dates />
          </Lazy>
          <Lazy>
            <CollectionRow type="movie" preset="critics-darlings" />
          </Lazy>
          <Lazy>
            <CollectionRow type="tv" preset="hidden-gems" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="New Episodes This Week" items={w.airing()} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Sci-Fi Movies" items={w.movieGenre(878)} href={exploreHref({ type: "movie", genre: "scifi" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Crime Shows" items={w.tvGenre(80)} href={exploreHref({ type: "tv", genre: "crime" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Comedies" items={w.movieGenre(35)} href={exploreHref({ type: "movie", genre: "comedy" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Sci-Fi & Fantasy Shows" items={w.tvGenre(10765)} href={exploreHref({ type: "tv", genre: "scifi" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Horror" items={w.movieGenre(27)} href={exploreHref({ type: "movie", genre: "horror" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Documentaries" items={w.movieGenre(99)} href={exploreHref({ type: "movie", genre: "documentary" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Great Movies" items={w.topRatedMovies()} href={exploreHref({ type: "movie", sort: "top" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Great Shows" items={w.topRatedShows()} href={exploreHref({ type: "tv", sort: "top" })} />
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
