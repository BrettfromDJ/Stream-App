import { picks, tasteProfile } from "@/lib/discover/picks";
import type { MediaType } from "@/lib/media/types";
import { DiscoverRow } from "./discover-row";

const joinNice = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** Taste-based picks with the reason spelled out. Hidden until there's some signal. */
export async function PickedForYou({ types }: { types: MediaType[] }) {
  const taste = await tasteProfile(types);
  const labels = [...new Set(taste.flatMap((t) => t.genres.slice(0, 2).map((g) => g.label)))].slice(0, 3);
  if (!labels.length) return null;
  return (
    <DiscoverRow
      title="Picked for You"
      subtitle={`Because you like ${joinNice(labels)}`}
      items={picks(types, { count: 20 })}
    />
  );
}
