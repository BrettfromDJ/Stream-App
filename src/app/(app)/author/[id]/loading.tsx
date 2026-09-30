import { RowSkeleton } from "@/components/media/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorLoading() {
  return (
    <div aria-busy aria-label="Loading" className="gutter pt-[calc(var(--nav-h)+0.75rem)]">
      <Skeleton className="size-10 rounded-full" />
      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
        <Skeleton className="size-28 rounded-full md:size-36" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-full" />
        </div>
      </div>
      <div className="-mx-5 mt-12 md:-mx-8 xl:-mx-11">
        <RowSkeleton />
      </div>
    </div>
  );
}
