import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { GenreTiles, MoodTiles, genreTilesFor, moodTilesFor } from "@/components/explore/tiles";
import { CollectionRow } from "@/components/explore/collection-row";
import { exploreHref } from "@/lib/discover/taxonomy";


export const metadata: Metadata = { title: "Books" };

const b = browse.books;

export default function BooksPage() {
  const trending = b.trending();
  const hub = b.hub();
  const charts = b.bestsellers();
  const genres = b.genres();
  return (
    <div className="animate-fade-in">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero
          items={trending}
          count={5}
          eyebrow={(_, i) => (i === 0 ? "Most Read This Month" : `#${i + 1} This Month`)}
          meta={(m) => [m.subtitle, m.year ? String(m.year) : null]}
        />
      </Suspense>

      <div className="mt-8 md:-mt-6 md:relative md:z-10">
        <Rows>
          <Lazy>
            <DiscoverRow title="What People Are Reading" items={trending.then((t) => t.slice(5))} />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={0} />
          </Lazy>
          <GenreTiles title="Browse by Genre" tiles={genreTilesFor("book")} allHref={exploreHref({ type: "book" })} />
          <Lazy>
            <DiscoverRow title="New & Notable" items={hub.then((h) => h.newReleases)} href={exploreHref({ type: "book", sort: "new" })} />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={1} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Most Anticipated" items={hub.then((h) => h.anticipated)} dates />
          </Lazy>
          <MoodTiles title="What Are You in the Mood For?" tiles={moodTilesFor(["book"])} />
          <Lazy>
            <DiscoverRow title="Highest Rated This Year" items={hub.then((h) => h.topThisYear)} />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="short-reads" />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="hidden-gems" />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="book-club" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Trending Today on Open Library" items={b.trendingToday()} />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={2} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Fantasy" items={genres.then((g) => g.fantasy)} href={exploreHref({ type: "book", genre: "fantasy" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Science Fiction" items={genres.then((g) => g.scifi)} href={exploreHref({ type: "book", genre: "scifi" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Mystery & Thrillers" items={genres.then((g) => g.thriller)} href={exploreHref({ type: "book", genre: "thriller" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Romance" items={genres.then((g) => g.romance)} href={exploreHref({ type: "book", genre: "romance" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Most Loved of All Time" items={hub.then((h) => h.allTime)} href={exploreHref({ type: "book" })} />
          </Lazy>
        </Rows>
      </div>
    </div>
  );
}

async function Bestsellers({ charts, index }: { charts: ReturnType<typeof b.bestsellers>; index: number }) {
  const list = (await charts)[index];
  if (!list) return null;
  return <DiscoverRow title={list.title} items={list.books} variant="ranked" />;
}
