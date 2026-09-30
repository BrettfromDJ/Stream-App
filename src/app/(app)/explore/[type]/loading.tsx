import { GridSkeleton } from "@/components/media/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="gutter pt-[calc(var(--nav-h)+0.75rem)]">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="mt-6 h-3 w-20 rounded-full" />
        <Skeleton className="mt-3 h-9 w-64 rounded-lg" />
        <div className="mt-6 flex gap-1.5">
          {[88, 104, 90, 96].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="mt-6">
        <GridSkeleton />
      </div>
    </div>
  );
}
