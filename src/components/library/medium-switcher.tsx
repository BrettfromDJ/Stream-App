"use client";

import { Search, X } from "lucide-react";
import { Sup } from "@/components/editorial/editorial";
import { motion } from "motion/react";
import { useRef } from "react";
import type { MediaType } from "@/lib/media/types";
import { cn } from "@/lib/utils";

export type TypeFilter = MediaType | "all";

const OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
  { value: "book", label: "Books" },
  { value: "game", label: "Games" },
];

interface Props {
  value: TypeFilter;
  counts: Record<TypeFilter, number>;
  onChange: (v: TypeFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  searching: boolean;
  onSearching: (open: boolean) => void;
}

/** Editorial tabs (All ²³ Movies ⁷) with a sliding underline, and a find-in-library search that expands in place. */
export function MediumSwitcher({ value, counts, onChange, query, onQuery, searching, onSearching }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-[var(--nav-h)] z-30 pt-2.5 pb-4">
      {/* Fades content scrolling underneath so the glass bar stays legible. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[calc(-1*var(--nav-h))] -bottom-4 bg-[linear-gradient(to_bottom,var(--color-bg)_80%,transparent)]" />
      <div className="gutter relative">
        <div className={cn("relative flex h-12 items-center", searching && "glass rounded-full p-1")}>
          {searching ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-1 items-center gap-2 pr-1 pl-3.5"
            >
              <Search aria-hidden className="size-[18px] shrink-0 text-fg-2" />
              <input
                ref={input}
                autoFocus
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Find in your library"
                enterKeyHint="search"
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-fg-3"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  onQuery("");
                  onSearching(false);
                }}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-fg-2 hover:text-fg"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            </motion.div>
          ) : (
            <>
              <div role="tablist" aria-label="Media type" className="no-scrollbar flex h-full min-w-0 flex-1 items-center gap-3.5 overflow-x-auto pr-2 pl-1 [mask-image:linear-gradient(to_right,black_88%,transparent)] md:gap-6 md:[mask-image:none]">
                {OPTIONS.map(({ value: v, label }) => {
                  const active = v === value;
                  return (
                    <button
                      key={v}
                      role="tab"
                      aria-selected={active}
                      onClick={() => onChange(v)}
                      className={cn(
                        "display relative shrink-0 py-1 text-[21px] whitespace-nowrap transition-colors md:text-[26px]",
                        active ? "text-fg" : "text-fg/35 hover:text-fg/70",
                      )}
                    >
                      {label}
                      {counts[v] > 0 && <Sup>{counts[v]}</Sup>}
                      {active && (
                        <motion.span
                          layoutId="library-medium"
                          className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-fg"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-label="Find in your library"
                onClick={() => onSearching(true)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.08] text-fg-2 transition-colors hover:bg-white/15 hover:text-fg"
              >
                <Search className="size-[18px]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
