import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function HomeEmpty() {
  return (
    <section className="gutter">
      <div className="relative overflow-hidden rounded-[24px] bg-elevated px-6 py-10 md:px-10 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/[0.04] blur-3xl"
        />
        <p className="text-[13px] font-semibold tracking-[0.08em] text-fg-3 uppercase">Your library is empty</p>
        <h2 className="mt-2 max-w-md text-[26px] leading-[1.15] font-bold tracking-[-0.025em] text-balance md:text-[30px]">
          Nothing here yet. Find something worth watching, reading or playing.
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/search" className={buttonClasses("primary", "md")}>
            Search
          </Link>
          <Link href="/search?type=movie" className={buttonClasses("soft", "md")}>
            Browse Movies
          </Link>
          <Link href="/search?type=book" className={buttonClasses("soft", "md")}>
            Browse Books
          </Link>
        </div>
      </div>
    </section>
  );
}
