import Link from "next/link";
import { BookOpen, ChevronRight, Clapperboard } from "lucide-react";
import type { MediaDetail } from "@/lib/media/types";
import { mediaHref, TYPE_LABEL } from "@/lib/media/labels";
import { Artwork } from "@/components/media/artwork";
import { BookCover } from "./book-hero";

/** Movies & TV → "Based on the book"; books → "On Screen". */
export function Adaptations({ data }: { data: NonNullable<MediaDetail["adaptations"]> }) {
  const source = data.kind === "source";
  return (
    <section aria-labelledby="adaptations">
      <h2 id="adaptations" className="mb-3 flex items-center gap-2 text-[18px] font-bold tracking-[-0.02em]">
        {source ? <BookOpen className="size-[18px] text-fg-2" /> : <Clapperboard className="size-[18px] text-fg-2" />}
        {source ? "Based on the Book" : "On Screen"}
      </h2>
      <ul className="flex flex-col gap-2">
        {data.items.map((m) => (
          <li key={`${m.type}-${m.externalId}`}>
            <Link
              href={mediaHref(m.type, m.externalId)}
              className="group flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3 pr-4 transition-colors hover:bg-white/[0.07]"
            >
              {m.type === "book" ? (
                <BookCover src={m.artworkUrl} title={m.title} sizes="64px" size="sm" priority={false} className="w-14" />
              ) : (
                <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-[8px] bg-elevated-2 ring-1 ring-white/10">
                  <Artwork src={m.artworkUrl} title={m.title} type={m.type} sizes="64px" compactFallback />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold tracking-wide text-fg-3 uppercase">
                  {TYPE_LABEL[m.type]}
                  {m.year ? ` · ${m.year}` : ""}
                </p>
                <p className="truncate text-[16px] font-semibold">{m.title}</p>
                {m.subtitle && <p className="truncate text-[13.5px] text-fg-2">{m.type === "book" ? `by ${m.subtitle}` : m.subtitle}</p>}
              </div>
              <ChevronRight className="size-5 shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
