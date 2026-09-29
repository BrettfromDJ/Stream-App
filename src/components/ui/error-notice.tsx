import { CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorNotice({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("gutter", className)}>
      <div role="alert" className="flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-[14px] text-fg-2">
        <CloudOff aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
}
