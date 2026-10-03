import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ShapeKind = "arch" | "ring" | "split" | "stairs" | "bubbles" | "sun" | "bars" | "chevron";

export const BLOCK_COLORS = ["#ff5b3d", "#ffd84a", "#b9b3ff", "#a9e8c4", "#a873ff", "#ffaee9", "#e4f78a", "#8fc7ff"] as const;
const SHAPES: ShapeKind[] = ["arch", "ring", "split", "stairs", "bubbles", "sun", "bars", "chevron"];

/** Picks a color + shape for the nth tile so neighbors never match. */
export function blockStyle(i: number) {
  return { color: BLOCK_COLORS[i % BLOCK_COLORS.length], shape: SHAPES[(i * 3) % SHAPES.length] };
}

/** Darker/lighter variant of a hex color for the shape (same hue, like print overlays). */
function tone(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, ((n >> shift) & 255) + amount));
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
}

/** Simple flat geometry, drawn in a deeper tone of the block color. */
export function Shape({ kind, color, className }: { kind: ShapeKind; color: string; className?: string }) {
  const a = tone(color, -38);
  const b = tone(color, 30);
  const c = tone(color, -70);
  const shapes: Record<ShapeKind, ReactNode> = {
    arch: (
      <>
        <path d="M10 100V60a40 40 0 0 1 80 0v40Z" fill={a} />
        <path d="M30 100V64a20 20 0 0 1 40 0v36Z" fill={b} />
      </>
    ),
    ring: <circle cx="50" cy="55" r="30" fill="none" stroke={a} strokeWidth="18" />,
    split: (
      <>
        <circle cx="50" cy="55" r="34" fill={a} />
        <path d="M58 18 38 92" stroke={color} strokeWidth="9" />
      </>
    ),
    stairs: <path d="M8 96V70h28V46h28V22h28v74Z" fill={a} />,
    bubbles: (
      <>
        <circle cx="38" cy="58" r="26" fill={b} />
        <circle cx="64" cy="50" r="26" fill={a} opacity="0.85" />
      </>
    ),
    sun: (
      <>
        <circle cx="50" cy="62" r="30" fill={a} />
        <rect x="0" y="62" width="100" height="40" fill={color} opacity="0.55" />
      </>
    ),
    bars: (
      <>
        <rect x="18" y="20" width="16" height="76" rx="2" fill={a} />
        <rect x="44" y="40" width="16" height="56" rx="2" fill={c} />
        <rect x="70" y="10" width="16" height="86" rx="2" fill={a} />
      </>
    ),
    chevron: <path d="M14 20h34l38 38-38 38H14l38-38Z" fill={a} />,
  };
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className} preserveAspectRatio="xMidYMax meet">
      {shapes[kind]}
    </svg>
  );
}

/** Two-tone title over a flat color with a shape — the print-poster tile. */
export function ColorBlock({
  title,
  soft,
  footer,
  color,
  shape,
  className,
  children,
}: {
  title: ReactNode;
  soft?: ReactNode;
  footer?: ReactNode;
  color: string;
  shape?: ShapeKind;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative flex flex-col overflow-hidden rounded-[10px] p-3.5 text-ink md:p-4", className)} style={{ background: color }}>
      <p className="display relative z-10 text-[19px] leading-[1.02] tracking-[-0.035em] md:text-[22px]">
        <span className="block">{title}</span>
        {soft && <span className="block opacity-45">{soft}</span>}
      </p>
      {shape && <Shape kind={shape} color={color} className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full" />}
      {children}
      {footer && <p className="relative z-10 mt-auto text-[12px] font-medium opacity-70">{footer}</p>}
    </div>
  );
}
