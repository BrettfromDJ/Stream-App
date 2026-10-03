import { Suspense } from "react";
import { discovery } from "@/lib/providers";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { MediaSearchResult } from "@/lib/media/types";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { RowSkeleton } from "@/components/media/skeletons";
import { DiscoverRow } from "@/components/discover/discover-row";

const ROWS: { id: keyof typeof discovery; title: string; href?: string }[] = [
  { id: "trendingMovies", title: "Trending Movies", href: "/watch" },
  { id: "popularShows", title: "Popular Shows", href: "/watch" },
  { id: "newGames", title: "New Games", href: "/games" },
  { id: "popularBooks", title: "Popular Books", href: "/books" },
];

/** Discovery is secondary: each row streams in on its own and disappears if its provider fails. */
export function DiscoveryRows() {
  return (
    <>
      <Suspense fallback={<RowSkeleton />}>
        <NetflixRows />
      </Suspense>
      {ROWS.map((row) => (
        <Suspense key={row.id} fallback={<RowSkeleton />}>
          <DiscoveryRow {...row} />
        </Suspense>
      ))}
    </>
  );
}

async function DiscoveryRow({ id, title, href }: (typeof ROWS)[number]) {
  const [items, index] = await Promise.all([discovery[id]() as Promise<MediaSearchResult[]>, getLibraryIndex()]);
  if (!items.length) return null;
  return (
    <Row title={title} href={href}>
      {items.map((item) => (
        <MediaCard key={item.externalId} media={cardFromResult(item, index)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
      ))}
    </Row>
  );
}

const WEEK = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Netflix's official Top 10 for the latest week: shows, then movies. */
async function NetflixRows() {
  const top = await discovery.netflixTop10();
  if (!top) return null;
  const end = new Date(`${top.week}T00:00:00Z`);
  const start = new Date(end.getTime() - 6 * 86_400_000);
  const subtitle = `Most watched worldwide · ${WEEK.format(start)} – ${WEEK.format(end)}`;
  return (
    <>
      <DiscoverRow title="Top 10 Shows on Netflix" subtitle={subtitle} items={top.shows} variant="ranked" />
      <DiscoverRow title="Top 10 Movies on Netflix" subtitle={subtitle} items={top.movies} variant="ranked" />
    </>
  );
}
