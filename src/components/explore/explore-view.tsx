"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  DECADE_LABEL,
  GAME_PLATFORMS,
  LENGTH_LABEL,
  RATING_LABEL,
  SORT_LABEL,
  exploreHref,
  exploreTitle,
  genresFor,
  presetFor,
  type ExploreQuery,
} from "@/lib/discover/taxonomy";
import { cardFromResult, type LibraryIndex } from "@/lib/media/card";
import { TYPE_LABEL_PLURAL } from "@/lib/media/labels";
import type { MediaSearchResult } from "@/lib/media/types";
import { BackButton } from "@/components/detail/back-button";
import { MediaCard } from "@/components/media/media-card";
import { GRID_SIZES, MediaGrid } from "@/components/media/grid";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  query: ExploreQuery;
  initial: { items: MediaSearchResult[]; hasMore: boolean };
  libraryIndex: LibraryIndex;
  hasServices: boolean;
}

type FilterKey = "genre" | "sort" | "decade" | "rating" | "length" | "platform";

interface Option {
  value: string | undefined;
  label: string;
}

export function ExploreView({ query, initial, libraryIndex, hasServices }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<FilterKey | null>(null);
  const [pending, startTransition] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  const { title, blurb } = exploreTitle(query);
  const preset = presetFor(query.type, query.preset);

  const go = (next: Partial<ExploreQuery>) => {
    setOpen(null);
    startTransition(() => router.push(exploreHref({ ...query, ...next }), { scroll: false }));
  };

  // Infinite scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loadingMore) return;
        setLoadingMore(true);
        try {
          const nextPage = page + 1;
          const href = exploreHref(query).replace(`/explore/${query.type}`, `/api/explore/${query.type}`);
          const res = await fetch(`${href}${href.includes("?") ? "&" : "?"}page=${nextPage}`);
          const data = (await res.json()) as { items: MediaSearchResult[]; hasMore: boolean };
          setItems((cur) => {
            const seen = new Set(cur.map((i) => i.externalId));
            return [...cur, ...data.items.filter((i) => !seen.has(i.externalId))];
          });
          setHasMore(data.hasMore && data.items.length > 0);
          setPage(nextPage);
        } catch {
          setHasMore(false);
        } finally {
          setLoadingMore(false);
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, page, query]);

  const options: Record<FilterKey, Option[]> = {
    genre: [{ value: undefined, label: "All Genres" }, ...genresFor(query.type).map((g) => ({ value: g.slug, label: g.label }))],
    sort: (Object.keys(SORT_LABEL) as (keyof typeof SORT_LABEL)[]).map((k) => ({ value: k, label: SORT_LABEL[k] })),
    decade: [{ value: undefined, label: "Any Year" }, ...(Object.keys(DECADE_LABEL) as (keyof typeof DECADE_LABEL)[]).map((k) => ({ value: k, label: DECADE_LABEL[k] }))],
    rating: [{ value: undefined, label: "Any Rating" }, { value: "good", label: RATING_LABEL.good }, { value: "great", label: RATING_LABEL.great }],
    length:
      query.type === "movie" || query.type === "book"
        ? [{ value: undefined, label: "Any Length" }, ...(["short", "medium", "long"] as const).map((k) => ({ value: k, label: LENGTH_LABEL[query.type as "movie" | "book"][k] }))]
        : [],
    platform: [{ value: undefined, label: "All Platforms" }, ...GAME_PLATFORMS.map((p) => ({ value: p.slug, label: p.label }))],
  };

  const current = (key: FilterKey) => (key === "sort" ? query.sort : query[key]);
  const labelFor = (key: FilterKey) => options[key].find((o) => o.value === current(key))?.label;
  const filters: FilterKey[] = [
    "genre",
    "sort",
    "decade",
    "rating",
    ...(query.type === "movie" || query.type === "book" ? (["length"] as const) : []),
    ...(query.type === "game" ? (["platform"] as const) : []),
  ];
  const DEFAULT_LABEL: Record<FilterKey, string> = { genre: "Genre", sort: "Sort", decade: "Year", rating: "Rating", length: "Length", platform: "Platform" };
  const activeCount = filters.filter((f) => f !== "sort" && current(f)).length + (query.mine ? 1 : 0);

  return (
    <div className="animate-fade-in">
      <div className="gutter pt-[calc(var(--nav-h)+0.75rem)]">
        <BackButton />
        <p className="mt-6 text-[12px] font-semibold tracking-[0.1em] text-fg-3 uppercase">
          Explore {TYPE_LABEL_PLURAL[query.type]}
        </p>
        <h1 className="display mt-1 pb-1 text-[46px] text-balance md:text-[64px]">{title}</h1>
        {blurb && <p className="mt-2 text-[15px] text-fg-2">{blurb}</p>}

        {(query.type === "movie" || query.type === "tv") && (
          <div className="mt-5 inline-flex rounded-full bg-white/[0.06] p-1">
            {(["movie", "tv"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  t !== query.type &&
                  go({
                    type: t,
                    genre: genresFor(t).some((g) => g.slug === query.genre) ? query.genre : undefined,
                    preset: presetFor(t, query.preset)?.slug,
                    length: t === "movie" ? query.length : undefined,
                  })
                }
                className={cn(
                  "h-8 rounded-full px-4 text-[13.5px] font-semibold transition-colors",
                  t === query.type ? "bg-fg text-black" : "text-fg-2 hover:text-fg",
                )}
              >
                {t === "movie" ? "Movies" : "TV Shows"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="sticky top-[var(--nav-h)] z-30 mt-2 bg-bg/80 pb-3 backdrop-blur-xl backdrop-saturate-150">
        <div className="no-scrollbar gutter flex gap-1.5 overflow-x-auto pt-3">
          {(query.type === "movie" || query.type === "tv") && hasServices && (
            <button
              type="button"
              onClick={() => go({ mine: !query.mine })}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                query.mine ? "bg-fg text-black" : "bg-white/[0.07] text-fg-2 hover:text-fg",
              )}
            >
              {query.mine && <Check className="size-3.5" strokeWidth={3} />}
              On My Services
            </button>
          )}
          {filters.map((key) => {
            const active = key !== "sort" && Boolean(current(key));
            return (
              <button
                key={key}
                type="button"
                onClick={() => setOpen(key)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1 rounded-full pr-3 pl-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  active ? "bg-fg text-black" : "bg-white/[0.07] text-fg-2 hover:text-fg",
                )}
              >
                {key === "sort" ? labelFor(key) : active ? labelFor(key) : DEFAULT_LABEL[key]}
                <ChevronDown className="size-3.5 opacity-70" strokeWidth={2.5} />
              </button>
            );
          })}
          {(activeCount > 0 || preset) && (
            <button
              type="button"
              onClick={() => go({ genre: undefined, decade: undefined, rating: undefined, length: undefined, platform: undefined, mine: false, preset: undefined })}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[13.5px] font-medium text-fg-2 hover:text-fg"
            >
              <X className="size-3.5" strokeWidth={2.5} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className={cn("mt-4 transition-opacity duration-200", pending && "opacity-50")}>
        {items.length > 0 ? (
          <MediaGrid>
            {items.map((r, i) => (
              <MediaCard
                key={`${r.type}-${r.externalId}`}
                media={cardFromResult(r, libraryIndex)}
                sizes={GRID_SIZES}
                showRating={false}
                showInLibrary
                priority={i < 6}
                badge={typeof r.metadata?.badge === "string" ? r.metadata.badge : null}
              />
            ))}
          </MediaGrid>
        ) : (
          <div className="gutter py-16 md:text-center">
            <p className="display text-[26px] md:text-[30px]">Nothing matches these filters.</p>
            <p className="mt-1.5 text-[15px] text-fg-2">Try widening the year or rating.</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => go({ genre: undefined, decade: undefined, rating: undefined, length: undefined, platform: undefined, mine: false })}
                className={buttonClasses("primary", "md", "mt-6")}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        <div ref={sentinel} className="flex h-24 items-center justify-center">
          {loadingMore && <LoaderCircle className="size-5 animate-spin text-fg-3" />}
        </div>
      </div>

      {open && (
        <Sheet open onOpenChange={(o) => !o && setOpen(null)} title={open === "sort" ? "Sort by" : DEFAULT_LABEL[open]}>
          <div className="flex flex-col gap-0.5">
            {options[open].map((o) => {
              const selected = (o.value ?? undefined) === (current(open) ?? undefined);
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => go({ [open]: o.value } as Partial<ExploreQuery>)}
                  className={cn(
                    "flex h-12 items-center justify-between rounded-xl px-4 text-left text-[16px] transition-colors",
                    selected ? "bg-white/[0.08] font-semibold" : "hover:bg-white/[0.05]",
                  )}
                >
                  {o.label}
                  {selected && <Check className="size-5" strokeWidth={2.25} />}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}
