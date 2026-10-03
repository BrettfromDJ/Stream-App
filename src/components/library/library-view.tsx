"use client";

import Link from "next/link";
import { ArrowDownUp, Check, ChevronLeft, ChevronRight, CircleDashed, Heart, Hourglass, Play, Trophy, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { filterItems, sortItems, SORTS, type SortKey } from "@/lib/library/selectors";
import { cardFromItem } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { formatRating } from "@/lib/media/format";
import type { LibraryItem, LibraryStatus } from "@/lib/media/types";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { MediaCard } from "@/components/media/media-card";
import { ContinueCard } from "@/components/media/continue-card";
import { Artwork } from "@/components/media/artwork";
import { ScrollRow } from "@/components/media/scroll-row";
import { GRID_SIZES, MediaGrid } from "@/components/media/grid";
import { ROW_SIZES } from "@/components/media/row";
import { useLongPress } from "@/components/media/use-long-press";
import { useQuickActions } from "./quick-actions";
import { Bookshelf, BookshelfRow } from "./bookshelf";
import { LibraryHero, type LibraryStat } from "./library-hero";
import { MediumSwitcher, type TypeFilter } from "./medium-switcher";
import { cn } from "@/lib/utils";

type StatusFilter = LibraryStatus | "all";

interface Props {
  items: LibraryItem[];
  error?: string;
  initial: { type: TypeFilter; status: StatusFilter; sort: SortKey };
}

const EASE = [0.22, 1, 0.36, 1] as const;

const SHELF: Record<LibraryStatus, { icon: LucideIcon; title: (t: TypeFilter) => string; blurb: string }> = {
  in_progress: {
    icon: Play,
    title: (t) => ({ all: "In Progress", movie: "Watching", tv: "Watching", book: "Reading", game: "Playing" })[t],
    blurb: "Pick up where you left off",
  },
  backlog: { icon: Hourglass, title: () => "Up Next", blurb: "Saved for later" },
  completed: { icon: Trophy, title: () => "Finished", blurb: "Most recent first" },
  dropped: { icon: CircleDashed, title: () => "Didn’t Finish", blurb: "No hard feelings" },
};

/** Your highest-rated titles: 4.5★ and up, or 4★ and up if that's too few. */
function favoritesOf(items: LibraryItem[]) {
  const rated = items.filter((i) => (i.rating ?? 0) >= 4).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.dateFinished ?? "").localeCompare(a.dateFinished ?? ""));
  const best = rated.filter((i) => (i.rating ?? 0) >= 4.5);
  return (best.length >= 3 ? best : rated).slice(0, 16);
}

function statsOf(items: LibraryItem[]): LibraryStat[] {
  const year = new Date().getFullYear();
  const rated = items.filter((i) => i.rating);
  const stats: LibraryStat[] = [
    { label: "Titles", value: items.length },
    { label: `Done in ${year}`, value: items.filter((i) => i.dateFinished?.startsWith(String(year))).length },
    { label: "In Progress", value: items.filter((i) => i.status === "in_progress").length },
  ];
  if (rated.length) stats.push({ label: "Avg Rating", value: rated.reduce((n, i) => n + (i.rating ?? 0), 0) / rated.length, digits: 1, prefix: "★ " });
  return stats;
}

