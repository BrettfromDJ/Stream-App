"use client";

import Link from "next/link";
import { Dices, Info, Layers, LoaderCircle, Plus, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cardFromResult } from "@/lib/media/card";
import { TYPE_LABEL, mediaHref } from "@/lib/media/labels";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { useQuickActions } from "@/components/library/quick-actions";
import { Artwork } from "@/components/media/artwork";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";

/** "Surprise Me" + "Swipe to Discover" entry points for a tab. */
export function DiscoverActions({ types, label }: { types: MediaType[]; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="gutter grid grid-cols-2 gap-2 md:flex">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-[18px] bg-white/[0.05] p-3.5 text-left transition-colors hover:bg-white/[0.08] active:scale-[0.98] md:min-w-[260px]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-400/30 to-fuchsia-500/20">
          <Dices className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">Surprise Me</span>
          <span className="block truncate text-[12.5px] text-fg-2">One great pick, right now</span>
        </span>
      </button>
      <Link
        href={`/discover/swipe?types=${types.join(",")}`}
        className="flex items-center gap-3 rounded-[18px] bg-white/[0.05] p-3.5 transition-colors hover:bg-white/[0.08] active:scale-[0.98] md:min-w-[260px]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400/30 to-emerald-500/20">
          <Layers className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">Swipe to Discover</span>
          <span className="block truncate text-[12.5px] text-fg-2">Sort {label} fast</span>
        </span>
      </Link>
      {open && <SurpriseSheet types={types} onClose={() => setOpen(false)} />}
    </div>
  );
}

function SurpriseSheet({ types, onClose }: { types: MediaType[]; onClose: () => void }) {
  const quick = useQuickActions();
  const [queue, setQueue] = useState<MediaSearchResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const typeKey = types.join(",");

  const fetchPicks = () =>
    fetch(`/api/picks?types=${typeKey}&count=12`)
      .then((res) => res.json() as Promise<{ items: MediaSearchResult[] }>)
      .then((data) => setQueue((q) => [...(q ?? []), ...data.items]))
      .catch(() => setQueue((q) => q ?? []))
      .finally(() => setLoading(false));

  const load = () => {
    setLoading(true);
    void fetchPicks();
  };

  useEffect(() => {
    void fetchPicks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once per open
  }, [typeKey]);

  const current = queue?.[0] ?? null;
  const next = () => {
    setQueue((q) => (q ? q.slice(1) : q));
    if ((queue?.length ?? 0) <= 3 && !loading) void load();
  };
  const card = current ? cardFromResult(current) : null;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title="Surprise Me" hideTitle>
      <div className="px-2 pb-1">
        <div className="relative min-h-[420px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {current && card ? (
              <motion.div
                key={`${current.type}-${current.externalId}`}
                initial={{ opacity: 0, x: 40, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -40, rotate: -2 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mt-2 aspect-[2/3] w-[46%] max-w-[200px] overflow-hidden rounded-[16px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                  <Artwork src={current.artworkUrl} title={current.title} type={current.type} sizes="200px" priority />
                </div>
                <p className="mt-4 text-[12px] font-bold tracking-[0.1em] text-fg-3 uppercase">Tonight&apos;s pick</p>
                <h3 className="mt-1 text-[24px] leading-tight font-bold tracking-[-0.025em] text-balance">{current.title}</h3>
                <p className="mt-1 text-[14px] text-fg-2">
                  {[TYPE_LABEL[current.type], current.year, current.subtitle].filter(Boolean).join(" · ")}
                </p>
                {current.description && <p className="mt-3 line-clamp-4 max-w-md text-[14.5px] leading-relaxed text-fg/80">{current.description}</p>}
              </motion.div>
            ) : (
              <div className="grid h-[420px] place-items-center">
                {loading ? (
                  <LoaderCircle className="size-6 animate-spin text-fg-3" />
                ) : (
                  <p className="text-[15px] text-fg-2">Nothing new to suggest right now.</p>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
        {card && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <button type="button" onClick={next} className={buttonClasses("soft", "md", "w-full")}>
              <RefreshCw /> Another
            </button>
            <Link href={mediaHref(card.type, card.externalId)} onClick={onClose} className={buttonClasses("soft", "md", "w-full")}>
              <Info /> Details
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                quick?.open(card);
              }}
              className={buttonClasses("primary", "md", "w-full")}
            >
              <Plus strokeWidth={2.5} /> Add
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
