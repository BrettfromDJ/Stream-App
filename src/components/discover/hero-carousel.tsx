"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Info, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CardData } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { useQuickActions } from "@/components/library/quick-actions";
import { Artwork } from "@/components/media/artwork";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroItem {
  card: CardData;
  eyebrow?: string;
  meta: string[];
  description?: string | null;
}

const INTERVAL = 8000;

/**
 * Netflix / Apple TV-style featured banner.
 * Phones: swipeable poster cards. Larger screens: full-bleed artwork that crossfades on a timer.
 */
export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const quick = useQuickActions();

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % items.length), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, items.length]);

  if (!items.length) return null;
  const current = items[index];

  const actions = (item: HeroItem, compact = false) => (
    <div className="flex gap-2">
      <Link href={mediaHref(item.card.type, item.card.externalId)} className={buttonClasses("primary", compact ? "md" : "lg", compact ? "flex-1" : "")}>
        <Info strokeWidth={2.25} /> Details
      </Link>
      {quick && (
        <button
          type="button"
          onClick={() => quick.open(item.card)}
          className={buttonClasses("glass", compact ? "md" : "lg", compact ? "flex-1" : "")}
        >
          {item.card.status ? <Check strokeWidth={2.5} /> : <Plus strokeWidth={2.5} />}
          {item.card.status ? "In Library" : "Add"}
        </button>
      )}
    </div>
  );

  return (
    <section aria-roledescription="carousel" aria-label="Featured">
      {/* Phones: swipeable poster cards */}
      <div className="no-scrollbar gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pt-[calc(var(--nav-h)+0.75rem)] md:hidden">
        {items.map((item, i) => (
          <article key={item.card.externalId} className="relative aspect-[4/5] w-[86vw] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-[24px] bg-elevated-2 ring-1 ring-white/10">
            <Artwork src={item.card.artworkUrl ?? item.card.backdropUrl} title={item.card.title} type={item.card.type} sizes="60vw" priority={i === 0} compactFallback />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              {item.eyebrow && <p className="text-[11.5px] font-bold tracking-[0.1em] text-fg-2 uppercase">{item.eyebrow}</p>}
              <h2 className="mt-1 line-clamp-2 text-[32px] leading-[1] font-display font-bold tracking-[-0.04em] text-balance">{item.card.title}</h2>
              {item.meta.length > 0 && <p className="mt-1.5 truncate text-[13px] text-fg-2">{item.meta.join(" · ")}</p>}
              <div className="mt-4">{actions(item, true)}</div>
            </div>
          </article>
        ))}
      </div>

      {/* Tablet & desktop: full-bleed crossfading hero */}
      <div
        className="relative hidden h-[min(78vh,760px)] min-h-[520px] w-full overflow-hidden md:block"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={current.card.externalId}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.card.backdropUrl ? (
              <Image src={current.card.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover object-[center_20%]" />
            ) : current.card.artworkUrl ? (
              <>
                <Image src={current.card.artworkUrl} alt="" fill priority sizes="600px" className="scale-125 object-cover opacity-50 blur-3xl saturate-150" />
                <div className="absolute top-1/2 right-[8%] aspect-[2/3] w-[clamp(200px,22vw,300px)] -translate-y-[45%] overflow-hidden rounded-[18px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                  <Artwork src={current.card.artworkUrl} title={current.card.title} type={current.card.type} sizes="300px" priority />
                </div>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/50 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg to-transparent" />

        <div className="gutter absolute inset-x-0 bottom-[12%]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.card.externalId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[560px]"
            >
              {current.eyebrow && <p className="text-[13px] font-bold tracking-[0.12em] text-fg-2 uppercase">{current.eyebrow}</p>}
              <h2 className="mt-2 line-clamp-2 text-[52px] leading-[0.98] font-display font-bold tracking-[-0.04em] text-balance lg:text-[56px]">
                {current.card.title}
              </h2>
              {current.meta.length > 0 && <p className="mt-3 text-[15px] text-fg-2">{current.meta.join(" · ")}</p>}
              {current.description && (
                <p className="mt-3 line-clamp-3 text-[15.5px] leading-relaxed text-fg/80">{current.description}</p>
              )}
              <div className="mt-6">{actions(current)}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {items.length > 1 && (
          <div className="gutter absolute right-0 bottom-[12%] flex gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.card.externalId}
                type="button"
                aria-label={`Show ${item.card.title}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className="relative h-1 w-7 overflow-hidden rounded-full bg-white/25"
              >
                {i === index && (
                  <motion.span
                    key={`${index}-${paused}`}
                    className={cn("absolute inset-y-0 left-0 rounded-full bg-fg")}
                    initial={{ width: paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused ? 0 : INTERVAL / 1000, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div aria-hidden>
      <div className="gutter pt-[calc(var(--nav-h)+0.75rem)] md:hidden">
        <div className="skeleton aspect-[4/5] w-[86vw] max-w-[420px] rounded-[24px]" />
      </div>
      <div className="skeleton hidden h-[min(78vh,760px)] min-h-[520px] w-full opacity-50 md:block" />
    </div>
  );
}
