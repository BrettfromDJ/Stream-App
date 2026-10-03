import Link from "next/link";
import { Search } from "lucide-react";
import { BigStat, Headline, Mesh, MESHES } from "@/components/editorial/editorial";
import { Greeting, TodayLabel } from "./greeting";

export interface HomeStats {
  total: number;
  inProgress: number;
  finishedThisYear: number;
}

/** Editorial welcome: a soft color field, a two-tone greeting, your numbers, and search. */
export function HomeHero({ status, stats }: { status: string; stats: HomeStats }) {
  return (
    <section className="relative isolate">
      <Mesh colors={MESHES.home} intensity={0.6} />
      <div className="gutter relative pt-[calc(var(--nav-h)+2.25rem)] pb-8 md:pt-[calc(var(--nav-h)+3.5rem)] md:pb-12">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-fg/60 uppercase">
          <TodayLabel />
        </p>
        <Headline
          strong={<Greeting />}
          soft={status}
          className="mt-3 max-w-[13ch] text-[46px] md:max-w-[16ch] md:text-[76px] lg:text-[104px]"
        />
        {stats.total > 0 && (
          <div className="mt-8 flex gap-8 md:gap-12">
            <BigStat value={stats.inProgress} label="In progress" />
            <BigStat value={stats.finishedThisYear} label={`Done in ${new Date().getFullYear()}`} />
            <BigStat value={stats.total} label="On your shelf" className="max-[380px]:hidden" />
          </div>
        )}
        <Link
          href="/search"
          className="glass mt-8 flex h-14 w-full max-w-xl items-center gap-3 rounded-full px-5 text-[16px] text-fg-2 transition-transform active:scale-[0.99]"
        >
          <Search className="size-5 shrink-0 text-fg" strokeWidth={2.2} />
          <span className="truncate">
            <span className="sm:hidden">Search anything</span>
            <span className="hidden sm:inline">Search movies, shows, books & games</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