export function LibraryView({ items, error, initial }: Props) {
  const [type, setType] = useState<TypeFilter>(initial.type);
  // null = the shelves overview; a status = that shelf, full screen.
  const [focus, setFocus] = useState<StatusFilter | null>(initial.status === "all" ? null : initial.status);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const sync = (next: { type?: TypeFilter; focus?: StatusFilter | null; sort?: SortKey }) => {
    const state = { type, focus, sort, ...next };
    const params = new URLSearchParams();
    if (state.type !== "all") params.set("type", state.type);
    if (state.focus && state.focus !== "all") params.set("status", state.focus);
    if (state.sort !== "added") params.set("sort", state.sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/library?${qs}` : "/library");
  };

  const byType = filterItems(items, type, "all");
  const counts = Object.fromEntries((["all", "movie", "tv", "book", "game"] as const).map((t) => [t, filterItems(items, t, "all").length])) as Record<TypeFilter, number>;
  const q = query.trim().toLowerCase();
  const searchResults = q ? byType.filter((i) => i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q)) : null;

  const changeType = (t: TypeFilter) => {
    setType(t);
    sync({ type: t });
  };
  const openShelf = (s: StatusFilter | null) => {
    setFocus(s);
    sync({ focus: s });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const viewKey = searchResults ? `q:${type}` : `${type}:${focus ?? "shelves"}`;

  return (
    <div className="pb-6">
      <LibraryHero items={byType.length >= 6 ? byType : items} stats={items.length ? statsOf(byType) : []} />
      <MediumSwitcher
        value={type}
        counts={counts}
        onChange={changeType}
        query={query}
        onQuery={setQuery}
        searching={searching}
        onSearching={setSearching}
      />

      {error ? <ErrorNotice className="mt-4" message={error} /> : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: EASE }}
        >
          {!items.length ? (
            !error && <EmptyLibrary />
          ) : searchResults ? (
            <FocusView
              title={searchResults.length ? `Matches for “${query.trim()}”` : `Nothing matches “${query.trim()}”`}
              items={searchResults}
              type={type}
            />
          ) : focus ? (
            <FocusView
              title={focus === "all" ? "Everything" : SHELF[focus].title(type)}
              items={sortItems(filterItems(byType, type, focus), sort)}
              type={type}
              onBack={() => openShelf(null)}
              sortLabel={SORTS[sort]}
              onSort={() => setSortOpen(true)}
            />
          ) : (
            <Shelves items={byType} type={type} onOpen={openShelf} />
          )}
        </motion.div>
      </AnimatePresence>

      <Sheet open={sortOpen} onOpenChange={setSortOpen} title="Sort by">
        <div className="flex flex-col gap-0.5">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setSort(key);
                sync({ sort: key });
                setSortOpen(false);
              }}
              className={cn(
                "flex h-12 items-center justify-between rounded-xl px-4 text-left text-[16px] transition-colors",
                key === sort ? "bg-white/[0.08] font-semibold" : "hover:bg-white/[0.05]",
              )}
            >
              {SORTS[key]}
              {key === sort && <Check className="size-5" strokeWidth={2.25} />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------------------------------------------------------- shelves */

function Shelves({ items, type, onOpen }: { items: LibraryItem[]; type: TypeFilter; onOpen: (s: StatusFilter) => void }) {
  if (!items.length) return <EmptyType type={type} />;
  const favorites = favoritesOf(items);
  const of = (s: LibraryStatus) => sortItems(filterItems(items, type, s), s === "completed" ? "finished" : "added");
  const books = type === "book";

  const sections: { key: string; node: ReactNode }[] = [];
  if (favorites.length) {
    sections.push({
      key: "favorites",
      node: (
        <Section icon={Heart} title="Your Favorites" blurb="The ones you rated highest" accent>
          <div className="no-scrollbar gutter snap-gutter flex snap-x gap-3 overflow-x-auto pt-1 pb-2 md:gap-4">
            {favorites.map((item, i) => (
              <FavoriteCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </Section>
      ),
    });
  }
  (["in_progress", "backlog", "completed", "dropped"] as const).forEach((s) => {
    const list = of(s);
    if (!list.length) return;
    const shown = list.slice(0, 20);
    const { icon, title, blurb } = SHELF[s];
    sections.push({
      key: s,
      node: (
        <Section icon={icon} title={title(type)} blurb={blurb} count={list.length} onSeeAll={() => onOpen(s)} muted={s === "dropped"}>
          {books ? (
            <BookshelfRow items={shown} />
          ) : s === "in_progress" ? (
            <ScrollRow size="wide">
              {shown.map((item, i) => (
                <ContinueCard key={item.id} media={cardFromItem(item)} priority={i < 2} />
              ))}
            </ScrollRow>
          ) : (
            <ScrollRow size="poster">
              {shown.map((item) => (
                <MediaCard key={item.id} media={cardFromItem(item)} sizes={ROW_SIZES.poster} />
              ))}
            </ScrollRow>
          )}
        </Section>
      ),
    });
  });

  return (
    <div className="mt-4 flex flex-col gap-10 md:gap-12">
      {sections.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: Math.min(i, 5) * 0.07, ease: EASE }}
        >
          {s.node}
        </motion.div>
      ))}
      <div className="gutter">
        <button
          type="button"
          onClick={() => onOpen("all")}
          className="group flex w-full items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-4 text-left transition-colors hover:bg-white/[0.07] md:max-w-md"
        >
          <span>
            <span className="block text-[15px] font-semibold">Browse everything</span>
            <span className="block text-[13px] text-fg-2">All {items.length} titles, sorted your way</span>
          </span>
          <ChevronRight className="size-5 text-fg-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  blurb,
  count,
  onSeeAll,
  accent,
  muted,
  children,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
  count?: number;
  onSeeAll?: () => void;
  accent?: boolean;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={cn(muted && "opacity-80")}>
      <div className="gutter mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              accent ? "bg-gradient-to-br from-[#f7c96b] to-[#e9677a] text-black" : "bg-white/[0.07] text-fg-2",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[20px] leading-tight font-bold tracking-[-0.02em] md:text-[22px]">
              {title}
              {count != null && <span className="ml-2 text-[15px] font-semibold text-fg-3 tabular-nums">{count}</span>}
            </h2>
            <p className="truncate text-[13px] text-fg-3">{blurb}</p>
          </div>
        </div>
        {onSeeAll && (
          <button type="button" onClick={onSeeAll} className="mb-0.5 inline-flex shrink-0 items-center gap-0.5 text-[14px] font-medium text-fg-2 hover:text-fg">
            See all <ChevronRight className="size-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/** A favorite: poster framed by a slowly turning glow, with your rating beneath. */
function FavoriteCard({ item, index }: { item: LibraryItem; index: number }) {
  const quick = useQuickActions();
  const card = cardFromItem(item);
  const longPress = useLongPress(quick ? () => quick.open(card) : undefined);
  return (
    <Link
      href={mediaHref(item.mediaType, item.externalId)}
      className="group/fav w-[36vw] shrink-0 snap-start sm:w-[24vw] md:w-[170px] lg:w-[180px]"
      {...longPress}
    >
      <div className="relative overflow-hidden rounded-[16px] p-[2px] transition-transform duration-300 ease-(--ease-out-soft) group-hover/fav:-translate-y-1 group-active/fav:scale-[0.97]">
        <div
          aria-hidden
          className="absolute -inset-[40%] animate-glow-spin bg-[conic-gradient(from_0deg,transparent_0deg,#f7c96b_60deg,transparent_120deg,#e9677a_200deg,transparent_260deg,#8b7cf6_320deg,transparent_360deg)] opacity-80 motion-reduce:animate-none"
          style={{ animationDelay: `${-index * 0.9}s` }}
        />
        <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] bg-elevated-2">
          <Artwork src={item.artworkUrl} title={item.title} type={item.mediaType} sizes="(min-width: 768px) 180px, 36vw" priority={index < 3} />
        </div>
      </div>
      <p className="mt-2 truncate px-0.5 text-[13.5px] font-medium">{item.title}</p>
      <p className="mt-0.5 flex items-center gap-1 px-0.5 text-[12.5px] font-semibold text-star tabular-nums">
        <span aria-hidden>★</span> {formatRating(item.rating)}
      </p>
    </Link>
  );
}

/* ------------------------------------------------------------ focus view */

function FocusView({
  title,
  items,
  type,
  onBack,
  sortLabel,
  onSort,
}: {
  title: string;
  items: LibraryItem[];
  type: TypeFilter;
  onBack?: () => void;
  sortLabel?: string;
  onSort?: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="gutter flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              aria-label="Back to shelves"
              onClick={onBack}
              className="-ml-1.5 grid size-9 shrink-0 place-items-center rounded-full text-fg-2 transition-colors hover:bg-white/10 hover:text-fg"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <h2 className="truncate text-[22px] font-bold tracking-[-0.02em] md:text-[26px]">
            {title} <span className="text-[16px] font-semibold text-fg-3 tabular-nums">{items.length}</span>
          </h2>
        </div>
        {onSort && (
          <button
            type="button"
            onClick={onSort}
            className="glass inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-transform active:scale-95"
          >
            <ArrowDownUp aria-hidden className="size-3.5 text-fg-2" />
            <span className="max-[380px]:sr-only">{sortLabel}</span>
          </button>
        )}
      </div>
      {type === "book" ? (
        <Bookshelf items={items} />
      ) : (
        <MediaGrid className="mt-5">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: Math.min(i, 14) * 0.025, ease: EASE }}
            >
              <MediaCard media={cardFromItem(item)} sizes={GRID_SIZES} priority={i < 6} />
            </motion.div>
          ))}
        </MediaGrid>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- empties */

const EMPTY_COPY: Record<TypeFilter, { line: string; cta: string; href: string }> = {
  all: { line: "Find something worth watching, reading or playing.", cta: "Start Searching", href: "/search" },
  movie: { line: "No movies yet. Find something worth watching.", cta: "Browse Movies", href: "/watch" },
  tv: { line: "No shows yet. Find one worth starting.", cta: "Browse Shows", href: "/watch" },
  book: { line: "No books yet. Find something worth reading.", cta: "Browse Books", href: "/books" },
  game: { line: "No games yet. Find something worth playing.", cta: "Browse Games", href: "/games" },
};

function EmptyType({ type }: { type: TypeFilter }) {
  const copy = EMPTY_COPY[type];
  return (
    <div className="gutter py-16 text-center">
      <p className="text-[15px] text-fg-2">{copy.line}</p>
      <Link href={copy.href} className={buttonClasses("primary", "md", "mt-5")}>
        {copy.cta}
      </Link>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="gutter mt-6">
      <div className="rounded-[24px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 ring-1 ring-white/[0.07] md:p-8">
        <p className="text-[24px] font-bold tracking-[-0.02em]">Your corner is empty — for now.</p>
        <p className="mt-1.5 max-w-md text-[15px] text-fg-2">
          Everything you watch, read and play lands here: what you&apos;re in the middle of, what&apos;s next, and your all-time favorites.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/watch" className={buttonClasses("primary", "md")}>
            Movies & TV
          </Link>
          <Link href="/books" className={buttonClasses("soft", "md")}>
            Books
          </Link>
          <Link href="/games" className={buttonClasses("soft", "md")}>
            Games
          </Link>
        </div>
      </div>
    </div>
  );
}
