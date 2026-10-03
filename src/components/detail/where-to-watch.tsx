import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { WatchAvailability, WatchProvider } from "@/lib/media/types";
import { cn } from "@/lib/utils";

function ProviderChip({ p, mine, href }: { p: WatchProvider; mine: boolean; href: string | null }) {
  const body = (
    <>
      <span className="relative size-11 shrink-0 overflow-hidden rounded-[11px] bg-elevated-2 ring-1 ring-white/10">
        {p.logoUrl ? <Image src={p.logoUrl} alt="" fill sizes="44px" className="object-cover" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium">{p.name}</span>
        {mine && <span className="block text-[11.5px] font-semibold text-success">Your service</span>}
      </span>
    </>
  );
  const cls = cn(
    "flex min-w-0 items-center gap-2.5 rounded-2xl p-1.5 pr-3 transition-colors",
    mine ? "bg-success/10 ring-1 ring-success/30" : "bg-white/[0.04] hover:bg-white/[0.07]",
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function WhereToWatch({ watch, services }: { watch: WatchAvailability; services: number[] }) {
  const mine = new Set(services);
  const groups: { label: string; list: WatchProvider[] }[] = [
    { label: "Stream", list: watch.stream },
    { label: "Free", list: watch.free },
    { label: "Rent", list: watch.rent },
    { label: "Buy", list: watch.buy },
  ].filter((g) => g.list.length);
  const onMine = watch.stream.concat(watch.free).filter((p) => mine.has(p.id));

  return (
    <section aria-labelledby="watch">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="watch" className="display text-[24px] md:text-[26px]">
          Where to Watch
        </h2>
        {watch.link && (
          <a href={watch.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-fg-2 hover:text-fg">
            All options <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
      {services.length > 0 && (
        <p className={cn("mb-4 text-[14px]", onMine.length ? "text-success" : "text-fg-2")}>
          {onMine.length
            ? `Streaming on ${onMine.map((p) => p.name).join(" and ")}, which you have.`
            : "Not on any of your services right now."}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-fg-3 uppercase">{g.label}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {g.list.slice(0, 9).map((p) => (
                <ProviderChip key={`${g.label}-${p.id}`} p={p} mine={mine.has(p.id) && (g.label === "Stream" || g.label === "Free")} href={watch.link} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-fg-3">Availability in the US, from JustWatch.</p>
    </section>
  );
}
