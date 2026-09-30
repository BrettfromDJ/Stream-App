import { ArrowUpRight } from "lucide-react";
import type { MediaDetail } from "@/lib/media/types";

function formatHours(h: number) {
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

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
