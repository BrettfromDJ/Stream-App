import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { MediaSearchResult } from "@/lib/media/types";
import { MediaCard } from "@/components/media/media-card";

/** A compact, non-scrolling grid of a handful of titles — breaks up the row rhythm. */
export async function GridBlock({
  title,
  subtitle,
  items,
  href,
}: {
  title: string;
  subtitle?: string;
  items: MediaSearchResult[] | Promise<MediaSearchResult[]>;
  href?: string;
}) {
  const [list, index] = await Promise.all([items, getLibraryIndex()]);
  const shown = list.filter((i) => i.artworkUrl).slice(0, 12);
  if (shown.length < 6) return null;
  return (
    <section aria-label={title} className="cv-auto gutter">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="display text-[26px] md:text-[32px]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13.5px] text-fg-2">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="flex shrink-0 items-center text-[14px] font-medium text-fg-2 hover:text-fg">
            See all <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 md:grid-cols-6 md:gap-x-3.5">
        {shown.map((item, i) => (
          <MediaCard
            key={item.externalId}
            media={cardFromResult(item, index)}
            sizes="(min-width: 768px) 15vw, (min-width: 640px) 23vw, 31vw"
            showRating={false}
            showInLibrary
            className={i >= 8 ? "hidden md:block" : i >= 6 ? "hidden sm:block" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
