"use client";

import { CalendarPlus, Check, Copy, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { calendarLink } from "@/lib/reminders/actions";
import { Button } from "@/components/ui/button";

/**
 * Subscribes the phone's calendar to a private feed of release days and new episodes.
 * Calendar alerts arrive as normal notifications — no app install needed.
 */
export function CalendarConnect({ available }: { available: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = (reset = false) =>
    startTransition(async () => {
      const res = await calendarLink(reset);
      if (!res.ok) {
        toast("Calendar link unavailable", { description: res.message });
        return;
      }
      setToken(res.token);
      if (reset) toast("New link created", { description: "The old link stops working. Subscribe again with this one." });
    });

  const httpsUrl = token ? `${window.location.origin}/api/calendar/${token}.ics` : null;
  const webcalUrl = httpsUrl?.replace(/^https?:/, "webcal:");

  const copy = async () => {
    if (!httpsUrl) return;
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Couldn't copy", { description: httpsUrl });
    }
  };

  return (
    <section className="rounded-[22px] bg-gradient-to-br from-white/[0.09] to-white/[0.03] p-5 ring-1 ring-white/[0.08] md:p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-fg text-black">
          <CalendarPlus className="size-[22px]" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="display text-[24px] md:text-[26px]">Get reminders on your phone</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-fg-2">
            Add these to your calendar and you&apos;ll get an alert at 9am on release day and when new episodes drop. It stays up to date on its own.
          </p>
        </div>
      </div>

      {!token ? (
        <Button className="mt-5 w-full sm:w-auto" onClick={() => load()} disabled={pending || !available}>
          <CalendarPlus /> {available ? (pending ? "Getting your link…" : "Add to Calendar") : "Available once you sign in"}
        </Button>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <a href={webcalUrl!} className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-[15px] font-semibold text-black transition-transform active:scale-95">
              <CalendarPlus className="size-[18px]" /> Subscribe
            </a>
            <Button variant="soft" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-fg-2 marker:text-fg-3">
            <li>
              <span className="text-fg">iPhone:</span> tap Subscribe, then Subscribe again. Turn <span className="text-fg">off</span> “Remove Alerts” so you get notified.
            </li>
            <li>
              <span className="text-fg">Google Calendar:</span> copy the link, then on a computer go to Other calendars → + → From URL.
            </li>
            <li>Keep this link private — anyone with it can see what&apos;s coming up on your shelf.</li>
          </ul>
          <button type="button" onClick={() => load(true)} disabled={pending} className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-fg-3 hover:text-fg-2">
            <RotateCcw className="size-3.5" /> Reset link
          </button>
        </div>
      )}
    </section>
  );
}
