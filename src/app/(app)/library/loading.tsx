import { GridSkeleton } from "@/components/media/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="gutter pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-3 lg:pt-10">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="mt-2 h-3 w-16 rounded-full" />
        <div className="mt-4 flex gap-1.5">
          {[48, 72, 44, 60, 60].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <GridSkeleton />
      </div>
    </div>
  );
}
