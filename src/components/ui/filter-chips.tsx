"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "md" | "sm";
  label: string;
}

/** Horizontally scrolling chips with a sliding glass highlight. */
export function FilterChips<T extends string>({ options, value, onChange, className, size = "md", label }: FilterChipsProps<T>) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("no-scrollbar flex gap-1.5 overflow-x-auto", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative shrink-0 rounded-full font-medium whitespace-nowrap transition-colors duration-200",
              size === "md" ? "h-9 px-4 text-[14px]" : "h-8 px-3.5 text-[13px]",
              active ? "text-black" : "text-fg-2 hover:text-fg bg-white/[0.06]",
            )}
          >
            {active && (
              <motion.span
                layoutId={`chip-${id}`}
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
