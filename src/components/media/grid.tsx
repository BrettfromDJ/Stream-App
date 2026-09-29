import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Responsive artwork grid: 3 cols on phones → 7 on wide desktops. */
export function MediaGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "gutter grid grid-cols-3 gap-x-2.5 gap-y-5 max-[359px]:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 md:gap-x-4 md:gap-y-7 xl:grid-cols-6 2xl:grid-cols-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const GRID_SIZES =
  "(min-width: 1536px) 13vw, (min-width: 1280px) 15vw, (min-width: 768px) 18vw, (min-width: 640px) 23vw, 31vw";
