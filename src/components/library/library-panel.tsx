"use client";

import { Check, ChevronDown, PenLine, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveReview, setRating } from "@/lib/library/actions";
import type { CardData } from "@/lib/media/card";
import { formatRating } from "@/lib/media/format";
import { FriendlyDate } from "@/components/ui/friendly-date";
import { canRate, statusLabel } from "@/lib/media/status";
import type { LibraryStatus } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { StarRating } from "./star-rating";
import { StatusOptions } from "./status-options";
import { applyRemove, applyStatus, haptic, reportError } from "./use-library-mutations";
import { ReviewSheet } from "./review-sheet";

interface LibraryPanelProps {
  media: CardData;
  review: string | null;
  reviewedAt: string | null;
}

/** "My Status / My Rating / My Review" block on the detail page, with optimistic updates. */
export function LibraryPanel({ media, review, reviewedAt }: LibraryPanelProps) {
  // Optimistic values fall back to the server props once each save settles (or fails).
  const [status, setOptimisticStatus] = useOptimistic<LibraryStatus | null>(media.status ?? null);
  const [rating, setOptimisticRating] = useOptimistic<number | null>(media.rating ?? null);
  const [text, setOptimisticText] = useOptimistic<string | null>(review);
  const [pending, startTransition] = useTransition();
  const [statusOpen, setStatusOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const inLibrary = Boolean(media.libraryId) && status !== null;

  const choose = (next: LibraryStatus) => {
    setStatusOpen(false);
    haptic();
    startTransition(async () => {
      setOptimisticStatus(next);
      await applyStatus(media, next);
    });
  };

  const removeItem = () => {
    setStatusOpen(false);
    haptic();
    startTransition(async () => {
      setOptimisticStatus(null);
      await applyRemove(media);
    });
  };

  const rate = (next: number | null) => {
    if (!media.libraryId) return;
    startTransition(async () => {
      setOptimisticRating(next);
      reportError(await setRating(media.libraryId!, next), "Couldn't save rating");
    });
  };

  const submitReview = (value: string) => {
    if (!media.libraryId) return;
    setReviewOpen(false);
    haptic();
    startTransition(async () => {
      setOptimisticText(value.trim() || null);
      const res = await saveReview(media.libraryId!, value);
      if (reportError(res, "Couldn't save review")) {
        toast(value.trim() ? "Review saved" : "Review removed", { description: media.title });
      }
    });
  };

  if (!media.libraryId) {
    return (
      <>
        <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
          <Button size="lg" onClick={() => !pending && setStatusOpen(true)} className="min-w-[148px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {status ? (
                <motion.span key="added" className="inline-flex items-center gap-2" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
                  <Check strokeWidth={2.5} /> Added
                </motion.span>
              ) : (
                <motion.span key="add" className="inline-flex items-center gap-2" exit={{ opacity: 0, scale: 0.6 }}>
                  <Plus strokeWidth={2.5} /> Add
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
        <Sheet open={statusOpen} onOpenChange={setStatusOpen} title="Add to…" description={media.title}>
          <StatusOptions type={media.type} onSelect={choose} />
        </Sheet>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <SectionLabel>My Status</SectionLabel>
        <button
          type="button"
          onClick={() => setStatusOpen(true)}
          className="glass mt-2 inline-flex h-11 items-center gap-2 rounded-full pr-3.5 pl-4 text-[15px] font-semibold transition-transform active:scale-95"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {inLibrary ? statusLabel(status!, media.type) : "Removed"}
            </motion.span>
          </AnimatePresence>
          <ChevronDown aria-hidden className="size-4 text-fg-2" strokeWidth={2.5} />
        </button>
      </div>

      <div>
        <SectionLabel>My Rating</SectionLabel>
        <div className="mt-2 flex items-center gap-4">
          <StarRating value={rating} onChange={rate} disabled={!canRate(status)} size={34} />
          {rating ? (
            <span className="text-[28px] font-bold tracking-[-0.03em] tabular-nums">{formatRating(rating)}</span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[13px] text-fg-3">
          {canRate(status) ? (rating ? "Tap your rating again to clear it." : "Tap or drag to rate.") : "Rate it once you've started."}
        </p>
      </div>

      <div>
        <SectionLabel>My Review</SectionLabel>
        {text ? (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="group mt-2 block w-full rounded-2xl bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.06]"
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-fg/90">{text}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-fg-3">
              {reviewedAt ? <FriendlyDate date={reviewedAt} variant="since" /> : "Just now"}
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 group-hover:text-fg-2">
                <PenLine className="size-3" /> Edit
              </span>
            </p>
          </button>
        ) : (
          <Button variant="soft" className="mt-2" onClick={() => setReviewOpen(true)}>
            <PenLine /> Write a Review
          </Button>
        )}
      </div>

      <Sheet open={statusOpen} onOpenChange={setStatusOpen} title={media.title} description="Change status">
        <StatusOptions
          type={media.type}
          current={status}
          onSelect={choose}
          onRemove={removeItem}
        />
      </Sheet>
      <ReviewSheet open={reviewOpen} onOpenChange={setReviewOpen} title={media.title} initial={text ?? ""} onSave={submitReview} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">{children}</p>;
}
