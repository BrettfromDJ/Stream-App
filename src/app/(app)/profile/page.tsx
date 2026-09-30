import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ChevronRight, NotebookPen, LogOut, Tv } from "lucide-react";
import { getLibrary } from "@/lib/library/queries";
import { computeStats } from "@/lib/library/selectors";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { TYPE_NOUN_PLURAL } from "@/lib/media/labels";
import { MEDIA_TYPES } from "@/lib/media/types";
import { PageHeader } from "@/components/ui/page-header";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const [library, user] = await Promise.all([getLibrary(), getUser()]);
  const stats = computeStats(library.items, new Date().getFullYear());
  const reviews = library.items.filter((i) => i.review).length;
  const counts = Object.fromEntries(MEDIA_TYPES.map((t) => [t, library.items.filter((i) => i.mediaType === t).length]));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" />

      <div className="gutter mt-6 flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-[24px] font-bold ring-1 ring-white/10">
          {(user?.email ?? "Y").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold">{user?.email ?? "Preview"}</p>
          <p className="text-[14px] text-fg-2 tabular-nums">
            {stats.total} titles · {stats.completed} finished
          </p>
        </div>
      </div>

      <div className="gutter mt-8 grid grid-cols-4 gap-2 md:max-w-2xl">
        {MEDIA_TYPES.map((t) => (
          <Link key={t} href={`/library?type=${t}`} className="rounded-2xl bg-white/[0.04] px-3 py-3.5 transition-colors hover:bg-white/[0.07]">
            <p className="text-[22px] font-bold tracking-[-0.03em] tabular-nums">{counts[t]}</p>
            <p className="text-[12px] text-fg-2">{TYPE_NOUN_PLURAL[t]}</p>
          </Link>
        ))}
      </div>

      <nav className="gutter mt-8 md:max-w-2xl" aria-label="Profile">
        <ul className="overflow-hidden rounded-2xl bg-white/[0.04]">
          <ListLink href="/profile/stats" icon={<BarChart3 />} label="Statistics" detail={stats.averageRating ? `★ ${stats.averageRating} avg` : undefined} />
          <ListLink href="/profile/reviews" icon={<NotebookPen />} label="Reviews" detail={reviews ? String(reviews) : undefined} />
          <ListLink href="/profile/services" icon={<Tv />} label="Streaming Services" detail={user?.services.length ? String(user.services.length) : undefined} />
        </ul>
      </nav>

      {isSupabaseConfigured && user && (
        <form action={signOut} className="gutter mt-6 md:max-w-2xl">
          <button className="flex h-12 w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-4 text-[15px] font-medium text-danger transition-colors hover:bg-white/[0.07]">
            <LogOut className="size-[18px]" /> Sign Out
          </button>
        </form>
      )}

      <footer className="gutter mt-12 max-w-2xl space-y-2 text-[12px] leading-relaxed text-fg-3">
        <p>
          Movie and TV data from{" "}
          <a className="underline decoration-white/20 underline-offset-2 hover:text-fg-2" href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p>
          Game data and images from{" "}
          <a className="underline decoration-white/20 underline-offset-2 hover:text-fg-2" href="https://www.igdb.com" target="_blank" rel="noreferrer">
            IGDB
          </a>
          . Store charts from Steam. Not affiliated with Valve.
        </p>
        <p>
          Book data and covers from{" "}
          <a className="underline decoration-white/20 underline-offset-2 hover:text-fg-2" href="https://hardcover.app" target="_blank" rel="noreferrer">
            Hardcover
          </a>{" "}
          and{" "}
          <a className="underline decoration-white/20 underline-offset-2 hover:text-fg-2" href="https://openlibrary.org" target="_blank" rel="noreferrer">
            Open Library
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

function ListLink({ href, icon, label, detail }: { href: string; icon: React.ReactNode; label: string; detail?: string }) {
  return (
    <li className="border-b border-white/[0.06] last:border-0">
      <Link href={href} className="flex h-14 items-center gap-3 px-4 text-[16px] transition-colors hover:bg-white/[0.03] [&>svg:first-child]:size-5 [&>svg:first-child]:text-fg-2">
        {icon}
        <span className="flex-1 font-medium">{label}</span>
        {detail && <span className="text-[14px] text-fg-3">{detail}</span>}
        <ChevronRight className="size-4 text-fg-3" strokeWidth={2.5} />
      </Link>
    </li>
  );
}
