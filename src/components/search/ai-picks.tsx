"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiSearchResult } from "@/lib/ai/search";
import type { SearchFilter } from "@/lib/providers";
import { cardFromResult, type LibraryIndex } from "@/lib/media/card";
import { MediaCard } from "@/components/media/media-card";
import { ROW_ITEM, ROW_SIZES } from "@/components/media/row";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Sentences ("a book about the Holocaust") rather than titles get AI help. */
export function wantsAi(query: string) {
  const q = query.trim();
  const words = q.split(/\s+/).filter(Boolean).length;
  return q.length >= 6 && (words >= 3 || /\b(about|like|similar|set in|with|for|where|featuring)\b/i.test(q));
}

type Failure = { failed: "error" | "timeout"; detail?: string };
const cache = new Map<string, AiSearchResult | Failure>();
const isFailure = (r: AiSearchResult | Failure | undefined): r is Failure => Boolean(r && "failed" in r);

interface Props {
  query: string;
  type: SearchFilter;
  libraryIndex: LibraryIndex;
  /** Runs a normal title search (for suggestions we couldn't match to a cover). */
  onSearch: (title: string) => void;
}

/** "AI Picks": the model's suggestions, each a real catalog entry with a one-line reason. */
export function AiPicks({ query, type, libraryIndex, onSearch }: Props) {
  const key = `${type}:${query.toLowerCase()}`;
  const [, rerender] = useState(0);
  const [slow, setSlow] = useState(false);
  const result = cache.get(key);

  useEffect(() => {
    if (cache.has(key)) return;
    const controller = new AbortController();
    const slowTimer = setTimeout(() => setSlow(true), 8000);
    // Wait for a pause in typing: each request costs a little.
    const timer = setTimeout(async () => {
      try {
        // Never spin forever: give up after 45s and fall back to title matches.
        const signal =
          typeof AbortSignal.any === "function" ? AbortSignal.any([controller.signal, AbortSignal.timeout(45_000)]) : controller.signal;
        const res = await fetch(`/api/ai-search?${new URLSearchParams({ q: query, type })}`, { signal });
        const body = (await res.json().catch(() => null)) as (AiSearchResult & { detail?: string }) | null;
        cache.set(key, res.ok && body ? body : { failed: "error", detail: body?.detail ?? `Error ${res.status}` });
      } catch (err) {
        if (controller.signal.aborted) return;
        cache.set(key, { failed: (err as Error).name === "TimeoutError" ? "timeout" : "error", detail: (err as Error).message });
      }
      clearTimeout(slowTimer);
      rerender((n) => n + 1);
    }, 800);
    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(slowTimer);
    };
  }, [key, query, type]);

  if (isFailure(result)) {
    return (
      <div className="gutter mb-8">
        <div className="rounded-2xl bg-white/[0.04] px-4 py-3 text-[13.5px] text-fg-2 md:max-w-xl">
          <p className="font-semibold text-fg">{result.failed === "timeout" ? "AI suggestions took too long." : "AI suggestions aren\u2019t working right now."}</p>
          {result.detail && <p className="mt-0.5 break-words">{result.detail}</p>}
        </div>
      </div>
    );
  }

  const unmatched = result?.unmatched ?? [];
  if (result && !result.picks.length && !unmatched.length) {
    return <p className="gutter mb-8 text-[14px] text-fg-2">AI couldn&apos;t find anything for that — try describing it another way.</p>;
  }

  return (
    <section aria-label="AI Picks" className="mb-10">
      <div className="gutter mb-3">
        <h2 className="inline-flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-sky-400 text-black">
            <Sparkles className="size-4" strokeWidth={2.5} />
          </span>
          AI Picks
        </h2>
        <p className="mt-1 text-[14px] text-fg-2">{result ? result.summary : slow ? "Still thinking — this one\u2019s taking a moment…" : "Finding titles that match…"}</p>
      </div>
      {(!result || result.picks.length > 0) && (
        <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 md:gap-3.5">
          {result
            ? result.picks.map((p) => (
                <div key={`${p.type}-${p.externalId}`} className={cn("shrink-0 snap-start", ROW_ITEM.poster)}>
                  <MediaCard media={cardFromResult(p, libraryIndex)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
                  <p className="mt-1 line-clamp-3 px-1 text-[12.5px] leading-snug text-fg-2">{p.reason}</p>
                </div>
              ))
            : Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={cn("shrink-0", ROW_ITEM.poster)}>
                  <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
                  <Skeleton className="mt-2 h-3.5 w-4/5 rounded" />
                  <Skeleton className="mt-1.5 h-3 w-3/5 rounded" />
                </div>
              ))}
        </div>
      )}
      {unmatched.length > 0 && (
        <div className="gutter mt-3">
          {result!.picks.length > 0 && <p className="mb-2 text-[13px] font-semibold tracking-wide text-fg-3 uppercase">More ideas</p>}
          <ul className="overflow-hidden rounded-2xl bg-white/[0.04]">
            {unmatched.map((u) => (
              <li key={`${u.type}:${u.title}`} className="border-b border-white/[0.06] last:border-0">
                <button
                  type="button"
                  onClick={() => onSearch(u.title)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">
                      {u.title}
                      {u.creator && <span className="font-normal text-fg-3"> · {u.creator}</span>}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-fg-2">{u.reason}</span>
                  </span>
                  <Search className="mt-1 size-4 shrink-0 text-fg-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
