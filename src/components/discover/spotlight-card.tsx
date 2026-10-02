"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Info, Plus, Sparkles } from "lucide-react";
import type { CardData } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { useQuickActions } from "@/components/library/quick-actions";
import { Artwork } from "@/components/media/artwork";
import { buttonClasses } from "@/components/ui/button";
import { BookCover } from "@/components/detail/book-hero";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  eyebrow,
  card,
  description,
  meta,
}: {
  eyebrow: string;
  card: CardData;
  description: string | null;
  meta: string[];
}) {
  const quick = useQuickActions();
  const wide = card.backdropUrl;
  const isBook = card.type === "book";
  return (
    <section aria-label={eyebrow} className="gutter">
      <div className="relative overflow-hidden rounded-[24px] bg-elevated ring-1 ring-white/[0.07]">
        <div className="absolute inset-0">
          {wide ? (
            <Image src={wide} alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-[center_25%] opacity-70" />
          ) : card.artworkUrl ? (
            // No wide art (books): a saturated wash of the cover's own colors.
            <Image src={card.artworkUrl} alt="" fill sizes="200px" className="scale-150 object-cover opacity-80 blur-3xl saturate-[1.8]" />
          ) : null}
          <div
            className={cn(
              "absolute inset-0 md:bg-gradient-to-r md:from-bg md:via-bg/75 md:to-transparent",
              wide ? "bg-gradient-to-t from-bg via-bg/70 to-bg/10" : "bg-gradient-to-t from-bg via-bg/60 to-transparent",
            )}
          />
        </div>
        <div className={cn("relative flex flex-col gap-6 p-5 md:flex-row md:items-end md:gap-8 md:p-8 md:pt-24", wide ? "pt-40" : "pt-8")}>
          {isBook ? (
            <Link href={mediaHref(card.type, card.externalId)} className={cn("mx-auto md:mx-0", wide && "max-md:hidden")} tabIndex={-1} aria-hidden>
              <BookCover src={card.artworkUrl} title={card.title} sizes="(min-width: 768px) 160px, 46vw" className="w-[46vw] max-w-[200px] md:w-[160px]" />
            </Link>
          ) : (
            <div
              className={cn(
                "relative aspect-[2/3] shrink-0 overflow-hidden rounded-[14px] shadow-2xl ring-1 ring-white/10",
                wide ? "hidden w-[150px] md:block" : "mx-auto w-[42vw] max-w-[180px] md:mx-0 md:w-[150px]",
              )}
            >
              <Artwork src={card.artworkUrl} title={card.title} type={card.type} sizes="(min-width: 768px) 150px, 42vw" />
            </div>
          )}
          <div className={cn("min-w-0 max-w-xl", !wide && "max-md:text-center")}>
            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.12em] text-fg-2 uppercase">
              <Sparkles className="size-3.5" strokeWidth={2.5} /> {eyebrow}
            </p>
            <h2 className="mt-1.5 text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[36px]">{card.title}</h2>
            {meta.length > 0 && <p className="mt-2 text-[14px] text-fg-2">{meta.join(" · ")}</p>}
            {description && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-fg/80">{description}</p>}
            <div className="mt-5 flex gap-2 max-md:*:flex-1">
              <Link href={mediaHref(card.type, card.externalId)} className={buttonClasses("primary", "md")}>
                <Info strokeWidth={2.25} /> Details
              </Link>
              {quick && (
                <button type="button" onClick={() => quick.open(card)} className={buttonClasses("glass", "md")}>
                  {card.status ? <Check strokeWidth={2.5} /> : <Plus strokeWidth={2.5} />}
                  {card.status ? "In Library" : "Add"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
