"use client";

import { ArrowUpRight, Heart, Star } from "lucide-react";
import { useState } from "react";
import type { CommunityReviews, UserReview } from "@/lib/media/types";
import { formatRating } from "@/lib/media/format";
import { ExpandableText } from "./expandable-text";

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

const WHO: Record<string, string> = { TMDB: "TMDB members", Hardcover: "Hardcover readers" };

/** Written reviews from TMDB members (movies & TV) or Hardcover readers (books), swipeable. */
export function ReviewsSection({ data }: { data: CommunityReviews }) {
  return (
    <section aria-labelledby="reviews">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="reviews" className="text-[18px] font-bold tracking-[-0.02em]">
            Reviews
          </h2>
          <p className="text-[12.5px] text-fg-3">From {WHO[data.source] ?? data.source}</p>
        </div>
        {data.url && (
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-fg-2 hover:text-fg">
            All reviews <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:scroll-px-8 md:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {data.reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review: r }: { review: UserReview }) {
  const [revealed, setRevealed] = useState(!r.spoiler);
  const initial = (r.author ?? "?").replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <article className="w-[82vw] max-w-[360px] shrink-0 snap-start rounded-2xl bg-white/[0.04] p-4">
      <header className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-fg-2">{initial}</span>
        <div className="min-w-0 flex-1 text-[12.5px] leading-tight">
          <p className="truncate font-semibold">{r.author ?? "Anonymous"}</p>
          {r.date && <p className="text-fg-3">{DATE.format(new Date(`${r.date}T00:00:00Z`))}</p>}
        </div>
        {r.rating != null && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold tabular-nums" aria-label={`Rated ${formatRating(r.rating)} out of 5`}>
            <Star className="size-3.5 fill-star text-star" />
            {formatRating(r.rating)}
          </span>
        )}
      </header>
      {revealed ? (
        <ExpandableText text={r.text} lines={6} className="mt-3 [&_p]:text-[14px]" />
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-xl bg-white/[0.05] px-3 py-6 text-[13.5px] font-medium text-fg-2 hover:text-fg"
        >
          Contains spoilers · Tap to read
        </button>
      )}
      {r.likes > 0 && (
        <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-fg-3">
          <Heart className="size-3" /> {r.likes.toLocaleString("en-US")}
        </p>
      )}
    </article>
  );
}
