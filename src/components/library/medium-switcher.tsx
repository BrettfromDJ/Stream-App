"use client";

import { BookOpen, Clapperboard, Gamepad2, LayoutGrid, Search, Tv, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import type { MediaType } from "@/lib/media/types";
import { cn } from "@/lib/utils";

export type TypeFilter = MediaType | "all";

const OPTIONS: { value: TypeFilter; label: string; icon: typeof LayoutGrid }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "movie", label: "Movies", icon: Clapperboard },
  { value: "tv", label: "TV", icon: Tv },
  { value: "book", label: "Books", icon: BookOpen },
  { value: "game", label: "Games", icon: Gamepad2 },
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

/** One glass bar: media type with a sliding highlight, and a find-in-library search that expands in place. */
export function MediumSwitcher({ value, counts, onChange, query, onQuery, searching, onSearching }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-[var(--nav-h)] z-30 pt-2.5 pb-4">
      {/* Fades content scrolling underneath so the glass bar stays legible. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-bg/85 to-transparent" />
      <div className="gutter relative">
        <div className="glass relative flex h-12 items-center rounded-full p-1">
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
              <div role="tablist" aria-label="Media type" className="no-scrollbar flex h-full min-w-0 flex-1 overflow-x-auto">
                {OPTIONS.map(({ value: v, label, icon: Icon }) => {
                  const active = v === value;
                  return (
                    <button
                      key={v}
                      role="tab"
                      aria-selected={active}
                      onClick={() => onChange(v)}
                      className={cn(
                        "relative flex h-full shrink-0 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold whitespace-nowrap transition-colors md:px-4",
                        active ? "text-black" : "text-fg-2 hover:text-fg",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="library-medium"
                          className="absolute inset-0 rounded-full bg-fg shadow-[0_4px_18px_-4px_rgba(255,255,255,0.35)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                        />
                      )}
                      <Icon aria-hidden className="relative size-4" strokeWidth={2.25} />
                      <span className={cn("relative", v !== "all" && !active && "max-[420px]:sr-only")}>{label}</span>
                      {counts[v] > 0 && (
                        <span className={cn("relative text-[11.5px] tabular-nums", active ? "text-black/55" : "text-fg-3", "max-[420px]:hidden")}>
                          {counts[v]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-label="Find in your library"
                onClick={() => onSearching(true)}
                className="grid size-10 shrink-0 place-items-center rounded-full text-fg-2 transition-colors hover:bg-white/10 hover:text-fg"
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
