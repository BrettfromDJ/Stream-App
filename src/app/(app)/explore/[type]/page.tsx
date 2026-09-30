import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exploreHref, exploreTitle, parseExplore } from "@/lib/discover/taxonomy";
import { explore } from "@/lib/providers/explore";
import { getLibraryIndex } from "@/lib/library/queries";
import { isMediaType } from "@/lib/media/types";
import { getUser } from "@/lib/supabase/server";
import { ExploreView } from "@/components/explore/explore-view";

type Props = { params: Promise<{ type: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!isMediaType(type)) return {};
  return { title: exploreTitle(parseExplore(type, await searchParams)).title };
}

export default async function ExplorePage({ params, searchParams }: Props) {
  const { type } = await params;
  if (!isMediaType(type)) notFound();
  const query = { ...parseExplore(type, await searchParams), page: 1 };
  const user = await getUser();
  const services = user?.services ?? [];
  const [result, index] = await Promise.all([explore(query, services), getLibraryIndex()]);

  return (
    <ExploreView
      key={exploreHref(query)}
      query={query}
      initial={result}
      libraryIndex={index}
      hasServices={services.length > 0}
    />
  );
}
