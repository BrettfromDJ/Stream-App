import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="skeleton h-[min(62vh,560px)] w-full opacity-60 md:h-[min(70vh,640px)]" />
      <div className="gutter relative -mt-[34vh] md:-mt-[30vh] lg:-mt-[300px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
          <Skeleton className="aspect-[2/3] w-[34vw] max-w-[150px] rounded-[16px] md:w-[220px] md:max-w-none lg:w-[248px]" />
          <div className="flex flex-col gap-3 md:pb-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-9 w-72 max-w-[80vw] rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-full" />
          </div>
        </div>
      </div>
      <div className="gutter mt-10 flex flex-col gap-3">
        <Skeleton className="h-[52px] w-[148px] rounded-full" />
        <Skeleton className="mt-6 h-4 w-full max-w-2xl rounded-full" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-full" />
        <Skeleton className="h-4 w-2/3 max-w-xl rounded-full" />
      </div>
    </div>
  );
}
