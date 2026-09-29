"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { House, LibraryBig, Search, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
}

/** Floating glass tab bar on phones/tablets. */
export function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 flex justify-center px-4 lg:hidden"
    >
      <div className="glass flex h-[64px] w-full max-w-[400px] items-stretch rounded-[32px] p-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-[26px] transition-transform active:scale-[0.92]"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-[26px] bg-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                />
              )}
              <Icon
                aria-hidden
                className={cn("relative size-[22px] transition-colors", active ? "text-fg" : "text-fg-2")}
                strokeWidth={active ? 2.25 : 1.9}
              />
              <span className={cn("relative text-[10.5px] font-semibold tracking-tight", active ? "text-fg" : "text-fg-2")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Compact sidebar on desktop. */
export function Sidebar() {
  const isActive = useActive();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col bg-[#0c0c0c] px-3 pt-7 pb-6 lg:flex">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-3">
        <Logo />
        <span className="text-[19px] font-bold tracking-[-0.03em]">Shelf</span>
      </Link>
      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] font-medium transition-colors",
                active ? "text-fg" : "text-fg-2 hover:bg-white/[0.04] hover:text-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-white/[0.08]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Icon aria-hidden className="relative size-[19px]" strokeWidth={active ? 2.2 : 1.9} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-7", className)}>
      <rect width="64" height="64" rx="14" fill="#1c1c1c" />
      <rect x="14" y="16" width="9" height="32" rx="2.5" fill="#f5f5f5" />
      <rect x="27.5" y="16" width="9" height="32" rx="2.5" fill="#f5f5f5" opacity=".6" />
      <rect x="41" y="18" width="9" height="30" rx="2.5" fill="#f5f5f5" opacity=".35" transform="rotate(-10 45.5 33)" />
    </svg>
  );
}
