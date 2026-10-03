"use client";

import Image from "next/image";
import { animate, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import type { LibraryItem } from "@/lib/media/types";

export interface LibraryStat {
  label: string;
  value: number;
  /** Decimals to show (ratings). */
  digits?: number;
  prefix?: string;
}

/**
 * "Your corner": your own covers drifting slowly behind the title, and stats that count up.
 * Pure transform/opacity animation; still for reduced motion.
 */
export function LibraryHero({ items, stats }: { items: LibraryItem[]; stats: LibraryStat[] }) {
  const art = items.filter((i) => i.artworkUrl).slice(0, 30);
  const rows = art.length >= 6 ? [0, 1, 2].map((r) => art.filter((_, i) => i % 3 === r)) : [];

  return (
    <header className="relative overflow-hidden pt-[calc(var(--nav-h)+1.25rem)] pb-6 lg:pt-[calc(var(--nav-h)+1.75rem)]">
      {rows.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -inset-x-24 -top-6 flex -rotate-[7deg] flex-col gap-2.5 opacity-[0.42] md:gap-3.5">
            {rows.map((row, r) => {
              // Repeat short rows so the strip is always wider than the screen.
              const strip = Array.from({ length: Math.max(2, Math.ceil(14 / Math.max(1, row.length))) }, () => row).flat();
              return (
                <div
                  key={r}
                  className="flex w-max animate-marquee gap-2.5 motion-reduce:animate-none md:gap-3.5"
                  style={{ animationDuration: `${150 + r * 40}s`, animationDirection: r % 2 ? "reverse" : "normal" }}
                >
                  {[...strip, ...strip].map((item, i) => (
                    <div key={`${item.id}-${i}`} className="relative aspect-[2/3] w-[78px] shrink-0 overflow-hidden rounded-[9px] bg-elevated-2 md:w-[104px]">
                      <Image src={item.artworkUrl!} alt="" fill sizes="104px" className="object-cover" loading={r === 0 && i < 8 ? "eager" : "lazy"} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/75 to-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_55%,rgb(9_9_9/0.85),transparent_70%)]" />
        </div>
      )}

      <div className="gutter relative">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-[12px] font-bold tracking-[0.14em] text-fg-2 uppercase"
        >
          Your corner
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 text-[40px] leading-[1] font-bold tracking-[-0.035em] md:text-[56px]"
        >
          Library
        </motion.h1>
        {stats.length > 0 && (
          <dl className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="glass shrink-0 rounded-2xl px-3 py-2.5 md:px-4 md:py-3"
              >
                <dt className="text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-fg-3 uppercase md:text-[11.5px]">{s.label}</dt>
                <dd className="mt-1 text-[20px] leading-none font-bold tracking-[-0.03em] tabular-nums md:text-[24px]">
                  {s.prefix}
                  <CountUp value={s.value} digits={s.digits ?? 0} />
                </dd>
              </motion.div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}

function CountUp({ value, digits }: { value: number; digits: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => v.toFixed(digits));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value, reduce]);
  return <motion.span>{text}</motion.span>;
}
