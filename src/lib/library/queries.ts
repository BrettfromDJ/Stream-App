import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import type { LibraryItem, MediaType } from "@/lib/media/types";
import { createClient, getUser } from "@/lib/supabase/server";
import { DEMO_LIBRARY } from "@/lib/demo/library";
import { libraryKey, type LibraryIndex } from "@/lib/media/card";
import { LIBRARY_COLUMNS, fromRow, type LibraryRow } from "./mappers";

export type LibraryResult =
  | { mode: "preview"; items: LibraryItem[] }
  | { mode: "live"; items: LibraryItem[]; error?: string }
  | { mode: "signed_out"; items: [] };

/**
 * The whole personal library in one query (deduped per request).
 * A personal library is small enough that filtering/sorting in memory keeps every screen instant.
 */
export const getLibrary = cache(async (): Promise<LibraryResult> => {
  if (!isSupabaseConfigured) return { mode: "preview", items: DEMO_LIBRARY };
  const user = await getUser();
  if (!user) return { mode: "signed_out", items: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_items")
    .select(LIBRARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[library]", error.message);
    return { mode: "live", items: [], error: "We couldn't load your library. Pull to refresh or try again." };
  }
  return { mode: "live", items: (data as LibraryRow[]).map(fromRow) };
});

export async function getLibraryItem(type: MediaType, externalId: string): Promise<LibraryItem | null> {
  const { items } = await getLibrary();
  return items.find((i) => i.mediaType === type && i.externalId === externalId) ?? null;
}

/** Keys like "movie:603" for marking search results already in the library. */
export async function getLibraryIndex(): Promise<LibraryIndex> {
  const { items } = await getLibrary();
  return Object.fromEntries(items.map((i) => [libraryKey(i.mediaType, i.externalId), { id: i.id, status: i.status, rating: i.rating }]));
}
