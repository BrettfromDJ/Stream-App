import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ROW_ITEM } from "./row-sizes";
import { MediaGrid } from "./grid";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="aspect-[2/3] w-full rounded-(--radius-card)" />
      <Skeleton className="mt-2.5 h-3 w-4/5 rounded-full" />
      <Skeleton className="mt-1.5 h-2.5 w-1/3 rounded-full" />
    </div>
  );
}

export function RowSkeleton({ size = "poster", count = 8, title = true }: { size?: "poster" | "wide"; count?: number; title?: boolean }) {
  return (
    <div aria-hidden>
      {title && (
        <div className="gutter mb-3">
          <Skeleton className="h-5 w-40 rounded-full" />
        </div>
      )}
      <div className={cn("gutter flex overflow-hidden", size === "wide" ? "gap-3 md:gap-4" : "gap-2.5 md:gap-3.5")}>
        {Array.from({ length: count }, (_, i) =>
          size === "wide" ? (
            <Skeleton key={i} className={cn("aspect-[16/10] shrink-0 rounded-[18px]", ROW_ITEM.wide)} />
          ) : (
            <CardSkeleton key={i} className={cn("shrink-0", ROW_ITEM.poster)} />
          ),
        )}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <MediaGrid>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </MediaGrid>
  );
}
