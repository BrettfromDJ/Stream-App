import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/nav/app-nav";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pt-safe pb-safe">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
      </div>
      <div className="relative w-full max-w-[380px] animate-fade-in">
        <Logo className="size-12" />
        <h1 className="mt-6 text-[34px] leading-[1.05] font-bold tracking-[-0.035em]">Shelf</h1>
        <p className="mt-2 text-[16px] text-fg-2">Everything you&apos;re watching, reading and playing.</p>
        {isSupabaseConfigured ? (
          <LoginForm next={next ?? "/"} linkError={error === "link"} />
        ) : (
          <p className="mt-8 rounded-2xl bg-white/[0.05] p-4 text-[14px] leading-relaxed text-fg-2">
            Sign-in isn&apos;t set up yet. Add <code className="text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-fg">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to enable accounts.
          </p>
        )}
      </div>
    </main>
  );
}
