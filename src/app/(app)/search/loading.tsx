import { RowSkeleton } from "@/components/media/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="gutter pt-[calc(var(--nav-h)+1.25rem)] lg:pt-[calc(var(--nav-h)+1.75rem)]">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="mt-4 h-12 w-full rounded-2xl md:max-w-xl" />
      </div>
      <div className="mt-8 flex flex-col gap-9">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}
