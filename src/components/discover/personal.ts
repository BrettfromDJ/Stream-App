import "server-only";
import { getLibrary } from "@/lib/library/queries";
import type { LibraryItem, MediaSearchResult, MediaType } from "@/lib/media/types";

/** The user's most recently finished, highest-rated title of the given types (4★+). */
export async function favoriteOf(types: MediaType[]): Promise<LibraryItem | null> {
  const { items } = await getLibrary();
  const loved = items
    .filter((i) => types.includes(i.mediaType) && (i.rating ?? 0) >= 4)
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        new Date(b.dateFinished ?? b.updatedAt).getTime() - new Date(a.dateFinished ?? a.updatedAt).getTime(),
    );
  return loved[0] ?? null;
}

/** Drop things already in the library from recommendations. */
export async function notInLibrary(list: MediaSearchResult[]) {
  const { items } = await getLibrary();
  const have = new Set(items.map((i) => `${i.mediaType}:${i.externalId}`));
  return list.filter((r) => !have.has(`${r.type}:${r.externalId}`));
}
