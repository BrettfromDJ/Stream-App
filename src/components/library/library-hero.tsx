"use client";

import { animate, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import type { LibraryItem } from "@/lib/media/types";
import { MESHES, Mesh } from "@/components/editorial/editorial";

export interface LibraryStat {
  label: string;
  value: number;
  /** Decimals to show (ratings). */
  digits?: number;
  prefix?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * "Your corner": a soft color field, a two-tone headline and big numerals that count up.
 * Pure transform/opacity animation; still for reduced motion.
 */
export function LibraryHero({ items, stats }: { items: LibraryItem[]; stats: LibraryStat[] }) {
  const soft = items.length ? "All yours." : "Starts here.";

  return (
    <header className="relative overflow-hidden pt-[calc(var(--nav-h)+1.5rem)] pb-6 lg:pt-[calc(var(--nav-h)+2.25rem)]">
      <Mesh colors={MESHES.library} intensity={0.5} />
      <div className="gutter relative">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="display text-[52px] md:text-[80px]"
        >
          <span className="block">Your corner</span>
          <span className="block text-fg/40">{soft}</span>
        </motion.h1>
        {stats.length > 0 && (
          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:gap-10 md:mt-9">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 + i * 0.06, ease: EASE }}
                className="flex items-start gap-1.5"
              >
                <dd className="display text-[48px] leading-[0.85] tabular-nums md:text-[60px]">
                  <CountUp value={s.value} digits={s.digits ?? 0} />
                </dd>
                <dt className="mt-0.5 max-w-[5.5em] text-[12px] leading-tight font-semibold text-fg/55">
                  {s.prefix?.trim() && <span className="text-star">{s.prefix.trim()} </span>}
                  {s.label}
                </dt>
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
    const controls = animate(mv, value, { duration: 1.1, ease: EASE as unknown as [number, number, number, number] });
    return () => controls.stop();
  }, [mv, value, reduce]);
  return <motion.span>{text}</motion.span>;
}
