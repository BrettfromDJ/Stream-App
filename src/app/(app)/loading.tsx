import { RowSkeleton } from "@/components/media/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="gutter pt-[calc(var(--nav-h)+1.25rem)] lg:pt-[calc(var(--nav-h)+1.75rem)]">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-3 h-8 w-56 rounded-lg" />
      </div>
      <div className="mt-8 flex flex-col gap-9">
        <RowSkeleton size="wide" count={3} />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}
