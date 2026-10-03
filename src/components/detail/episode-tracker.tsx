"use client";

import Image from "next/image";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { setEpisodes } from "@/lib/library/actions";
import { snapshotOf, type CardData } from "@/lib/media/card";
import { formatRuntime } from "@/lib/media/format";
import { FriendlyDate } from "@/components/ui/friendly-date";
import type { Episode, SeasonDetail, SeasonSummary } from "@/lib/media/types";
import { haptic, reportError } from "@/components/library/use-library-mutations";
import { cn } from "@/lib/utils";

interface Props {
  show: CardData;
  seasons: SeasonSummary[];
  initialSeason: SeasonDetail | null;
  watched: Record<string, number[]>;
  ended: boolean;
}

function nextUp(seasons: SeasonSummary[], watched: Record<string, number[]>) {
  for (const s of seasons.filter((x) => x.number > 0)) {
    const set = new Set(watched[String(s.number)] ?? []);
    for (let e = 1; e <= s.episodeCount; e++) if (!set.has(e)) return { season: s.number, episode: e };
  }
  return null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const aired = (e: Episode) => !e.airDate || e.airDate <= todayIso();

export function EpisodeTracker({ show, seasons, initialSeason, watched: initialWatched, ended }: Props) {
  // Optimistic ticks; they settle to the server's saved progress (or roll back on error).
  const [watched, applyOptimistic] = useOptimistic(
    initialWatched,
    (state, u: { season: number; episodes: number[]; mark: boolean }) => {
      const set = new Set(state[String(u.season)] ?? []);
      u.episodes.forEach((e) => (u.mark ? set.add(e) : set.delete(e)));
      return { ...state, [String(u.season)]: [...set].sort((a, b) => a - b) };
    },
  );
  const [current, setCurrent] = useState(initialSeason?.number ?? seasons[0]?.number ?? 1);
  const [cache, setCache] = useState<Record<number, SeasonDetail>>(initialSeason ? { [initialSeason.number]: initialSeason } : {});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const season = cache[current];
  const counts = Object.fromEntries(seasons.filter((s) => s.number > 0).map((s) => [String(s.number), s.episodeCount]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const watchedCount = Object.entries(watched)
    .filter(([s]) => Number(s) > 0)
    .reduce((n, [s, eps]) => n + eps.filter((e) => e <= (counts[s] ?? 0)).length, 0);
  const next = nextUp(seasons, watched);

  const loadSeason = async (n: number) => {
    setCurrent(n);
    setExpanded(null);
    if (cache[n]) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tv/${show.externalId}/season/${n}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as SeasonDetail;
      setCache((c) => ({ ...c, [n]: data }));
    } catch {
      toast("Couldn't load that season", { description: "Try again in a moment." });
    } finally {
      setLoading(false);
    }
  };

  const save = (seasonNumber: number, episodes: number[], mark: boolean) => {
    haptic();
    startTransition(async () => {
      applyOptimistic({ season: seasonNumber, episodes, mark });
      const res = await setEpisodes({
        show: snapshotOf(show),
        season: seasonNumber,
        episodes,
        watched: mark,
        seasonCounts: counts,
        ended,
      });
      reportError(res, "Couldn't save");
    });
  };

  const toggle = (e: Episode) => {
    const set = new Set(watched[String(current)] ?? []);
    const mark = !set.has(e.number);
    save(current, [e.number], mark);
    // Offer to fill in earlier episodes when marking one out of order.
    if (mark && season) {
      const earlier = season.episodes.filter((x) => x.number < e.number && aired(x) && !set.has(x.number)).map((x) => x.number);
      if (earlier.length) {
        toast(`Mark E${earlier[0]}–E${e.number - 1} as watched too?`, {
          action: { label: "Mark", onClick: () => save(current, earlier, true) },
        });
      }
    }
  };

  const seasonWatched = new Set(watched[String(current)] ?? []);
  const airedEpisodes = season?.episodes.filter(aired) ?? [];
  const allSeasonWatched = airedEpisodes.length > 0 && airedEpisodes.every((e) => seasonWatched.has(e.number));
  const percent = total ? Math.round((watchedCount / total) * 100) : 0;

  return (
    <section aria-labelledby="episodes">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="episodes" className="display text-[24px] md:text-[26px]">
          Seasons & Episodes
        </h2>
        <p className="text-[13px] text-fg-2 tabular-nums">
          {watchedCount} of {total} watched
        </p>
      </div>

      {/* Progress + next up */}
      <div className="mt-3 rounded-2xl bg-white/[0.04] p-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-fg" initial={false} animate={{ width: `${percent}%` }} transition={{ type: "spring", bounce: 0, duration: 0.6 }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[14px] text-fg-2">
            {next ? (
              <>
                Next up: <span className="font-semibold text-fg">S{next.season} E{next.episode}</span>
              </>
            ) : total ? (
              <span className="font-semibold text-success">All caught up</span>
            ) : (
              "No episodes yet"
            )}
          </p>
          {next && (
            <button
              type="button"
              onClick={() => {
                if (next.season !== current) void loadSeason(next.season);
                save(next.season, [next.episode], true);
              }}
              className="flex h-9 items-center gap-1.5 rounded-full bg-fg px-3.5 text-[13.5px] font-semibold text-black transition-transform active:scale-95"
            >
              <Check className="size-4" strokeWidth={2.75} /> Watched S{next.season} E{next.episode}
            </button>
          )}
        </div>
      </div>

      {/* Season picker */}
      <div className="no-scrollbar -mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 md:-mx-8 md:px-8">
        {seasons.map((s) => {
          const w = (watched[String(s.number)] ?? []).length;
          const complete = s.number > 0 && w >= s.episodeCount;
          return (
            <button
              key={s.number}
              type="button"
              onClick={() => void loadSeason(s.number)}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                s.number === current ? "bg-fg text-black" : "bg-white/[0.07] text-fg-2 hover:text-fg",
              )}
            >
              {complete && <Check className="size-3.5" strokeWidth={3} />}
              {s.number === 0 ? "Specials" : `Season ${s.number}`}
            </button>
          );
        })}
      </div>

      {/* Episodes */}
      <div className="mt-3">
        {loading && !season ? (
          <div className="flex h-40 items-center justify-center">
            <LoaderCircle className="size-5 animate-spin text-fg-3" />
          </div>
        ) : season ? (
          <>
            {airedEpisodes.length > 0 && (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => save(current, airedEpisodes.map((e) => e.number), !allSeasonWatched)}
                  className="text-[13px] font-semibold text-fg-2 hover:text-fg"
                >
                  {allSeasonWatched ? "Unmark season" : "Mark season watched"}
                </button>
              </div>
            )}
            <ol className="overflow-hidden rounded-2xl bg-white/[0.03]">
              {season.episodes.map((e) => {
                const isWatched = seasonWatched.has(e.number);
                const isAired = aired(e);
                const open = expanded === e.number;
                return (
                  <li key={e.number} className="border-b border-white/[0.05] last:border-0">
                    <div className={cn("flex items-start gap-3 p-3", !isAired && "opacity-50")}>
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : e.number)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        aria-expanded={open}
                      >
                        <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-[10px] bg-elevated-2 md:w-36">
                          {e.stillUrl ? <Image src={e.stillUrl} alt="" fill sizes="144px" className="object-cover" /> : null}
                          {isWatched && <span className="absolute inset-0 bg-black/45" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-semibold text-fg-3 tabular-nums">
                            E{e.number}
                            {e.airDate ? (
                              <>
                                {" · "}
                                {isAired ? <FriendlyDate date={e.airDate} variant="since" /> : <>Airs <FriendlyDate date={e.airDate} lower /></>}
                              </>
                            ) : null}
                            {e.runtime ? ` · ${formatRuntime(e.runtime)}` : ""}
                          </span>
                          <span className={cn("mt-0.5 block text-[15px] leading-snug font-semibold", isWatched && "text-fg-2")}>{e.name}</span>
                          {e.overview && (
                            <span className={cn("mt-1 block text-[13px] leading-relaxed text-fg-2", !open && "line-clamp-2")}>
                              {e.overview}
                            </span>
                          )}
                        </span>
                        {e.overview && (
                          <ChevronDown className={cn("mt-1 hidden size-4 shrink-0 text-fg-3 transition-transform md:block", open && "rotate-180")} />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={!isAired}
                        onClick={() => toggle(e)}
                        aria-label={isWatched ? `Mark episode ${e.number} unwatched` : `Mark episode ${e.number} watched`}
                        aria-pressed={isWatched}
                        className={cn(
                          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full transition-all active:scale-90",
                          isWatched ? "bg-fg text-black" : "ring-1 ring-white/25 text-fg-3 hover:text-fg hover:ring-white/50",
                        )}
                      >
                        <motion.span key={String(isWatched)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                          <Check className="size-4" strokeWidth={isWatched ? 3 : 2} />
                        </motion.span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p className="py-8 text-[14px] text-fg-2">Episode details aren&apos;t available right now.</p>
        )}
      </div>
    </section>
  );
}
