"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bell, House, LibraryBig, Search, CircleUserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const BOTTOM_TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
] as const;

const BROWSE_TABS = [
  { href: "/watch", label: "Movies & TV" },
  { href: "/books", label: "Books" },
  { href: "/games", label: "Games" },
] as const;

const DESKTOP_LINKS = [{ href: "/", label: "Home" }, ...BROWSE_TABS, { href: "/library", label: "My Library" }] as const;

/** Routes that show the top bar on phones too (Netflix-style browse tabs). */
const BROWSE_ROUTES = ["/", "/watch", "/books", "/games"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Wraps the app so pages can offset themselves by the current nav height (var(--nav-h)). */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const topBar = BROWSE_ROUTES.includes(pathname);
  return (
    <div className="app-shell" data-top-bar={topBar}>
      <TopNav mobileVisible={topBar} />
      {children}
      <BottomNav />
    </div>
  );
}

/** Transparent over artwork at the top of the page, frosted glass once you scroll. */
function TopNav({ mobileVisible }: { mobileVisible: boolean }) {
  const pathname = usePathname();
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,backdrop-filter,box-shadow] duration-300",
        !mobileVisible && "max-lg:hidden",
        scrolled
          ? "bg-bg/70 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl backdrop-saturate-150"
          : "bg-gradient-to-b from-black/70 via-black/25 to-transparent",
      )}
    >
      {/* Phones: logo + browse tabs */}
      <div className="gutter flex h-[3.25rem] items-center gap-3 lg:hidden">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo className="size-7" />
        </Link>
        <nav aria-label="Browse" className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
          {BROWSE_TABS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  active ? "border-transparent bg-fg text-black" : "border-white/25 text-fg active:bg-white/10",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/reminders" aria-label="Reminders" className="-mr-1.5 ml-auto grid size-9 shrink-0 place-items-center rounded-full active:bg-white/10">
          <Bell className="size-[20px]" strokeWidth={2.1} />
        </Link>
      </div>

      {/* Desktop: Netflix-style link bar */}
      <div className="gutter hidden h-16 items-center gap-10 lg:flex">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="text-[19px] font-bold tracking-[-0.03em]">Shelf</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-7">
          {DESKTOP_LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-[14.5px] transition-colors",
                  active ? "font-semibold text-fg" : "font-medium text-fg-2 hover:text-fg",
                )}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="top-nav-active"
                    className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-fg"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/reminders"
            aria-label="Reminders"
            className={cn(
              "grid size-10 place-items-center rounded-full transition-colors hover:bg-white/10",
              isActive(pathname, "/reminders") && "bg-white/10",
            )}
          >
            <Bell className="size-[19px]" strokeWidth={2.1} />
          </Link>
          <Link
            href="/search"
            aria-label="Search"
            className={cn(
              "grid size-10 place-items-center rounded-full transition-colors hover:bg-white/10",
              isActive(pathname, "/search") && "bg-white/10",
            )}
          >
            <Search className="size-[19px]" strokeWidth={2.1} />
          </Link>
          <Link
            href="/profile"
            aria-label="Profile"
            className={cn(
              "grid size-10 place-items-center rounded-full transition-colors hover:bg-white/10",
              isActive(pathname, "/profile") && "bg-white/10",
            )}
          >
            <CircleUserRound className="size-[21px]" strokeWidth={1.9} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Floating glass tab bar on phones/tablets. */
function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 flex justify-center px-4 lg:hidden"
    >
      <div className="glass flex h-[64px] w-full max-w-[400px] items-stretch rounded-[32px] p-1.5">
        {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
          // Browse tabs belong to Home on phones.
          const active =
            isActive(pathname, href) || (href === "/" && BROWSE_TABS.some((t) => isActive(pathname, t.href)));
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
