"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ROW_ITEM } from "./row-sizes";

export function ScrollRow({ children, size }: { children: ReactNode; size: "poster" | "wide" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="group/row relative">
      <div
        ref={ref}
        onScroll={update}
        className={cn(
          "no-scrollbar gutter flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth pb-2",
          size === "wide" ? "gap-3 md:gap-4" : "gap-2.5 md:gap-3.5",
          "scroll-px-[max(env(safe-area-inset-left),1.25rem)] md:scroll-px-8 xl:scroll-px-11",
        )}
      >
        {Children.map(children, (child) =>
          child ? <div className={cn("shrink-0 snap-start", ROW_ITEM[size])}>{child}</div> : null,
        )}
      </div>
      <Arrow side="left" hidden={edges.start} onClick={() => page(-1)} />
      <Arrow side="right" hidden={edges.end} onClick={() => page(1)} />
    </div>
  );
}

function Arrow({ side, hidden, onClick }: { side: "left" | "right"; hidden: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "glass absolute top-[calc(50%-1.5rem)] z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full text-fg",
        "opacity-0 transition-opacity duration-200 [@media(hover:hover)]:grid",
        side === "left" ? "left-3" : "right-3",
        hidden ? "pointer-events-none" : "group-hover/row:opacity-100",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
