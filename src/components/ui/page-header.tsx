import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** iOS-style large title header. */
export function PageHeader({
  title,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("gutter flex items-end justify-between gap-4 pt-[calc(var(--nav-h)+1.25rem)] lg:pt-[calc(var(--nav-h)+1.75rem)]", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-[13px] font-semibold tracking-wide text-fg-3 uppercase">{eyebrow}</p> : null}
        <h1 className="truncate text-[32px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[38px]">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div> : null}
    </header>
  );
}
