"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addToLibrary, removeFromLibrary, updateStatus, type ActionResult } from "@/lib/library/actions";
import type { CardData } from "@/lib/media/card";
import { snapshotOf } from "@/lib/media/card";
import { statusLabel } from "@/lib/media/status";
import type { LibraryStatus } from "@/lib/media/types";

export function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
}

export function reportError<T>(res: ActionResult<T>, fallbackTitle = "Something went wrong"): res is Extract<ActionResult<T>, { ok: true }> {
  if (res.ok) return true;
  toast(res.error === "preview" ? "Preview mode" : fallbackTitle, { description: res.message });
  return false;
}

/** Adds or changes status. Resolves to the library item id, or null on failure. */
export async function applyStatus(media: CardData, status: LibraryStatus): Promise<string | null> {
  if (media.libraryId) {
    if (media.status === status) return media.libraryId;
    const res = await updateStatus(media.libraryId, status);
    if (!reportError(res)) return null;
    toast(statusLabel(status, media.type), { description: media.title });
    return res.data.id;
  }
  const res = await addToLibrary(snapshotOf(media), status);
  if (!reportError(res)) return null;
  toast(`Added to ${statusLabel(status, media.type)}`, { description: media.title });
  return res.data.id;
}

export async function applyRemove(media: CardData): Promise<boolean> {
  if (!media.libraryId) return false;
  const res = await removeFromLibrary(media.libraryId);
  if (!reportError(res)) return false;
  toast("Removed from Library", { description: media.title });
  return true;
}

/** Fire-and-forget versions for quick actions. Server actions revalidate the page automatically. */
export function useLibraryMutations() {
  const [pending, startTransition] = useTransition();
  return {
    pending,
    setStatus: (media: CardData, status: LibraryStatus) => {
      haptic();
      startTransition(async () => {
        await applyStatus(media, status);
      });
    },
    remove: (media: CardData) => {
      haptic();
      startTransition(async () => {
        await applyRemove(media);
      });
    },
  };
}
