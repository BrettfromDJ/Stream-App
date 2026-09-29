import type { Metadata } from "next";
import { getMediaDetail } from "@/lib/providers";
import { getLibraryItem } from "@/lib/library/queries";
import type { MediaType } from "@/lib/media/types";

export async function detailMetadata(type: MediaType, id: string): Promise<Metadata> {
  try {
    const d = await getMediaDetail(type, id);
    return { title: d.year ? `${d.title} (${d.year})` : d.title, description: d.description?.slice(0, 160) };
  } catch {
    const item = await getLibraryItem(type, id);
    return { title: item?.title ?? "Details" };
  }
}
