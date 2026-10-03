"use client";

import { ArrowUpRight, Heart, Star } from "lucide-react";
import { useState } from "react";
import type { CommunityReviews, UserReview } from "@/lib/media/types";
import { formatRating } from "@/lib/media/format";
import { ExpandableText } from "./expandable-text";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const WHO: Record<string, string> = {
  TMDB: "TMDB members",
  Hardcover: "Hardcover readers",
};

/** Written reviews from TMDB members (movies & TV) or Hardcover readers (books), swipeable. */
export function ReviewsSection({ data }: { data: CommunityReviews }) {
  return (
    <section aria-labelledby="reviews">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 id="reviews" className="text-[18px] font-bold tracking-[-0.02em]">
            Reviews
          </h2>
          <p className="text-[12.5px] text-fg-3">
            From {WHO[data.source] ?? data.source}
          </p>
        </div>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-fg-2 hover:text-fg"
          >
            All reviews <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
      {data.overall && (
        <Overall overall={data.overall} who={WHO[data.source] ?? data.source} />
      )}
      {data.reviews.length > 0 && (
        <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:scroll-px-8 md:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0">
          {data.reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Plain-English verdict for an average score, using the same bands as Steam. */
function verdict(ratio: number) {
  if (ratio >= 0.84)
    return { label: "Overwhelmingly Positive", tone: "text-[#66c0f4]" };
  if (ratio >= 0.74) return { label: "Very Positive", tone: "text-[#66c0f4]" };
  if (ratio >= 0.64)
    return { label: "Mostly Positive", tone: "text-[#66c0f4]" };
  if (ratio >= 0.5) return { label: "Mixed", tone: "text-[#c9a64a]" };
  return { label: "Mostly Negative", tone: "text-[#d46a5a]" };
}

/** The headline: average score, a five-star bar, the verdict and how many people rated it. */
function Overall({
  overall,
  who,
}: {
  overall: NonNullable<CommunityReviews["overall"]>;
  who: string;
}) {
  const ratio = overall.value / overall.max;
  const stars = ratio * 5;
  const v = verdict(ratio);
  return (
    <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
      <div className="shrink-0 text-center">
        <p
          className={cn(
            "text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums",
            v.tone,
          )}
        >
          {overall.max === 10
            ? overall.value.toFixed(1)
            : formatRating(Math.round(overall.value * 10) / 10)}
        </p>
        <p className="mt-1 text-[11.5px] font-semibold text-fg-3">
          out of {overall.max}
        </p>
      </div>
      <div className="min-w-0">
        <p className={cn("text-[16px] font-semibold", v.tone)}>{v.label}</p>
        <div
          className="mt-1 flex items-center gap-0.5"
          aria-label={`${stars.toFixed(1)} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, i) => {
            const fill = Math.max(0, Math.min(1, stars - i));
            return (
              <span key={i} className="relative inline-block size-4">
                <Star className="absolute inset-0 size-4 text-white/20" />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="size-4 fill-star text-star" />
                </span>
              </span>
            );
          })}
        </div>
        <p className="mt-1 text-[13px] text-fg-2 tabular-nums">
          Average of {overall.count.toLocaleString("en-US")} rating
          {overall.count === 1 ? "" : "s"} from {who}
        </p>
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: UserReview }) {
  const [revealed, setRevealed] = useState(!r.spoiler);
  const initial = (r.author ?? "?").replace(/^@/, "").charAt(0).toUpperCase();
  return (
    <article className="w-[82vw] max-w-[360px] shrink-0 snap-start rounded-2xl bg-white/[0.04] p-4">
      <header className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-fg-2">
          {initial}
        </span>
        <div className="min-w-0 flex-1 text-[12.5px] leading-tight">
          <p className="truncate font-semibold">{r.author ?? "Anonymous"}</p>
          {r.date && (
            <p className="text-fg-3">
              {DATE.format(new Date(`${r.date}T00:00:00Z`))}
            </p>
          )}
        </div>
        {r.rating != null && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold tabular-nums"
            aria-label={`Rated ${formatRating(r.rating)} out of 5`}
          >
            <Star className="size-3.5 fill-star text-star" />
            {formatRating(r.rating)}
          </span>
        )}
      </header>
      {revealed ? (
        <ExpandableText
          text={r.text}
          lines={6}
          className="mt-3 [&_p]:text-[14px]"
        />
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
