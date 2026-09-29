import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { MediaSearchResult } from "@/lib/media/types";
import { HeroCarousel, type HeroItem } from "./hero-carousel";

interface HeroProps {
  items: Promise<MediaSearchResult[]> | MediaSearchResult[];
  eyebrow: (item: MediaSearchResult, index: number) => string;
  meta: (item: MediaSearchResult) => (string | null | undefined)[];
  count?: number;
  /** Require wide artwork (movies/TV/games look best with a backdrop). */
  needsBackdrop?: boolean;
}

export async function Hero({ items, eyebrow, meta, count = 6, needsBackdrop }: HeroProps) {
  const [list, index] = await Promise.all([items, getLibraryIndex()]);
  const featured: HeroItem[] = list
    .filter((i) => i.artworkUrl && (!needsBackdrop || i.backdropUrl))
    .slice(0, count)
    .map((item, i) => ({
      card: cardFromResult(item, index),
      eyebrow: eyebrow(item, i),
      meta: meta(item).filter((m): m is string => Boolean(m)),
      description: item.description,
    }));
  if (!featured.length) return <div className="h-[calc(var(--nav-h)+1rem)]" />;
  return <HeroCarousel items={featured} />;
}
