"use client";

import Link from "next/link";
import { ArrowDownUp, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { filterItems, sortItems, SORTS, type SortKey } from "@/lib/library/selectors";
import { cardFromItem } from "@/lib/media/card";
import { TYPE_LABEL_PLURAL } from "@/lib/media/labels";
import { GENERIC_STATUS_LABEL, statusLabel } from "@/lib/media/status";
import type { LibraryItem, LibraryStatus, MediaType } from "@/lib/media/types";
import { FilterChips } from "@/components/ui/filter-chips";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { MediaCard } from "@/components/media/media-card";
import { GRID_SIZES, MediaGrid } from "@/components/media/grid";
import { cn } from "@/lib/utils";

type TypeFilter = MediaType | "all";
type StatusFilter = LibraryStatus | "all";

interface Props {
  items: LibraryItem[];
  error?: string;
  initial: { type: TypeFilter; status: StatusFilter; sort: SortKey };
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...(["movie", "tv", "book", "game"] as const).map((t) => ({ value: t, label: TYPE_LABEL_PLURAL[t] })),
];

const STATUS_VALUES: StatusFilter[] = ["all", "in_progress", "backlog", "completed", "dropped"];

export function LibraryView({ items, error, initial }: Props) {
  const [type, setType] = useState<TypeFilter>(initial.type);
  const [status, setStatus] = useState<StatusFilter>(initial.status);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [sortOpen, setSortOpen] = useState(false);

  const visible = useMemo(() => sortItems(filterItems(items, type, status), sort), [items, type, status, sort]);

  const sync = (next: Partial<Props["initial"]>) => {
    const state = { type, status, sort, ...next };
    const params = new URLSearchParams();
    if (state.type !== "all") params.set("type", state.type);
    if (state.status !== "all") params.set("status", state.status);
    if (state.sort !== "added") params.set("sort", state.sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/library?${qs}` : "/library");
  };

  const statusOptions = STATUS_VALUES.map((s) => ({
    value: s,
    label: s === "all" ? "Any Status" : type === "all" ? GENERIC_STATUS_LABEL[s] : statusLabel(s, type),
  }));

  return (
    <div>
      <div className="sticky top-0 z-30 bg-bg/80 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-3 backdrop-blur-xl backdrop-saturate-150 lg:pt-10">
        <div className="gutter flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[38px]">Library</h1>
            <p className="mt-1 text-[13px] text-fg-3 tabular-nums">
              {visible.length === items.length ? `${items.length} titles` : `${visible.length} of ${items.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="glass mb-1 inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-transform active:scale-95"
          >
            <ArrowDownUp aria-hidden className="size-4 text-fg-2" />
            <span className="max-[380px]:sr-only">{SORTS[sort]}</span>
          </button>
        </div>
        <FilterChips
          label="Media type"
          className="gutter mt-4"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(v) => {
            setType(v);
            sync({ type: v });
          }}
        />
        <FilterChips
          label="Status"
          size="sm"
          className="gutter mt-2"
          options={statusOptions}
          value={status}
          onChange={(v) => {
            setStatus(v);
            sync({ status: v });
          }}
        />
      </div>

      {error ? <ErrorNotice className="mt-4" message={error} /> : null}

      {visible.length > 0 ? (
        <MediaGrid className="mt-4">
          {visible.map((item, i) => (
            <MediaCard key={item.id} media={cardFromItem(item)} sizes={GRID_SIZES} priority={i < 6} />
          ))}
        </MediaGrid>
      ) : (
        !error && <LibraryEmpty type={type} filtered={items.length > 0} />
      )}

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

const EMPTY_COPY: Record<TypeFilter, { line: string; cta: string; href: string }> = {
  all: { line: "Find something worth watching, reading or playing.", cta: "Start Searching", href: "/search" },
  movie: { line: "Find something worth watching.", cta: "Browse Movies", href: "/search?type=movie" },
  tv: { line: "Find a show worth starting.", cta: "Browse Shows", href: "/search?type=tv" },
  book: { line: "Find something worth reading.", cta: "Browse Books", href: "/search?type=book" },
  game: { line: "Find something worth playing.", cta: "Browse Games", href: "/search?type=game" },
};

function LibraryEmpty({ type, filtered }: { type: TypeFilter; filtered: boolean }) {
  const copy = EMPTY_COPY[type];
  return (
    <div className="gutter flex flex-col items-start py-16 md:items-center md:py-24 md:text-center">
      <p className="text-[22px] font-bold tracking-[-0.02em]">{filtered ? "Nothing matches." : "Nothing here yet."}</p>
      <p className="mt-1.5 text-[15px] text-fg-2">{copy.line}</p>
      <Link href={copy.href} className={buttonClasses("primary", "md", "mt-6")}>
        {copy.cta}
      </Link>
    </div>
  );
}
