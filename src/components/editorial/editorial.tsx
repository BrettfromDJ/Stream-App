import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial building blocks shared across the app:
 * two-tone headlines, superscript counts, big numerals and soft color meshes.
 */

/** "Exploring Minds / Inspiring Change": a strong line, then a quieter one. */
export function Headline({
  strong,
  soft,
  as: Tag = "h1",
  className,
  softClassName,
}: {
  strong: ReactNode;
  soft?: ReactNode;
  as?: "h1" | "h2" | "p";
  className?: string;
  softClassName?: string;
}) {
  return (
    <Tag className={cn("display text-balance", className)}>
      <span className="block">{strong}</span>
      {soft != null && <span className={cn("block text-fg/40", softClassName)}>{soft}</span>}
    </Tag>
  );
}

/** Tiny superscript count beside a label: Movies ⁹⁹³. */
export function Sup({ children, className }: { children: ReactNode; className?: string }) {
  return <sup className={cn("ml-0.5 align-super text-[0.55em] font-semibold tracking-normal tabular-nums opacity-55", className)}>{children}</sup>;
}

/** "350 ᴮᵉˢᵗ": a big numeral with a small raised label. */
export function BigStat({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("flex items-start gap-1", className)}>
      <span className="display text-[52px] leading-[0.85] tabular-nums md:text-[64px]">{value}</span>
      <span className="mt-0.5 text-[12px] leading-tight font-semibold text-fg/55">{label}</span>
    </div>
  );
}

export const MESHES = {
  home: ["#ff5b3d", "#3f7bff", "#a873ff"],
  watch: ["#ff5b3d", "#ff9a3d", "#7a3dff"],
  books: ["#ffb03d", "#ff6b8b", "#7d6bff"],
  games: ["#7d6bff", "#3dd1ff", "#ff5bd0"],
  library: ["#b9b3ff", "#ff7a5b", "#3f7bff"],
} as const;

/** Soft color field behind a header; fades into the page. */
export function Mesh({ colors, className, intensity = 0.55 }: { colors: readonly string[]; className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="mesh absolute -inset-[10%] animate-mesh-drift motion-reduce:animate-none"
        style={{ "--m1": colors[0], "--m2": colors[1], "--m3": colors[2], opacity: intensity } as CSSProperties}
      />
      {/* Fine grain keeps large gradients from banding and gives a printed feel. */}
      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
