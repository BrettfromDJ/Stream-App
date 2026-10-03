import type { Metadata } from "next";
import { Suspense } from "react";
import { discovery, searchAll, type SearchFilter } from "@/lib/providers";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import { isMediaType, type MediaSearchResult } from "@/lib/media/types";
import { SearchView } from "@/components/search/search-view";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { RowSkeleton } from "@/components/media/skeletons";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const type: SearchFilter = isMediaType(params.type) ? params.type : "all";
  const [index, initial] = await Promise.all([
    getLibraryIndex(),
    q.length >= 2 ? searchAll(q, type) : Promise.resolve(null),
  ]);

  return (
    <SearchView initialQuery={q} initialType={type} initialResults={initial} libraryIndex={index}>
      <Suspense fallback={<BrowseSkeleton />}>
        <Browse type={type} />
      </Suspense>
    </SearchView>
  );
}

const BROWSE: Record<SearchFilter, { title: string; load: () => Promise<MediaSearchResult[]> }[]> = {
  all: [
    { title: "Trending Movies", load: discovery.trendingMovies },
    { title: "Trending Shows", load: discovery.trendingShows },
    { title: "Popular Books", load: discovery.popularBooks },
    { title: "New Games", load: discovery.newGames },
  ],
  movie: [
    { title: "Trending Movies", load: discovery.trendingMovies },
    { title: "New in Theaters", load: discovery.nowPlaying },
    { title: "Coming Soon", load: discovery.upcoming },
  ],
  tv: [
    { title: "Trending Shows", load: discovery.trendingShows },
    { title: "Popular Shows", load: discovery.popularShows },
    { title: "Currently Airing", load: discovery.airing },
  ],
  book: [{ title: "Popular Books", load: discovery.popularBooks }],
  game: [
    { title: "New Games", load: discovery.newGames },
    { title: "Highly Rated This Year", load: discovery.popularGames },
    { title: "Most Anticipated", load: discovery.upcomingGames },
  ],
};

/** What Search shows before you type: browsable rows for the current filter. */
async function Browse({ type }: { type: SearchFilter }) {
  const [index, ...rows] = await Promise.all([getLibraryIndex(), ...BROWSE[type].map((r) => r.load())]);
  const visible = BROWSE[type].map((r, i) => ({ ...r, items: rows[i] })).filter((r) => r.items.length);

  if (!visible.length) {
    return (
      <p className="gutter pt-10 text-[15px] text-fg-2">
        Search across movies, shows, books and games.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-9 md:gap-11">
      {visible.map((row) => (
        <Row key={row.title} title={row.title}>
          {row.items.map((item) => (
            <MediaCard key={item.externalId} media={cardFromResult(item, index)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
          ))}
        </Row>
      ))}
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="flex flex-col gap-9">
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}
