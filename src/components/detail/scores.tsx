import type { ExternalScore } from "@/lib/media/types";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Rotten Tomatoes / IMDb / Metacritic badges in each source's own visual language. */
export function ExternalScores({ scores, awards, className }: { scores: ExternalScore[]; awards?: string | null; className?: string }) {
  if (!scores.length && !awards) return null;
  return (
    <div className={cn("mt-3", className)}>
      {scores.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2 max-md:justify-center">
          {scores.map((s) => (
            <li key={s.source}>
              <Badge score={s} />
            </li>
          ))}
        </ul>
      )}
      {awards && <p className="mt-2 text-[13px] text-fg-2">🏆 {awards}</p>}
    </div>
  );
}

function Badge({ score: s }: { score: ExternalScore }) {
  const inner =
    s.source === "Rotten Tomatoes" ? (
      <>
        <Tomato fresh={s.percent >= 60} />
        <span className="font-bold tabular-nums">{s.value}</span>
        <span className="text-fg-3">Tomatometer</span>
      </>
    ) : s.source === "IMDb" ? (
      <>
        <span className="rounded-[4px] bg-[#f5c518] px-1 py-px text-[11px] leading-none font-black tracking-tight text-black">IMDb</span>
        <span className="font-bold tabular-nums">{s.value}</span>
        {s.note && <span className="text-fg-3">{s.note}</span>}
      </>
    ) : (
      <>
        <span
          className={cn(
            "grid size-6 place-items-center rounded-[4px] text-[12px] leading-none font-black text-white tabular-nums",
            s.percent >= 61 ? "bg-[#00ce7a]" : s.percent >= 40 ? "bg-[#ffbd3f] text-black" : "bg-[#ff6874]",
          )}
        >
          {s.value}
        </span>
        <span className="text-fg-3">Metascore</span>
      </>
    );
  const cls = "inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 text-[13px]";
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className={cn(cls, "transition-colors hover:bg-white/[0.12]")}>
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/** Fresh tomato (60%+) or green splat, drawn inline. */
function Tomato({ fresh }: { fresh: boolean }) {
  return fresh ? (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-label="Fresh">
      <circle cx="12" cy="13.5" r="8.5" fill="#fa320a" />
      <path d="M12 5.5c-1.2-1.6-3-2.3-4.6-2 .9.8 1.6 1.8 1.9 2.9-1.1-.3-2.3-.1-3.3.5 1.5.3 2.8 1 3.6 2.1L12 7.6l2.4 1.4c.8-1.1 2.1-1.8 3.6-2.1-1-.6-2.2-.8-3.3-.5.3-1.1 1-2.1 1.9-2.9-1.6-.3-3.4.4-4.6 2Z" fill="#00912d" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-label="Rotten">
      <path d="M12 3.5c1.6 2.4 4.9 1.4 6 3.8 1.2 2.6-1.6 3.6-.6 6.2 1 2.6 3.4 3.5 1.4 5.8-2 2.3-4.4.2-6.8 1.2-2.4 1-3.6 2.6-6 .8s-.2-4.2-1.2-6.6C3.8 12.3 1.6 11.6 3 9.1 4.4 6.6 7.6 8 9.2 5.8 10.1 4.6 10.8 3.2 12 3.5Z" fill="#0ac855" />
    </svg>
  );
}

/** "● 38,214 playing now" — live from Steam. */
export function PlayersNow({ count }: { count: number }) {
  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[13px] font-medium">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5ee0a0] opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-[#5ee0a0]" />
      </span>
      <span className="tabular-nums">{count >= 100_000 ? compact.format(count) : count.toLocaleString("en-US")}</span>
      <span className="text-fg-2">playing now on Steam</span>
    </p>
  );
}
