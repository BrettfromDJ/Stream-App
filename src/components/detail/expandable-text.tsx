"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ExpandableText({ text, lines = 4, className }: { text: string; lines?: number; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 2);
  }, [text]);

  return (
    <div className={className}>
      <p
        ref={ref}
        className={cn("text-[15px] leading-relaxed whitespace-pre-line text-fg-2 md:text-[16px]", !expanded && "overflow-hidden")}
        style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" }}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-[14px] font-semibold text-fg">
          {expanded ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}
