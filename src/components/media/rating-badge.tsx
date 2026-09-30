import { Star } from "lucide-react";
import { formatRating } from "@/lib/media/format";
import { cn } from "@/lib/utils";

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn(
        "chip-solid inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-semibold tabular-nums text-fg",
        className,
      )}
      aria-label={`Rated ${formatRating(rating)} out of 5`}
    >
      <Star aria-hidden className="size-3 fill-star text-star" />
      {formatRating(rating)}
    </span>
  );
}
