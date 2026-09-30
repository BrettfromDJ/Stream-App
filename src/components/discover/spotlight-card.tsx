"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Info, Plus } from "lucide-react";
import type { CardData } from "@/lib/media/card";
import { mediaHref } from "@/lib/media/labels";
import { useQuickActions } from "@/components/library/quick-actions";
import { Artwork } from "@/components/media/artwork";
import { buttonClasses } from "@/components/ui/button";

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
  return (
    <section aria-label={eyebrow} className="gutter">
      <div className="relative overflow-hidden rounded-[24px] bg-elevated ring-1 ring-white/[0.07]">
        <div className="absolute inset-0">
          {wide ? (
            <Image src={wide} alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover object-[center_25%] opacity-70" />
          ) : card.artworkUrl ? (
            <Image src={card.artworkUrl} alt="" fill sizes="400px" className="scale-125 object-cover opacity-50 blur-3xl saturate-150" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10 md:bg-gradient-to-r md:from-bg md:via-bg/75 md:to-transparent" />
        </div>
        <div className="relative flex flex-col gap-5 p-5 pt-40 md:flex-row md:items-end md:gap-8 md:p-8 md:pt-24">
          <div className="relative hidden aspect-[2/3] w-[150px] shrink-0 overflow-hidden rounded-[14px] shadow-2xl ring-1 ring-white/10 md:block">
            <Artwork src={card.artworkUrl} title={card.title} type={card.type} sizes="150px" />
          </div>
          <div className="min-w-0 max-w-xl">
            <p className="text-[12px] font-bold tracking-[0.12em] text-fg-2 uppercase">{eyebrow}</p>
            <h2 className="mt-1.5 text-[28px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[36px]">{card.title}</h2>
            {meta.length > 0 && <p className="mt-2 text-[14px] text-fg-2">{meta.join(" · ")}</p>}
            {description && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-fg/80">{description}</p>}
            <div className="mt-5 flex gap-2">
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
