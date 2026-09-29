"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { formatRating } from "@/lib/media/format";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * 1–5 stars with half steps. Hover to preview (desktop), tap or drag across to rate (touch),
 * arrow keys to adjust. Tapping the current rating clears it.
 */
export function StarRating({ value, onChange, size = 32, disabled, className }: StarRatingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pulse, setPulse] = useState(0);
  const interactive = Boolean(onChange) && !disabled;
  const shown = preview ?? value ?? 0;

  const valueAt = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.max(0.5, Math.ceil(ratio * 10) / 2);
  };

  const commit = (next: number | null) => {
    if (!onChange) return;
    if (typeof navigator !== "undefined") navigator.vibrate?.(6);
    setPulse((p) => p + 1);
    onChange(next);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Your rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ?? 0}
      aria-valuetext={value ? `${formatRating(value)} out of 5 stars` : "Not rated"}
      aria-disabled={!interactive || undefined}
      tabIndex={interactive ? 0 : -1}
      className={cn(
        "inline-flex touch-none items-center rounded-lg select-none",
        disabled ? "pointer-events-none opacity-40" : interactive ? "cursor-pointer" : "pointer-events-none",
        className,
      )}
      style={{ gap: size * 0.14 }}
      onPointerDown={(e) => {
        if (!interactive) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
        setPreview(valueAt(e.clientX));
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        if (dragging || e.pointerType === "mouse") setPreview(valueAt(e.clientX));
      }}
      onPointerUp={(e) => {
        if (!interactive || !dragging) return;
        setDragging(false);
        const next = valueAt(e.clientX);
        commit(next === value ? null : next);
        if (e.pointerType !== "mouse") setPreview(null);
      }}
      onPointerCancel={() => {
        setDragging(false);
        setPreview(null);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && !dragging && setPreview(null)}
      onKeyDown={(e) => {
        if (!interactive) return;
        const cur = value ?? 0;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") commit(Math.min(5, cur + 0.5));
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") commit(cur - 0.5 >= 0.5 ? cur - 0.5 : null);
        else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") commit(null);
        else return;
        e.preventDefault();
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = shown >= n ? 1 : shown >= n - 0.5 ? 0.5 : 0;
        const isEdge = value != null && Math.ceil(value) === n;
        return (
          <motion.span
            key={`${n}-${isEdge ? pulse : 0}`}
            className="relative block"
            style={{ width: size, height: size }}
            initial={isEdge && pulse ? { scale: 0.7 } : false}
            animate={{ scale: preview != null && Math.ceil(preview) === n ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
          >
            <Star aria-hidden className="absolute inset-0 size-full text-white/20" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden transition-[width] duration-150" style={{ width: `${fill * 100}%` }}>
              <Star
                aria-hidden
                className="size-full fill-star text-star"
                style={{ width: size, height: size }}
                strokeWidth={1.5}
              />
            </span>
          </motion.span>
        );
      })}
    </div>
  );
}
