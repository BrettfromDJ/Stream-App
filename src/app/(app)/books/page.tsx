import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { exploreHref } from "@/lib/discover/taxonomy";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { ChartList } from "@/components/discover/chart-list";
import { GridBlock } from "@/components/discover/grid-block";
import { Spotlight } from "@/components/discover/spotlight";
import { ReleaseCalendar } from "@/components/discover/release-calendar";
import { GenreTiles, MoodTiles, genreTilesFor, moodTilesFor } from "@/components/explore/tiles";
import { CollectionRow, presetItems } from "@/components/explore/collection-row";
import { PickedForYou } from "@/components/discover/picked-for-you";
import { DiscoverActions } from "@/components/discover/discover-actions";


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

      <div className="mt-8 md:relative md:z-10 md:-mt-6">
        <Rows>
          <Lazy>
            <DiscoverRow title="What People Are Reading" items={trending.then((t) => t.slice(5))} />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={0} layout="chart" />
          </Lazy>
          <DiscoverActions types={["book"]} label="books" />
          <GenreTiles title="Browse by Genre" tiles={genreTilesFor("book")} allHref={exploreHref({ type: "book" })} />
          <Lazy>
            <PickedForYou types={["book"]} />
          </Lazy>
          <Lazy>
            <GridBlock
              title="New & Notable"
              subtitle="Recent releases readers are picking up"
              items={hub.then((h) => h.newReleases)}
              href={exploreHref({ type: "book", sort: "new" })}
            />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={1} layout="chart" />
          </Lazy>
          <MoodTiles title="What Are You in the Mood For?" tiles={moodTilesFor(["book"])} />
          <Lazy>
            <Spotlight eyebrow="Hidden Gem of the Day" items={presetItems("book", "hidden-gems")} />
          </Lazy>
          <Lazy>
            <ReleaseCalendar title="Coming Soon" items={hub.then((h) => h.anticipated)} months={6} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Highest Rated This Year" items={hub.then((h) => h.topThisYear)} />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="short-reads" />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="book-club" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Trending Today on Open Library" items={b.trendingToday()} />
          </Lazy>
          <Lazy>
            <Bestsellers charts={charts} index={2} layout="ranked" />
          </Lazy>
          <Lazy>
            <CollectionRow type="book" preset="hidden-gems" />
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

async function Bestsellers({
  charts,
  index,
  layout,
}: {
  charts: ReturnType<typeof b.bestsellers>;
  index: number;
  layout: "chart" | "ranked";
}) {
  const list = (await charts)[index];
  if (!list) return null;
  if (layout === "chart") {
    return (
      <ChartList
        title={list.title}
        items={list.books}
        detail={(i) => {
          const weeks = Number(i.metadata?.weeksOnList) || 0;
          return weeks > 1 ? `${weeks} weeks on the list` : weeks === 1 ? "New this week" : null;
        }}
      />
    );
  }
  return <DiscoverRow title={list.title} items={list.books} variant="ranked" />;
}
