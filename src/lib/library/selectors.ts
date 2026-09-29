import type { LibraryItem, LibraryStatus, MediaType } from "@/lib/media/types";

export const SORTS = {
  added: "Recently Added",
  finished: "Recently Finished",
  rating_desc: "Highest Rated",
  rating_asc: "Lowest Rated",
  release_desc: "Newest Release",
  release_asc: "Oldest Release",
  title: "A–Z",
} as const;
export type SortKey = keyof typeof SORTS;

const time = (d: string | null) => (d ? new Date(d).getTime() : 0);

/** Items without a value always sort last, whatever the direction. */
function nullsLast<T>(a: T | null, b: T | null, cmp: (a: T, b: T) => number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return cmp(a, b);
}

export function sortItems(items: LibraryItem[], sort: SortKey): LibraryItem[] {
  const list = [...items];
  const byAdded = (a: LibraryItem, b: LibraryItem) => time(b.createdAt) - time(a.createdAt);
  const cmp: Record<SortKey, (a: LibraryItem, b: LibraryItem) => number> = {
    added: byAdded,
    finished: (a, b) => nullsLast(a.dateFinished, b.dateFinished, (x, y) => time(y) - time(x)) || byAdded(a, b),
    rating_desc: (a, b) => nullsLast(a.rating, b.rating, (x, y) => y - x) || byAdded(a, b),
    rating_asc: (a, b) => nullsLast(a.rating, b.rating, (x, y) => x - y) || byAdded(a, b),
    release_desc: (a, b) => nullsLast(a.releaseDate, b.releaseDate, (x, y) => y.localeCompare(x)),
    release_asc: (a, b) => nullsLast(a.releaseDate, b.releaseDate, (x, y) => x.localeCompare(y)),
    title: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", ignorePunctuation: true }),
  };
  return list.sort(cmp[sort]);
}

export function filterItems(items: LibraryItem[], type: MediaType | "all", status: LibraryStatus | "all") {
  return items.filter((i) => (type === "all" || i.mediaType === type) && (status === "all" || i.status === status));
}

export interface HomeSection {
  key: string;
  title: string;
  items: LibraryItem[];
  variant?: "continue";
  href?: string;
}

/** Library-first home sections. Empty sections are dropped. */
export function homeSections(items: LibraryItem[]): HomeSection[] {
  const recentFirst = (list: LibraryItem[], by: (i: LibraryItem) => string | null) =>
    [...list].sort((a, b) => time(by(b)) - time(by(a)));
  const of = (type: MediaType[], status: LibraryStatus) =>
    recentFirst(items.filter((i) => type.includes(i.mediaType) && i.status === status), (i) => i.createdAt);

  const continuing = recentFirst(
    items.filter((i) => i.status === "in_progress"),
    (i) => i.updatedAt,
  );
  const finished = recentFirst(
    items.filter((i) => i.status === "completed"),
    (i) => i.dateFinished ?? i.updatedAt,
  );
  const highlyRated = items
    .filter((i) => (i.rating ?? 0) >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || time(b.dateFinished) - time(a.dateFinished));

  const sections: HomeSection[] = [
    { key: "continue", title: "Continue", items: continuing, variant: "continue", href: "/library?status=in_progress" },
    { key: "recent", title: "Recently Added", items: recentFirst(items, (i) => i.createdAt).slice(0, 20), href: "/library" },
    { key: "want-watch", title: "Want to Watch", items: of(["movie", "tv"], "backlog"), href: "/library?status=backlog&type=movie" },
    { key: "want-read", title: "Want to Read", items: of(["book"], "backlog"), href: "/library?status=backlog&type=book" },
    { key: "want-play", title: "Want to Play", items: of(["game"], "backlog"), href: "/library?status=backlog&type=game" },
    { key: "finished", title: "Recently Finished", items: finished.slice(0, 20), href: "/library?status=completed&sort=finished" },
    { key: "top", title: "Highly Rated", items: highlyRated.slice(0, 20), href: "/library?sort=rating_desc" },
  ];
  return sections.filter((s) => s.items.length > 0);
}

export interface LibraryStats {
  years: number[];
  year: number;
  finishedThisYear: Record<MediaType, number>;
  averageRating: number | null;
  ratedCount: number;
  completed: number;
  dropped: number;
  inProgress: number;
  backlog: number;
  total: number;
  topRated: Record<MediaType, LibraryItem[]>;
}

export function computeStats(items: LibraryItem[], year: number): LibraryStats {
  const byType = (): Record<MediaType, number> => ({ movie: 0, tv: 0, book: 0, game: 0 });
  const finishedThisYear = byType();
  const years = new Set<number>();
  for (const i of items) {
    if (!i.dateFinished) continue;
    const y = new Date(i.dateFinished).getFullYear();
    years.add(y);
    if (y === year && i.status === "completed") finishedThisYear[i.mediaType] += 1;
  }
  years.add(new Date().getFullYear());

  const rated = items.filter((i) => i.rating != null);
  const avg = rated.length ? rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length : null;
  const top = (t: MediaType) =>
    rated
      .filter((i) => i.mediaType === t)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || time(b.dateFinished) - time(a.dateFinished))
      .slice(0, 10);

  return {
    years: [...years].sort((a, b) => b - a),
    year,
    finishedThisYear,
    averageRating: avg == null ? null : Math.round(avg * 10) / 10,
    ratedCount: rated.length,
    completed: items.filter((i) => i.status === "completed").length,
    dropped: items.filter((i) => i.status === "dropped").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
    backlog: items.filter((i) => i.status === "backlog").length,
    total: items.length,
    topRated: { movie: top("movie"), tv: top("tv"), book: top("book"), game: top("game") },
  };
}
