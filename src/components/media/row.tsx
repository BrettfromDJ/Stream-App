import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollRow } from "./scroll-row";

interface RowProps {
  title: string;
  /** Small line under the title, e.g. why this row is here. */
  subtitle?: string;
  href?: string;
  children: ReactNode;
  /** "poster" (default), "wide" for continue/countdown cards, "ranked" for Top 10 rows. */
  size?: "poster" | "wide" | "ranked";
  className?: string;
}

/** Section title + horizontally scrolling, snap-aligned carousel that bleeds to the screen edge. */
export function Row({ title, subtitle, href, children, size = "poster", className }: RowProps) {
  return (
    <section className={cn("relative", className)} aria-label={title}>
      <div className="gutter mb-3 flex items-center justify-between">
        {href ? (
          <Link href={href} className="group/title -my-1 inline-flex items-center gap-0.5 py-1">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
            <ChevronRight aria-hidden className="size-5 text-fg-3 transition-transform group-hover/title:translate-x-0.5" strokeWidth={2.5} />
          </Link>
        ) : (
          <h2 className="text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">{title}</h2>
        )}
      </div>
      {subtitle && <p className="gutter -mt-2 mb-3 text-[13.5px] text-fg-2">{subtitle}</p>}
      <ScrollRow size={size}>{children}</ScrollRow>
    </section>
  );
}

export { ROW_ITEM, ROW_SIZES } from "./row-sizes";
