import type { Metadata } from "next";
import Link from "next/link";
import { getLibrary } from "@/lib/library/queries";
import { computeStats } from "@/lib/library/selectors";
import { cardFromItem } from "@/lib/media/card";
import { TYPE_NOUN_PLURAL } from "@/lib/media/labels";
import { MEDIA_TYPES } from "@/lib/media/types";
import { BackButton } from "@/components/detail/back-button";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistics" };

const TOP_TITLE = { movie: "Top-Rated Movies", tv: "Top-Rated Shows", book: "Top-Rated Books", game: "Top-Rated Games" } as const;

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const [library, params] = await Promise.all([getLibrary(), searchParams]);
  const current = new Date().getFullYear();
  const requested = Number.parseInt(params.year ?? "", 10);
  const year = Number.isFinite(requested) && requested > 1900 && requested <= current ? requested : current;
  const stats = computeStats(library.items, year);
  const finishedTotal = MEDIA_TYPES.reduce((n, t) => n + stats.finishedThisYear[t], 0);

  return (
    <div className="animate-fade-in">
      <div className="gutter pt-[calc(var(--nav-h)+0.75rem)] lg:pt-[calc(var(--nav-h)+1.5rem)]">
        <BackButton />
      </div>

      <section className="gutter mt-6">
        {stats.years.length > 1 && (
        <div className="no-scrollbar -mx-1 mb-6 flex gap-1 overflow-x-auto px-1">
          {stats.years.map((y) => (
            <Link
              key={y}
              href={y === current ? "/profile/stats" : `/profile/stats?year=${y}`}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[14px] font-semibold tabular-nums transition-colors",
                y === year ? "bg-fg text-black" : "text-fg-3 hover:text-fg",
              )}
            >
              {y}
            </Link>
          ))}
        </div>
        )}

        <h1 className=" text-[64px] leading-none font-bold tracking-[-0.05em] tabular-nums md:text-[88px]">{year}</h1>
        <p className="mt-2 text-[15px] text-fg-2">
          {finishedTotal ? `${finishedTotal} finished so far${year === current ? " this year" : ""}.` : "Nothing finished yet."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 md:max-w-3xl">
          {MEDIA_TYPES.map((t) => (
            <div key={t}>
              <p className="text-[40px] leading-none font-bold tracking-[-0.04em] tabular-nums">{stats.finishedThisYear[t]}</p>
              <p className="mt-1.5 text-[14px] text-fg-2">{TYPE_NOUN_PLURAL[t]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gutter mt-14">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">All Time</p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 md:max-w-3xl">
          <Stat label="Average Rating" value={stats.averageRating != null ? `★ ${stats.averageRating}` : "—"} />
          <Stat label="Completed" value={stats.completed} />
          <Stat label="In Progress" value={stats.inProgress} />
          <Stat label="Dropped" value={stats.dropped} />
        </div>
      </section>

      <div className="mt-14 flex flex-col gap-10">
        {MEDIA_TYPES.filter((t) => stats.topRated[t].length).map((t) => (
          <Row key={t} title={TOP_TITLE[t]} href={`/library?type=${t}&sort=rating_desc`}>
            {stats.topRated[t].map((item) => (
              <MediaCard key={item.id} media={cardFromItem(item)} sizes={ROW_SIZES.poster} />
            ))}
          </Row>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[28px] leading-none font-bold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="mt-1.5 text-[14px] text-fg-2">{label}</p>
    </div>
  );
}
