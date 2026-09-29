"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CardData } from "@/lib/media/card";
import { Sheet } from "@/components/ui/sheet";
import { StatusOptions } from "./status-options";
import { useLibraryMutations } from "./use-library-mutations";

interface QuickActionsContext {
  open: (media: CardData) => void;
}

const Ctx = createContext<QuickActionsContext | null>(null);

/**
 * One shared sheet for card quick actions (desktop hover button, mobile long-press),
 * so hundreds of cards don't each mount their own drawer.
 */
export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<CardData | null>(null);
  const [open, setOpen] = useState(false);
  const { setStatus, remove } = useLibraryMutations();

  const openFor = useCallback((m: CardData) => {
    setMedia(m);
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ open: openFor }), [openFor]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {media && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title={media.libraryId ? media.title : "Add to…"}
          description={media.libraryId ? "Change status" : media.title}
        >
          <StatusOptions
            type={media.type}
            current={media.status}
            onSelect={(s) => {
              setOpen(false);
              setStatus(media, s);
            }}
            onRemove={
              media.libraryId
                ? () => {
                    setOpen(false);
                    remove(media);
                  }
                : undefined
            }
          />
        </Sheet>
      )}
    </Ctx.Provider>
  );
}

export function useQuickActions() {
  return useContext(Ctx);
}
