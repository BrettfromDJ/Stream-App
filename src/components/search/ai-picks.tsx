"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { AiPick, AiSearchResult } from "@/lib/ai/search";
import type { SearchFilter } from "@/lib/providers";
import { cardFromResult, type LibraryIndex } from "@/lib/media/card";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_ITEM, ROW_SIZES } from "@/components/media/row";
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
        // Never spin forever: give up after ~a minute and fall back to title matches.
        const signal =
          typeof AbortSignal.any === "function" ? AbortSignal.any([controller.signal, AbortSignal.timeout(58_000)]) : controller.signal;
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
  const sections = result?.sections ?? [];
  const related = result?.related ?? [];
  if (result && !sections.length && !related.length && !unmatched.length) {
    return <p className="gutter mb-8 text-[14px] text-fg-2">AI couldn&apos;t find anything for that — try describing it another way.</p>;
  }
  const [lead, ...rest] = sections;

  return (
    <div className="mb-12 flex flex-col gap-10">
      <header className="gutter">
        <h2 className="inline-flex items-center gap-2 text-[22px] font-bold tracking-[-0.02em] md:text-[26px]">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-sky-400 text-black">
            <Sparkles className="size-[18px]" strokeWidth={2.5} />
          </span>
          AI Picks
        </h2>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-snug text-fg-2">
          {result ? result.summary : slow ? "Still thinking — this one\u2019s taking a moment…" : "Reading up on that and gathering titles…"}
        </p>
      </header>

      {!result ? (
        <PickGridSkeleton />
      ) : (
        <>
          {lead && (
            <section aria-label={lead.title}>
              <h3 className="gutter mb-3 text-[19px] font-bold tracking-[-0.02em] md:text-[21px]">{lead.title}</h3>
              <div className="gutter grid grid-cols-3 gap-x-2.5 gap-y-5 sm:grid-cols-4 md:grid-cols-5 md:gap-x-4 lg:grid-cols-6">
                {lead.items.map((p) => (
                  <Pick key={`${p.type}-${p.externalId}`} pick={p} libraryIndex={libraryIndex} sizes={LEAD_SIZES} />
                ))}
              </div>
            </section>
          )}

          {rest.map((s) => (
            <section key={s.title} aria-label={s.title}>
              <h3 className="gutter mb-3 text-[19px] font-bold tracking-[-0.02em] md:text-[21px]">{s.title}</h3>
              <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 md:gap-3.5">
                {s.items.map((p) => (
                  <div key={`${p.type}-${p.externalId}`} className={cn("shrink-0 snap-start", ROW_ITEM.poster)}>
                    <Pick pick={p} libraryIndex={libraryIndex} sizes={ROW_SIZES.poster} />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {related.map((r) => (
            <Row key={r.title} title={r.title} subtitle="Tagged with this subject, whatever the title">
              {r.items.map((m) => (
                <MediaCard key={`${m.type}-${m.externalId}`} media={cardFromResult(m, libraryIndex)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
              ))}
            </Row>
          ))}

          {unmatched.length > 0 && (
            <section className="gutter" aria-label="More ideas">
              <h3 className="mb-2 text-[19px] font-bold tracking-[-0.02em]">More Ideas</h3>
              <ul className="overflow-hidden rounded-2xl bg-white/[0.04] md:max-w-2xl">
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
            </section>
          )}
        </>
      )}
    </div>
  );
}

const LEAD_SIZES = "(min-width: 1024px) 16vw, (min-width: 768px) 19vw, (min-width: 640px) 23vw, 31vw";

function Pick({ pick, libraryIndex, sizes }: { pick: AiPick; libraryIndex: LibraryIndex; sizes: string }) {
  return (
    <div>
      <MediaCard media={cardFromResult(pick, libraryIndex)} sizes={sizes} showRating={false} showInLibrary />
      <p className="mt-1 line-clamp-3 px-0.5 text-[12px] leading-snug text-fg-2 md:text-[12.5px]">{pick.reason}</p>
    </div>
  );
}

function PickGridSkeleton() {
  return (
    <div className="gutter grid grid-cols-3 gap-x-2.5 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
          <Skeleton className="mt-2 h-3.5 w-4/5 rounded" />
          <Skeleton className="mt-1.5 h-3 w-3/5 rounded" />
        </div>
      ))}
    </div>
  );
}
