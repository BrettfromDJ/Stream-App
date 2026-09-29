import type { Metadata } from "next";
import { getLibrary } from "@/lib/library/queries";
import { SORTS, type SortKey } from "@/lib/library/selectors";
import { isLibraryStatus, isMediaType } from "@/lib/media/types";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [library, params] = await Promise.all([getLibrary(), searchParams]);
  const type = isMediaType(params.type) ? params.type : "all";
  const status = isLibraryStatus(params.status) ? params.status : "all";
  const sort = typeof params.sort === "string" && params.sort in SORTS ? (params.sort as SortKey) : "added";

  return (
    <LibraryView
      items={library.items}
      error={"error" in library ? library.error : undefined}
      initial={{ type, status, sort }}
    />
  );
}
