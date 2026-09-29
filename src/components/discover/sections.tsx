import { Suspense, type ReactNode } from "react";
import { RowSkeleton } from "@/components/media/skeletons";

/** Stack of discovery rows, each streaming in independently behind a skeleton. */
export function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-9 md:gap-11">{children}</div>;
}

export function Lazy({ children, size = "poster" }: { children: ReactNode; size?: "poster" | "wide" }) {
  return <Suspense fallback={<RowSkeleton size={size} count={size === "wide" ? 3 : 8} />}>{children}</Suspense>;
}
