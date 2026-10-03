import { ArrowUpRight, Globe, Sofa, ThumbsDown, ThumbsUp, User, Users } from "lucide-react";
import type { MediaDetail, SteamReviews } from "@/lib/media/types";
import { ExpandableText } from "./expandable-text";
import { cn } from "@/lib/utils";
import { formatHours } from "@/lib/media/progress";


export function TimeToBeat({ data }: { data: NonNullable<MediaDetail["timeToBeat"]> }) {
  const max = Math.max(...data.entries.map((e) => e.hours));
  return (
    <section aria-labelledby="ttb">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="ttb" className="text-[18px] font-bold tracking-[-0.02em]">
          Time to Beat
        </h2>
        {data.submissions ? (
          <p className="text-[12px] text-fg-3">
            From {data.submissions.toLocaleString("en-US")} player{data.submissions === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {data.entries.map((e) => (
          <div key={e.label} className="rounded-2xl bg-white/[0.04] px-3.5 py-3.5 md:px-4">
            <p className="flex items-baseline gap-1">
              <span className="text-[26px] leading-none font-bold tracking-[-0.03em] tabular-nums md:text-[30px]">
                {formatHours(e.hours)}
              </span>
              <span className="text-[13px] font-semibold text-fg-2">hrs</span>
            </p>
            <p className="mt-1.5 text-[12.5px] leading-tight text-fg-2">{e.label}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <div className="h-full rounded-full bg-fg/80" style={{ width: `${Math.max(8, (e.hours / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhereToBuy({ stores }: { stores: NonNullable<MediaDetail["stores"]> }) {
  return (
    <section aria-labelledby="buy">
      <h2 id="buy" className="mb-3 text-[18px] font-bold tracking-[-0.02em]">
        Where to Buy
      </h2>
      <ul className="overflow-hidden rounded-2xl bg-white/[0.04]">
        {stores.map((s) => (
          <li key={s.name} className="border-b border-white/[0.06] last:border-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
            >
              <span className="flex-1 text-[15.5px] font-medium">{s.name}</span>
              {s.price ? (
                <span className="flex items-center gap-2 text-[14px] tabular-nums">
                  {s.discount ? (
                    <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[12px] font-bold text-success">−{s.discount}%</span>
                  ) : null}
                  {s.originalPrice ? <span className="text-fg-3 line-through">{s.originalPrice}</span> : null}
                  <span className="font-semibold">{s.price}</span>
                </span>
              ) : null}
              <ArrowUpRight aria-hidden className="size-4 text-fg-3" />
            </a>
          </li>
        ))}
      </ul>
      {stores.some((s) => s.price) && <p className="mt-2 text-[12px] text-fg-3">Price from the US Steam store.</p>}
    </section>
  );
}

const SCORE_TONE = (percent: number | null) =>
  percent == null ? "text-fg-2" : percent >= 70 ? "text-[#66c0f4]" : percent >= 40 ? "text-[#c9a64a]" : "text-[#d46a5a]";

const REVIEW_DATE = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** Steam's overall player score, then the most helpful reviews (swipe through). */
export function SteamReviewsSection({ data }: { data: SteamReviews }) {
  return (
    <section aria-labelledby="steam-reviews">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="steam-reviews" className="text-[18px] font-bold tracking-[-0.02em]">
          Steam Reviews
        </h2>
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-2 hover:text-fg">
          All reviews <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      <div className="mt-3 flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4">
        {data.percent != null && (
          <div className={cn("text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums", SCORE_TONE(data.percent))}>
            {data.percent}%
          </div>
        )}
        <div className="min-w-0">
          <p className={cn("text-[16px] font-semibold", SCORE_TONE(data.percent))}>{data.score || "Player reviews"}</p>
          <p className="text-[13px] text-fg-2 tabular-nums">
            {data.percent != null ? `${data.percent}% of ` : ""}
            {data.total.toLocaleString("en-US")} review{data.total === 1 ? "" : "s"} recommend it
          </p>
          {data.percent != null && (
            <div className="mt-2 flex h-1.5 w-40 overflow-hidden rounded-full bg-[#d46a5a]/70 md:w-56">
              <div className="h-full bg-[#66c0f4]" style={{ width: `${data.percent}%` }} />
            </div>
          )}
        </div>
      </div>

      {data.reviews.length > 0 && (
        <div className="no-scrollbar -mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:-mx-8 md:scroll-px-8 md:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0">
          {data.reviews.map((r) => (
            <article key={r.id} className="w-[82vw] max-w-[360px] shrink-0 snap-start rounded-2xl bg-white/[0.04] p-4">
              <header className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    r.positive ? "bg-[#66c0f4]/15 text-[#66c0f4]" : "bg-[#d46a5a]/15 text-[#d46a5a]",
                  )}
                >
                  {r.positive ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}
                </span>
                <div className="min-w-0 text-[12.5px] leading-tight">
                  <p className="font-semibold">{r.positive ? "Recommended" : "Not Recommended"}</p>
                  <p className="text-fg-3">
                    {[r.hours != null ? `${r.hours.toLocaleString("en-US")} h played` : null, REVIEW_DATE.format(new Date(`${r.date}T00:00:00Z`))]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </header>
              <ExpandableText text={r.text} lines={6} className="mt-3 [&_p]:text-[14px]" />
              {r.helpful > 0 && <p className="mt-2 text-[12px] text-fg-3">{r.helpful.toLocaleString("en-US")} found this helpful</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const MODE_ICON: { match: RegExp; icon: typeof User }[] = [
  { match: /^single/i, icon: User },
  { match: /^couch|^local|^lan/i, icon: Sofa },
  { match: /co-?op|drop-in/i, icon: Users },
  { match: /online|massively|battle/i, icon: Globe },
];

/** Single-player / co-op / multiplayer at a glance, with player counts. */
export function HowToPlay({ modes }: { modes: NonNullable<MediaDetail["playModes"]> }) {
  return (
    <section aria-labelledby="how-to-play">
      <h2 id="how-to-play" className="mb-3 text-[18px] font-bold tracking-[-0.02em]">
        How to Play
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {modes.map((m) => {
          const Icon = MODE_ICON.find((x) => x.match.test(m.label))?.icon ?? Users;
          return (
            <li key={m.label} className="flex items-start gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-3">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-fg-2" />
              <div className="min-w-0">
                <p className="text-[14.5px] leading-tight font-semibold">{m.label}</p>
                {m.detail && <p className="mt-0.5 text-[12.5px] text-fg-3">{m.detail}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
