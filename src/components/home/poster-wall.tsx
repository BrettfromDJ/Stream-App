import Image from "next/image";
import type { MediaSearchResult } from "@/lib/media/types";

/**
 * Slowly drifting rows of real artwork behind the Home header.
 * Pure CSS transform animation (compositor-only), small images, paused for reduced motion.
 */
export function PosterWall({ rows }: { rows: MediaSearchResult[][] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -inset-x-24 -top-8 flex -rotate-[8deg] flex-col gap-2.5 opacity-[0.75] md:-top-16 md:opacity-[0.6] md:gap-3.5">
        {rows.map((row, r) => (
          <div
            key={r}
            className="flex w-max animate-marquee gap-2.5 motion-reduce:animate-none md:gap-3.5"
            style={{ animationDuration: `${140 + r * 35}s`, animationDirection: r % 2 ? "reverse" : "normal" }}
          >
            {[...row, ...row].map((item, i) => (
              <div
                key={`${item.type}-${item.externalId}-${i}`}
                className="relative aspect-[2/3] w-[92px] shrink-0 overflow-hidden rounded-[10px] bg-elevated-2 md:w-[124px]"
              >
                {item.artworkUrl && (
                  <Image src={item.artworkUrl} alt="" fill sizes="124px" className="object-cover" loading={r === 0 && i < 8 ? "eager" : "lazy"} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Darken toward the text and fade into the page. */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/10 via-bg/60 to-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_60%,rgb(9_9_9/0.85),transparent_70%)]" />
    </div>
  );
}
