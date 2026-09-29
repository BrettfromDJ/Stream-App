"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

interface ReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial: string;
  onSave: (value: string) => void;
}

export function ReviewSheet({ open, onOpenChange, title, initial, onSave }: ReviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="My Review" description={title}>
      {/* Remount on open so the draft starts from the saved review. */}
      <ReviewForm key={open ? "open" : "closed"} initial={initial} onSave={onSave} onCancel={() => onOpenChange(false)} />
    </Sheet>
  );
}

function ReviewForm({ initial, onSave, onCancel }: { initial: string; onSave: (value: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  return (
      <form
        className="px-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value);
        }}
      >
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20000}
          rows={7}
          placeholder="What did you think?"
          className="block min-h-[180px] w-full resize-none rounded-2xl bg-white/[0.05] p-4 text-[16px] leading-relaxed outline-none placeholder:text-fg-3 focus:bg-white/[0.07]"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[12px] text-fg-3 tabular-nums">{value.trim() ? `${value.trim().split(/\s+/).length} words` : ""}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={value.trim() === initial.trim()}>
              Save
            </Button>
          </div>
        </div>
      </form>
  );
}
