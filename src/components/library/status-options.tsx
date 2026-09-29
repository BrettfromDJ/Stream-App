"use client";

import { Bookmark, Check, CircleCheck, CirclePlay, CircleSlash, Gamepad2, BookOpen, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { statusLabel, STATUS_ORDER } from "@/lib/media/status";
import type { LibraryStatus, MediaType } from "@/lib/media/types";
import { cn } from "@/lib/utils";

const ICON: Record<LibraryStatus, (type: MediaType) => typeof Bookmark> = {
  backlog: () => Bookmark,
  in_progress: (t) => (t === "book" ? BookOpen : t === "game" ? Gamepad2 : CirclePlay),
  completed: () => CircleCheck,
  dropped: () => CircleSlash,
};

interface StatusOptionsProps {
  type: MediaType;
  current?: LibraryStatus | null;
  onSelect: (status: LibraryStatus) => void;
  onRemove?: () => void;
}

/** The list inside the "Add to…" / "Change status" sheet. One tap saves. */
export function StatusOptions({ type, current, onSelect, onRemove }: StatusOptionsProps) {
  return (
    <div className="flex flex-col gap-1">
      {STATUS_ORDER.map((status, i) => {
        const Icon = ICON[status](type);
        const active = status === current;
        return (
          <motion.button
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(status)}
            className={cn(
              "flex h-14 items-center gap-3.5 rounded-2xl px-4 text-left text-[16px] font-medium transition-colors",
              active ? "bg-white/[0.1]" : "hover:bg-white/[0.06] active:bg-white/[0.08]",
            )}
          >
            <Icon aria-hidden className="size-[22px] text-fg-2" strokeWidth={1.75} />
            <span className="flex-1">{statusLabel(status, type)}</span>
            {active && <Check aria-label="Current" className="size-5 text-fg" strokeWidth={2.25} />}
          </motion.button>
        );
      })}
      {onRemove && (
        <button
          onClick={onRemove}
          className="mt-2 flex h-14 items-center gap-3.5 rounded-2xl px-4 text-left text-[16px] font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <Trash2 aria-hidden className="size-[22px]" strokeWidth={1.75} />
          Remove from Library
        </button>
      )}
    </div>
  );
}
