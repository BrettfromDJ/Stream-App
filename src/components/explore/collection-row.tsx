import { exploreHref, presetFor } from "@/lib/discover/taxonomy";
import { explore } from "@/lib/providers/explore";
import type { MediaType } from "@/lib/media/types";
import { getUser } from "@/lib/supabase/server";
import { DiscoverRow } from "@/components/discover/discover-row";

/** First page of a curated preset (for spotlights and grids). */
export async function presetItems(type: MediaType, preset: string) {
  const p = presetFor(type, preset);
  if (!p) return [];
  const user = await getUser();
  const { items } = await explore({ sort: "popular", ...p.query, type, preset: p.slug, page: 1 }, user?.services ?? []);
  return items;
}

/** A row built from a curated Explore preset, with "See all" into the full Explore page. */
export async function CollectionRow({ type, preset, title }: { type: MediaType; preset: string; title?: string }) {
  const p = presetFor(type, preset);
  if (!p) return null;
  const user = await getUser();
  const q = { type, preset: p.slug, sort: p.query.sort ?? "popular", page: 1, ...p.query } as const;
  const { items } = await explore({ ...q, type, page: 1 }, user?.services ?? []);
  return <DiscoverRow title={title ?? p.title} items={items} href={exploreHref({ type, preset: p.slug })} />;
}
