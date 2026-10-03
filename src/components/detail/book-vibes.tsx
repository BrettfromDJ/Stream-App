"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import { useState } from "react";

/** Reader-tagged moods as chips; content warnings tucked behind a tap so they never spoil anything by surprise. */
export function BookVibes({ moods, warnings }: { moods: string[]; warnings: string[] }) {
  const [open, setOpen] = useState(false);
  if (!moods.length && !warnings.length) return null;
  return (
    <section aria-labelledby="vibes">
      <h2 id="vibes" className="mb-3 display text-[24px] md:text-[26px]">
        The Vibe
      </h2>
      {moods.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <li key={m} className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[14px] font-medium capitalize">
              {m}
            </li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-fg-2 hover:text-fg"
          >
            <TriangleAlert className="size-4" />
            {open ? "Hide" : "Show"} content warnings ({warnings.length})
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && <p className="mt-2 text-[14px] leading-relaxed text-fg-2 capitalize">{warnings.join(" · ")}</p>}
        </div>
      )}
    </section>
  );
}
