"use client";

import { Check, Minus, PenLine, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { setProgress, type ProgressUpdate } from "@/lib/library/actions";
import { snapshotOf, type CardData } from "@/lib/media/card";
import { daysToFinish, formatHours } from "@/lib/media/progress";
import type { MediaProgress } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { haptic, reportError } from "@/components/library/use-library-mutations";
import { cn } from "@/lib/utils";

export type Target = { label: string; hours: number };

interface Props {
  media: CardData;
  progress: MediaProgress | null;
  /** Books: page count from the provider (the reader can override it). */
  totalPages?: number | null;
  /** Games: time-to-beat options; the first is the default target. */
  targets?: Target[];
}

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDay = (iso: string) => SHORT.format(new Date(`${iso}T00:00:00Z`));

function toProgress(u: ProgressUpdate, prev: MediaProgress | null): MediaProgress {
  const log = prev && prev.kind !== "episode" ? prev.log : undefined;
  if (u.kind === "page") return { kind: "page", page: u.page, totalPages: u.totalPages ?? undefined, log };
  if (u.kind === "percent") return { kind: "percent", percent: u.percent, log };
  return { kind: "hours", hours: u.hours, targetHours: u.targetHours ?? undefined, log };
}

/** Pages read (books) or hours played (games), with quick +/- steps and a pace estimate. */
export function ProgressTracker({ media, progress: saved, totalPages: providerPages, targets = [] }: Props) {
  const isBook = media.type === "book";
  const [progress, applyOptimistic] = useOptimistic(saved, (prev, u: ProgressUpdate) => toProgress(u, prev));
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<"page" | "percent">(saved?.kind === "percent" ? "percent" : "page");
  const [editing, setEditing] = useState(false);
  // Fresh editor state each time it opens.
  const [editKey, setEditKey] = useState(0);
  const openEditor = () => {
    setEditKey((k) => k + 1);
    setEditing(true);
  };

  const totalPages = (progress?.kind === "page" ? progress.totalPages : null) ?? providerPages ?? null;
  const targetHours = progress?.kind === "hours" ? progress.targetHours ?? null : targets[0]?.hours ?? null;

  // Current value in the active unit.
  const current = isBook
    ? mode === "page"
      ? progress?.kind === "page"
        ? progress.page
        : progress?.kind === "percent" && totalPages
          ? Math.round((progress.percent / 100) * totalPages)
          : 0
      : progress?.kind === "percent"
        ? progress.percent
        : progress?.kind === "page" && progress.totalPages
          ? Math.round((progress.page / progress.totalPages) * 100)
          : 0
    : progress?.kind === "hours"
      ? progress.hours
      : 0;

  const percent =
    isBook && mode === "percent"
      ? current
      : isBook
        ? totalPages
          ? (current / totalPages) * 100
          : null
        : targetHours
          ? Math.min(100, (current / targetHours) * 100)
          : null;
  const eta = daysToFinish(progress);
  const lastLog = progress && progress.kind !== "episode" ? progress.log?.at(-1)?.[0] : undefined;

  const save = (u: ProgressUpdate, opts?: { undo?: ProgressUpdate; label?: string }) => {
    haptic();
    startTransition(async () => {
      applyOptimistic(u);
      const res = await setProgress(snapshotOf(media), u, localDay());
      if (!reportError(res, "Couldn't save progress") || !res.ok) return;
      if (res.data.finished) {
        toast(isBook ? "Finished — marked as read" : "Nice — marked as played", { description: media.title });
      } else if (opts?.label) {
        const undo = opts.undo;
        toast(opts.label, undo ? { action: { label: "Undo", onClick: () => save(undo) } } : undefined);
      }
    });
  };

  const updateFor = (value: number): ProgressUpdate =>
    isBook
      ? mode === "page"
        ? { kind: "page", page: Math.max(0, totalPages ? Math.min(value, totalPages) : value), totalPages }
        : { kind: "percent", percent: Math.max(0, Math.min(100, value)) }
      : { kind: "hours", hours: Math.max(0, value), targetHours };

  const step = (delta: number) => {
    const next = updateFor(Math.round((current + delta) * 10) / 10);
    save(next, { undo: updateFor(current), label: describe(next) });
  };

  const steps = isBook ? (mode === "page" ? [10, 25, 50] : [5, 10, 25]) : [0.5, 1, 2];
  const unit = isBook ? (mode === "page" ? "pages" : "%") : "h";
  const started = current > 0;
  const done = percent != null && percent >= 100;

  return (
    <section aria-labelledby="progress">
      <div className="flex items-center justify-between gap-3">
        <h2 id="progress" className="text-[18px] font-bold tracking-[-0.02em] whitespace-nowrap">
          {isBook ? "Reading Progress" : "Play Time"}
        </h2>
        {isBook && (
          <div role="group" aria-label="Track by" className="flex rounded-full bg-white/[0.07] p-0.5 text-[12.5px] font-semibold">
            {(["page", "percent"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn("h-7 rounded-full px-2.5 transition-colors", mode === m ? "bg-fg text-black" : "text-fg-2 hover:text-fg")}
              >
                {m === "page" ? "Pages" : "Percent"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-white/[0.04] p-4">
        <div className="flex items-end justify-between gap-3">
          <button type="button" onClick={openEditor} className="group min-w-0 text-left" aria-label="Edit progress">
            <p className="flex items-baseline gap-1.5">
              <span className="text-[34px] leading-none font-bold tracking-[-0.04em] tabular-nums">
                {isBook ? (mode === "page" ? current : `${Math.round(current)}%`) : formatHours(current)}
              </span>
              <span className="text-[14px] font-semibold text-fg-2">
                {isBook ? (mode === "page" ? (totalPages ? `of ${totalPages} pages` : "pages") : "read") : targetHours ? `of ~${formatHours(targetHours)} h` : "hours played"}
              </span>
              <PenLine aria-hidden className="size-3.5 self-center text-fg-3 transition-colors group-hover:text-fg-2" />
            </p>
          </button>
          {isBook && !done && (totalPages || mode === "percent") ? (
            <button
              type="button"
              onClick={() => save(mode === "page" ? { kind: "page", page: totalPages!, totalPages } : { kind: "percent", percent: 100 })}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fg px-3.5 text-[13.5px] font-semibold text-black transition-transform active:scale-95"
            >
              <Check className="size-4" strokeWidth={2.75} /> Finished
            </button>
          ) : null}
        </div>

        {percent != null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={cn("h-full rounded-full", done ? "bg-success" : "bg-fg")}
              initial={false}
              animate={{ width: `${Math.min(100, percent)}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.6 }}
            />
          </div>
        )}

        <p className="mt-2.5 text-[13px] text-fg-2">
          {percent != null && isBook && mode === "page" && !done && started ? <span className="font-semibold text-fg tabular-nums">{Math.round(percent)}% · </span> : null}
          {done
            ? isBook
              ? "Finished"
              : "Past the main story estimate"
            : eta
              ? `About ${eta} day${eta === 1 ? "" : "s"} to go at your pace`
              : !isBook && targetHours && started
                ? `${Math.round(percent ?? 0)}% of ${targets.find((t) => t.hours === targetHours)?.label ?? "the estimate"}`
                : started && lastLog
                  ? `Updated ${shortDay(lastLog)}`
                  : isBook
                    ? "Log where you're up to — it moves this to Reading."
                    : "Log your hours — it moves this to Playing."}
          {started && lastLog && eta ? <span className="text-fg-3"> · Updated {shortDay(lastLog)}</span> : null}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label={`Minus ${steps[0]} ${unit}`}
            disabled={!started}
            onClick={() => step(-steps[0])}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.07] text-fg transition-transform active:scale-90 disabled:opacity-40"
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
          {steps.map((n) => (
            <button
              key={n}
              type="button"
              disabled={done && isBook}
              onClick={() => step(n)}
              className="flex h-10 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[14px] font-semibold tabular-nums transition-transform active:scale-95 disabled:opacity-40"
            >
              <Plus className="size-3.5" strokeWidth={2.75} />
              {isBook ? `${n}${mode === "percent" ? "%" : ""}` : n < 1 ? "30m" : `${n}h`}
            </button>
          ))}
        </div>
      </div>

      <ProgressSheet
        key={editKey}
        open={editing}
        onOpenChange={setEditing}
        title={media.title}
        isBook={isBook}
        mode={mode}
        current={current}
        totalPages={totalPages}
        targetHours={targetHours}
        targets={targets}
        onSave={(u) => {
          setEditing(false);
          save(u);
        }}
      />
    </section>
  );
}

function describe(u: ProgressUpdate) {
  if (u.kind === "page") return u.totalPages ? `Page ${u.page} of ${u.totalPages}` : `Page ${u.page}`;
  if (u.kind === "percent") return `${u.percent}% read`;
  return `${formatHours(u.hours)} h played`;
}

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isBook: boolean;
  mode: "page" | "percent";
  current: number;
  totalPages: number | null;
  targetHours: number | null;
  targets: Target[];
  onSave: (u: ProgressUpdate) => void;
}

function ProgressSheet({ open, onOpenChange, title, isBook, mode, current, totalPages, targetHours, targets, onSave }: SheetProps) {
  const [value, setValue] = useState(current ? String(current) : "");
  const [total, setTotal] = useState(totalPages ? String(totalPages) : "");
  const [target, setTarget] = useState<number | null>(targetHours);

  const num = Number(value.replace(",", "."));
  const totalNum = total ? Math.round(Number(total)) : null;
  const valid =
    value.trim() !== "" &&
    Number.isFinite(num) &&
    num >= 0 &&
    (isBook && mode === "percent" ? num <= 100 : true) &&
    (totalNum == null || (Number.isFinite(totalNum) && totalNum > 0));

  const submit = () => {
    if (!valid) return;
    if (!isBook) onSave({ kind: "hours", hours: num, targetHours: target });
    else if (mode === "percent") onSave({ kind: "percent", percent: Math.round(num) });
    else onSave({ kind: "page", page: Math.round(totalNum ? Math.min(num, totalNum) : num), totalPages: totalNum });
  };

  const field = "h-14 w-full rounded-2xl bg-white/[0.07] px-4 text-[22px] font-bold tabular-nums outline-none placeholder:text-fg-3 focus:ring-2 focus:ring-white/30";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={isBook ? "Where are you up to?" : "How long have you played?"} description={title}>
      <form
        className="flex flex-col gap-5 px-2 pt-2 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">
            {isBook ? (mode === "page" ? "Current page" : "Percent read") : "Hours played"}
          </span>
          <input
            autoFocus
            inputMode={isBook ? "numeric" : "decimal"}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            className={cn(field, "mt-2")}
          />
        </label>

        {isBook && mode === "page" && (
          <label className="block">
            <span className="text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">Total pages</span>
            <input
              inputMode="numeric"
              value={total}
              onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
              placeholder="Unknown"
              className={cn(field, "mt-2 h-12 text-[17px]")}
            />
            <span className="mt-1.5 block text-[12.5px] text-fg-3">Your edition might have a different page count.</span>
          </label>
        )}

        {!isBook && targets.length > 0 && (
          <div>
            <span className="text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">Measure against</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...targets, { label: "Nothing", hours: 0 }].map((t) => {
                const active = (target ?? 0) === t.hours;
                return (
                  <button
                    key={t.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTarget(t.hours || null)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors",
                      active ? "bg-fg text-black" : "bg-white/[0.07] text-fg-2 hover:text-fg",
                    )}
                  >
                    {t.hours ? `${t.label} · ${formatHours(t.hours)} h` : "No target"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" size="lg" disabled={!valid} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  );
}
