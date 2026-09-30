"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, Heart, Info, LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { cardFromResult } from "@/lib/media/card";
import { TYPE_LABEL, mediaHref } from "@/lib/media/labels";
import type { MediaSearchResult, MediaType } from "@/lib/media/types";
import { applyStatus, haptic } from "@/components/library/use-library-mutations";
import { BackButton } from "@/components/detail/back-button";
import { Artwork } from "@/components/media/artwork";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "shelf:dismissed";
const TABS: { label: string; types: MediaType[] }[] = [
  { label: "Movies & TV", types: ["movie", "tv"] },
  { label: "Books", types: ["book"] },
  { label: "Games", types: ["game"] },
];

function readDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function dismiss(key: string) {
  try {
    const list = [...readDismissed(), key].slice(-800);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable (private mode) — fine */
  }
}

type Decision = "want" | "skip" | "seen";

export function SwipeDeck({ types }: { types: MediaType[] }) {
  const router = useRouter();
  const [deck, setDeck] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitDir, setExitDir] = useState(1);
  const [added, setAdded] = useState(0);
  const typeKey = types.join(",");

  const fetchMore = useCallback(
    () =>
      fetch(`/api/picks?types=${typeKey}&count=30`)
        .then((r) => r.json() as Promise<{ items: MediaSearchResult[] }>)
        .then(({ items }) => {
          const dismissed = readDismissed();
          setDeck((d) => {
            const have = new Set(d.map((x) => `${x.type}:${x.externalId}`));
            return [...d, ...items.filter((i) => !dismissed.has(`${i.type}:${i.externalId}`) && !have.has(`${i.type}:${i.externalId}`))];
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    [typeKey],
  );

  useEffect(() => {
    void fetchMore();
  }, [fetchMore]);

  const decide = useCallback(
    (decision: Decision) => {
      const top = deck[0];
      if (!top) return;
      haptic();
      setExitDir(decision === "skip" ? -1 : 1);
      setDeck((d) => d.slice(1));
      const key = `${top.type}:${top.externalId}`;
      dismiss(key);
      if (decision !== "skip") {
        setAdded((n) => n + 1);
        void applyStatus(cardFromResult(top), decision === "want" ? "backlog" : "completed");
      }
      if (deck.length <= 6 && !loading) {
        setLoading(true);
        void fetchMore();
      }
    },
    [deck, loading, fetchMore],
  );

  // Arrow keys on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide("want");
      else if (e.key === "ArrowLeft") decide("skip");
      else if (e.key === "ArrowUp") decide("seen");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const top = deck[0];
  const verb = types.includes("book") ? "read" : types.includes("game") ? "played" : "seen";

  return (
    <div className="gutter flex min-h-[calc(100dvh-7rem)] flex-col pt-[calc(var(--nav-h)+0.75rem)] lg:min-h-dvh">
      <div className="flex items-center justify-between gap-3">
        <BackButton />
        {added > 0 && <p className="text-[13px] font-semibold text-success">{added} added</p>}
      </div>
      <h1 className="mt-3 text-[26px] leading-tight font-bold tracking-[-0.025em] md:text-center md:text-[34px]">Swipe to Discover</h1>
      <p className="mt-1 text-[14px] text-fg-2 md:text-center">Right to save it, left to pass.</p>
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto md:justify-center">
        {TABS.map((t) => {
          const active = t.types.join(",") === typeKey;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => !active && router.replace(`/discover/swipe?types=${t.types.join(",")}`)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-[13.5px] font-semibold transition-colors",
                active ? "bg-fg text-black" : "bg-white/[0.07] text-fg-2 hover:text-fg",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="relative mx-auto mt-5 aspect-[2/3] w-[min(82vw,360px,calc((100dvh-29rem)*0.667))] min-w-[200px] flex-none lg:w-[min(360px,calc((100dvh-21rem)*0.667))]">
        {deck.slice(1, 3).reverse().map((item, i, arr) => {
          const depth = arr.length - i; // 2 = furthest back
          return (
            <div
              key={`${item.type}-${item.externalId}`}
              className="absolute inset-0 overflow-hidden rounded-[24px] bg-elevated-2 ring-1 ring-white/10"
              style={{ transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`, opacity: 1 - depth * 0.25 }}
            >
              <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="360px" compactFallback />
            </div>
          );
        })}
        <AnimatePresence custom={exitDir} initial={false}>
          {top && <TopCard key={`${top.type}-${top.externalId}`} item={top} exitDir={exitDir} onDecide={decide} />}
        </AnimatePresence>
        {!top && (
          <div className="absolute inset-0 grid place-items-center rounded-[24px] bg-white/[0.03] text-center">
            {loading ? <LoaderCircle className="size-6 animate-spin text-fg-3" /> : <p className="px-8 text-[15px] text-fg-2">You&apos;ve seen everything for now. Check back later.</p>}
          </div>
        )}
      </div>

      <div className="mx-auto mt-5 flex items-center gap-4">
        <RoundButton label="Not for me" onClick={() => decide("skip")} className="text-danger">
          <X className="size-7" strokeWidth={2.5} />
        </RoundButton>
        <RoundButton label={`Already ${verb}`} onClick={() => decide("seen")} small>
          <Eye className="size-5" />
        </RoundButton>
        <RoundButton label="Want to" onClick={() => decide("want")} className="text-success">
          <Heart className="size-7 fill-current" />
        </RoundButton>
      </div>
      <p className="mt-3 hidden text-center text-[12px] text-fg-3 md:block">
        <span className="hidden md:inline">Use ← → ↑ keys · </span>
        {`"Already ${verb}" adds it as finished.`}
      </p>
    </div>
  );
}

function RoundButton({
  children,
  label,
  onClick,
  className,
  small,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "glass grid place-items-center rounded-full transition-transform active:scale-90",
        small ? "size-12 text-fg-2" : "size-16",
        className,
      )}
    >
      {children}
    </button>
  );
}

function TopCard({ item, exitDir, onDecide }: { item: MediaSearchResult; exitDir: number; onDecide: (d: Decision) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const want = useTransform(x, [30, 130], [0, 1]);
  const nope = useTransform(x, [-130, -30], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 700) onDecide("want");
    else if (info.offset.x < -120 || info.velocity.x < -700) onDecide("skip");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[24px] bg-elevated-2 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.95)] ring-1 ring-white/10 active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.96, y: 10, opacity: 0.6 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ x: exitDir * 520, rotate: exitDir * 22, opacity: 0, transition: { duration: 0.35 } }}
    >
      <Artwork src={item.artworkUrl} title={item.title} type={item.type} sizes="360px" priority />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <motion.span style={{ opacity: want }} className="absolute top-5 left-5 flex items-center gap-1 rounded-xl border-2 border-success px-3 py-1 text-[18px] font-black tracking-wide text-success uppercase -rotate-12">
        <Check className="size-5" strokeWidth={3} /> Want
      </motion.span>
      <motion.span style={{ opacity: nope }} className="absolute top-5 right-5 rounded-xl border-2 border-danger px-3 py-1 text-[18px] font-black tracking-wide text-danger uppercase rotate-12">
        Pass
      </motion.span>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-fg-2 uppercase">
          {[TYPE_LABEL[item.type], item.year].filter(Boolean).join(" · ")}
        </p>
        <h2 className="mt-1 text-[26px] leading-[1.05] font-bold tracking-[-0.03em] text-balance">{item.title}</h2>
        {item.subtitle && <p className="mt-1 truncate text-[14px] text-fg-2">{item.subtitle}</p>}
        <Link
          href={mediaHref(item.type, item.externalId)}
          onPointerDown={(e) => e.stopPropagation()}
          className="glass-chip mt-3 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold"
        >
          <Info className="size-3.5" /> Details
        </Link>
      </div>
    </motion.div>
  );
}
