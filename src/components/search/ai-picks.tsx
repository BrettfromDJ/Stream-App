"use client";

import { Sparkles } from "lucide-react";
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

const cache = new Map<string, AiSearchResult | "error">();

/** "AI Picks": the model's suggestions, each a real catalog entry with a one-line reason. */
export function AiPicks({ query, type, libraryIndex }: { query: string; type: SearchFilter; libraryIndex: LibraryIndex }) {
  const key = `${type}:${query.toLowerCase()}`;
  const [, rerender] = useState(0);
  const result = cache.get(key);

  useEffect(() => {
    if (cache.has(key)) return;
    const controller = new AbortController();
    // Wait for a pause in typing: each request costs a little.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ai-search?${new URLSearchParams({ q: query, type })}`, { signal: controller.signal });
        cache.set(key, res.ok ? ((await res.json()) as AiSearchResult) : "error");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        cache.set(key, "error");
      }
      rerender((n) => n + 1);
    }, 800);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, query, type]);

  if (result === "error") {
    return <p className="gutter mb-8 text-[13px] text-fg-3">AI suggestions aren&apos;t available right now — showing title matches.</p>;
  }
  if (result && !result.picks.length) return null;

  return (
    <section aria-label="AI Picks" className="mb-10">
      <div className="gutter mb-3">
        <h2 className="inline-flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-sky-400 text-black">
            <Sparkles className="size-4" strokeWidth={2.5} />
          </span>
          AI Picks
        </h2>
        <p className="mt-1 text-[14px] text-fg-2">{result ? result.summary : "Finding titles that match…"}</p>
      </div>
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
    </section>
  );
}
