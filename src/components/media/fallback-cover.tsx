import { BookOpen, Film, Gamepad2, Tv } from "lucide-react";
import type { MediaType } from "@/lib/media/types";
import { cn } from "@/lib/utils";

const ICONS = { movie: Film, tv: Tv, book: BookOpen, game: Gamepad2 } satisfies Record<MediaType, unknown>;

function hue(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** Typographic cover used when artwork is missing or fails to load. */
export function FallbackCover({ title, type, className, compact }: { title: string; type: MediaType; className?: string; compact?: boolean }) {
  const h = hue(title);
  const Icon = ICONS[type];
  return (
    <div
      className={cn("absolute inset-0 flex flex-col justify-between overflow-hidden p-[9%]", className)}
      style={{
        background: `radial-gradient(120% 90% at 0% 0%, hsl(${h} 32% 22%) 0%, transparent 60%), linear-gradient(160deg, hsl(${h} 20% 13%), hsl(${(h + 40) % 360} 18% 7%))`,
      }}
    >
      {!compact ? (
        <p className="line-clamp-4 text-[clamp(13px,9cqw,22px)] leading-[1.12] font-semibold tracking-[-0.02em] text-balance text-white/85">
          {title}
        </p>
      ) : (
        <span />
      )}
      <Icon aria-hidden className="size-4 self-end text-white/30" strokeWidth={1.75} />
      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06] ring-inset" />
    </div>
  );
}
