"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveServices } from "@/lib/user/actions";
import type { WatchProvider } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ServicesPicker({ providers, initial }: { providers: WatchProvider[]; initial: number[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(initial));
  const [pending, startTransition] = useTransition();
  const dirty = selected.size !== initial.length || initial.some((id) => !selected.has(id));

  const toggle = (id: number) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
        {providers.map((p) => {
          const on = selected.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all active:scale-95",
                on ? "bg-white/[0.1] ring-2 ring-fg" : "bg-white/[0.04] hover:bg-white/[0.07]",
              )}
            >
              <span className="relative size-14 overflow-hidden rounded-[14px] bg-elevated-2 ring-1 ring-white/10">
                {p.logoUrl ? <Image src={p.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
              </span>
              <span className="line-clamp-2 text-[12px] leading-tight font-medium text-fg/90">{p.name}</span>
              {on && (
                <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-fg text-black">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] mt-6 flex items-center justify-between gap-3 rounded-2xl bg-bg/80 py-2 backdrop-blur-xl lg:bottom-4">
        <p className="text-[14px] text-fg-2">{selected.size ? `${selected.size} selected` : "None selected"}</p>
        <Button
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              const res = await saveServices([...selected]);
              if (res.ok) {
                toast("Streaming services saved");
                router.refresh();
              } else toast("Couldn't save", { description: res.message });
            })
          }
        >
          {pending && <LoaderCircle className="animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}
