"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GroupedSearch, SearchFilter } from "@/lib/providers";
import { cardFromResult, type LibraryIndex } from "@/lib/media/card";
import { TYPE_LABEL_PLURAL, TYPE_NOUN_PLURAL } from "@/lib/media/labels";
import { MEDIA_TYPES, type MediaType } from "@/lib/media/types";
import { FilterChips } from "@/components/ui/filter-chips";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { GRID_SIZES, MediaGrid } from "@/components/media/grid";
import { GridSkeleton, RowSkeleton } from "@/components/media/skeletons";
import { cn } from "@/lib/utils";
import { AiPicks, wantsAi } from "./ai-picks";

const FILTERS: { value: SearchFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...MEDIA_TYPES.map((t) => ({ value: t, label: TYPE_LABEL_PLURAL[t] })),
];

interface Props {
  initialQuery: string;
  initialType: SearchFilter;
  initialResults: GroupedSearch | null;
  libraryIndex: LibraryIndex;
  /** OpenAI is configured: descriptive queries also get AI Picks. */
  aiEnabled?: boolean;
  /** Server-rendered browse rows shown before typing. */
  children: ReactNode;
}

// Survives navigations within the session so going back to Search is instant.
const cache = new Map<string, GroupedSearch>();

export function SearchView({ initialQuery, initialType, initialResults, libraryIndex, aiEnabled, children }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<SearchFilter>(initialType);
  const [data, setData] = useState<GroupedSearch | null>(() => {
    if (initialResults && initialQuery) cache.set(`${initialType}:${initialQuery.toLowerCase()}`, initialResults);
    return initialResults;
  });
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const trimmed = query.trim();
  const active = trimmed.length >= 2;
  const key = `${type}:${trimmed.toLowerCase()}`;
  const cached = active ? cache.get(key) : undefined;
  // Previous results stay on screen (dimmed) while the next request is in flight.
  const current = cached ?? data;
  const failed = failedKey === key;
  const loading = active && !cached && !failed;

  // Focus the field on desktop; on phones let the user tap (avoids the keyboard covering browse rows).
  useEffect(() => {
    if (!initialQuery && window.matchMedia("(hover: hover)").matches) inputRef.current?.focus();
  }, [initialQuery]);

  useEffect(() => {
    if (!active || cache.has(key)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?${new URLSearchParams({ q: trimmed, type })}`, { signal: controller.signal });
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/search?q=${trimmed}`)}`);
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as GroupedSearch;
        cache.set(key, json);
        setData(json);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFailedKey(key);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, active, trimmed, type, router]);

  // Keep the URL shareable / restorable without triggering a server render on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (type !== "all") params.set("type", type);
    const qs = params.toString();
    const url = qs ? `/search?${qs}` : "/search";
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url);
  }, [trimmed, type]);

  const changeType = (next: SearchFilter) => {
    setType(next);
    // Browse rows are server-rendered per filter.
    if (!active) router.replace(next === "all" ? "/search" : `/search?type=${next}`, { scroll: false });
  };

  const groups = (type === "all" ? MEDIA_TYPES : [type as MediaType]).filter((t) => current?.results[t]?.length);
  const total = groups.reduce((n, t) => n + (current?.results[t].length ?? 0), 0);
  const unavailable = (current?.unavailable ?? []).filter((t) => type === "all" || t === type);
  const showingStale = loading && current;
  const wanted = type === "all" ? MEDIA_TYPES.length : 1;
  const allDown = unavailable.length >= wanted;
  const ai = aiEnabled && active && wantsAi(trimmed);
  const unavailableText = new Intl.ListFormat("en", { type: "conjunction" }).format(unavailable.map((t) => TYPE_NOUN_PLURAL[t].toLowerCase()));

  return (
    <div>
      <div className="sticky top-0 z-30 bg-bg/80 pt-[calc(var(--nav-h)+1.25rem)] pb-3 backdrop-blur-xl backdrop-saturate-150 lg:pt-[calc(var(--nav-h)+1.5rem)]">
        <h1 className="gutter text-[32px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[38px]">Search</h1>
        <div className="gutter mt-4">
          <label className="glass flex h-12 items-center gap-2.5 rounded-2xl px-4 md:max-w-xl">
            {loading ? (
              <LoaderCircle aria-hidden className="size-[18px] shrink-0 animate-spin text-fg-2" />
            ) : (
              <Search aria-hidden className="size-[18px] shrink-0 text-fg-2" />
            )}
            <span className="sr-only">Search</span>
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              placeholder={aiEnabled ? "Search a title, or describe what you want" : "Search movies, shows, books & games"}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setData(null);
                  inputRef.current?.focus();
                }}
                className="-mr-1.5 grid size-8 place-items-center rounded-full text-fg-2 hover:text-fg"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </label>
        </div>
        <FilterChips label="Filter results" className="gutter mt-3" options={FILTERS} value={type} onChange={changeType} />
      </div>

      <div className="mt-4">
        {ai && <AiPicks key={`${type}:${trimmed.toLowerCase()}`} query={trimmed} type={type} libraryIndex={libraryIndex} />}
        {!active ? (
          children
        ) : !current && loading ? (
          type === "all" ? (
            <div className="flex flex-col gap-9">
              <RowSkeleton />
              <RowSkeleton />
            </div>
          ) : (
            <GridSkeleton count={12} />
          )
        ) : failed || (allDown && !loading) ? (
          <Message title="Search is having trouble." body="Check your connection and try again in a moment." />
        ) : (
          <div className={cn("transition-opacity duration-200", showingStale && "opacity-60")}>
            {unavailable.length > 0 && (
              <p className="gutter mb-5 text-[13px] text-fg-3">
                Couldn&apos;t reach {unavailableText} right now — showing everything else.
              </p>
            )}
            {total === 0 && !loading ? (
              ai ? null : <Message title={`No results for “${trimmed}”`} body="Try a different spelling or a shorter title." />
            ) : type === "all" ? (
              <div className="flex flex-col gap-9 md:gap-11">
                {groups.map((t) => (
                  <Row key={t} title={ai ? `${TYPE_NOUN_PLURAL[t]} · Title Matches` : TYPE_NOUN_PLURAL[t]}>
                    {current!.results[t].map((r) => (
                      <MediaCard key={r.externalId} media={cardFromResult(r, libraryIndex)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
                    ))}
                  </Row>
                ))}
                {groups.length > 0 && (
                  <div className="gutter flex flex-wrap gap-2">
                    {groups.map((t) => (
                      <button
                        key={t}
                        onClick={() => changeType(t)}
                        className="h-9 rounded-full bg-white/[0.06] px-4 text-[14px] font-medium text-fg-2 hover:text-fg"
                      >
                        All {current!.results[t].length} {TYPE_NOUN_PLURAL[t].toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <MediaGrid>
                {current!.results[type as MediaType].map((r) => (
                  <MediaCard key={r.externalId} media={cardFromResult(r, libraryIndex)} sizes={GRID_SIZES} showRating={false} showInLibrary />
                ))}
              </MediaGrid>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="gutter py-14 md:py-20 md:text-center">
      <p className="text-[20px] font-bold tracking-[-0.02em]">{title}</p>
      <p className="mt-1.5 text-[15px] text-fg-2">{body}</p>
    </div>
  );
}
