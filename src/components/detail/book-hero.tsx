import Image from "next/image";
import type { MediaSearchResult } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";

/**
 * Books have no wide backdrop, so the header is built from covers instead:
 * a saturated wash of this cover's colors, with the series/author's covers drifting behind it.
 */
export function BookBackdrop({ cover, shelf }: { cover: string | null | undefined; shelf: MediaSearchResult[] }) {
  const covers = shelf.filter((b) => b.artworkUrl).slice(0, 16);
  const rows = covers.length >= 6 ? [covers.filter((_, i) => i % 2 === 0), covers.filter((_, i) => i % 2 === 1)] : [];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {cover && (
        <Image src={cover} alt="" fill priority sizes="200px" className="scale-150 object-cover opacity-90 blur-3xl saturate-[1.8]" />
      )}
      {rows.length > 0 && (
        <div className="absolute -inset-x-24 top-[4%] flex -rotate-[8deg] flex-col gap-3 opacity-[0.28] md:top-[-4%] md:gap-4">
          {rows.map((row, r) => (
            <div
              key={r}
              className="flex w-max animate-marquee gap-3 motion-reduce:animate-none md:gap-4"
              style={{ animationDuration: `${160 + r * 40}s`, animationDirection: r % 2 ? "reverse" : "normal" }}
            >
              {[...row, ...row, ...row].map((b, i) => (
                <div key={`${b.externalId}-${i}`} className="relative aspect-[2/3] w-[96px] shrink-0 overflow-hidden rounded-[6px] md:w-[128px]">
                  <Image src={b.artworkUrl!} alt="" fill sizes="128px" className="object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* Soft spotlight behind the book, fading into the page. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_58%,transparent,rgb(9_9_9/0.55))] md:bg-[radial-gradient(45%_60%_at_22%_70%,transparent,rgb(9_9_9/0.6))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg" />
    </div>
  );
}

/** The cover drawn as a physical book: spine crease, page edges, and a glow in its own colors. */
export function BookCover({ src, title, sizes, className }: { src: string | null | undefined; title: string; sizes: string; className?: string }) {
  return (
    <div className={cn("relative aspect-[2/3] shrink-0", className)}>
      {src && (
        <div aria-hidden className="absolute inset-[6%] translate-y-[8%] scale-110 opacity-80 blur-2xl saturate-150">
          <Image src={src} alt="" fill sizes="120px" className="object-cover" />
        </div>
      )}
      {/* Page edges peeking out on the right. */}
      <div
        aria-hidden
        className="absolute top-[1.5%] -right-[3.5%] bottom-[1.5%] w-[5%] rounded-r-[3px] bg-[repeating-linear-gradient(to_right,#efe9dc_0_1px,#cfc7b6_1px_2px)] shadow-[inset_-2px_0_3px_rgba(0,0,0,0.25)]"
      />
      <div className="relative size-full overflow-hidden rounded-[3px_10px_10px_3px] shadow-[0_30px_60px_-18px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)]">
        <Artwork src={src} title={title} type="book" sizes={sizes} priority />
        {/* Spine crease and a soft sheen. */}
        <div aria-hidden className="absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/45 via-white/20 to-transparent" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
      </div>
    </div>
  );
}
