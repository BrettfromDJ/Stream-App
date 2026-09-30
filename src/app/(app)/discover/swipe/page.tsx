import type { Metadata } from "next";
import { isMediaType, type MediaType } from "@/lib/media/types";
import { SwipeDeck } from "@/components/discover/swipe-deck";

export const metadata: Metadata = { title: "Swipe to Discover" };

export default async function SwipePage({ searchParams }: { searchParams: Promise<{ types?: string }> }) {
  const { types } = await searchParams;
  const list = (types ?? "movie,tv").split(",").filter(isMediaType) as MediaType[];
  return <SwipeDeck key={list.join(",")} types={list.length ? list : ["movie", "tv"]} />;
}
