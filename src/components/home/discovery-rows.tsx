import { Suspense } from "react";
import { discovery } from "@/lib/providers";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { MediaSearchResult } from "@/lib/media/types";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { RowSkeleton } from "@/components/media/skeletons";

const ROWS: { id: keyof typeof discovery; title: string; href?: string }[] = [
  { id: "trendingMovies", title: "Trending Movies", href: "/search?type=movie" },
  { id: "popularShows", title: "Popular Shows", href: "/search?type=tv" },
  { id: "newGames", title: "New Games", href: "/search?type=game" },
  { id: "popularBooks", title: "Popular Books", href: "/search?type=book" },
  { id: "nowPlaying", title: "New in Theaters" },
  { id: "airing", title: "Currently Airing" },
  { id: "upcoming", title: "Coming Soon" },
];

/** Discovery is secondary: each row streams in on its own and disappears if its provider fails. */
export function DiscoveryRows() {
  return (
    <>
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
