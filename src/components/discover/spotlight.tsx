import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import { TYPE_LABEL } from "@/lib/media/labels";
import { dayNumber } from "@/lib/media/format";
import type { MediaSearchResult } from "@/lib/media/types";
import { SpotlightCard } from "./spotlight-card";

/** Picks one title "of the day" from a list and gives it an editorial, full-width card. */
export async function Spotlight({
  eyebrow,
  items,
  pool = 6,
}: {
  eyebrow: string;
  items: MediaSearchResult[] | Promise<MediaSearchResult[]>;
  pool?: number;
}) {
  const [list, index] = await Promise.all([items, getLibraryIndex()]);
  const candidates = list.filter((i) => i.artworkUrl && (i.backdropUrl || i.type === "book")).slice(0, pool);
  if (!candidates.length) return null;
  // Rotates daily, stable within a day.
  const pick = candidates[dayNumber() % candidates.length];
  return (
    <SpotlightCard
      eyebrow={eyebrow}
      card={cardFromResult(pick, index)}
      description={pick.description ?? null}
      meta={[TYPE_LABEL[pick.type], pick.year ? String(pick.year) : null, pick.subtitle].filter((m): m is string => Boolean(m))}
    />
  );
}
