"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { authenticate, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "password" | "magic" | "signup";

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [mode, setMode] = useState<Mode>("password");
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {
    error: linkError ? "That link expired or was already used. Request a new one." : undefined,
  });

  const field =
    "h-[52px] w-full rounded-2xl bg-white/[0.06] px-4 text-[16px] outline-none transition-colors focus:bg-white/[0.09] placeholder:text-fg-3";

  return (
    <form action={action} className="mt-10 flex flex-col gap-3">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="next" value={next} />
      <label className="sr-only" htmlFor="email">
        Email
      </label>
      <input id="email" name="email" type="email" autoComplete="email" required placeholder="Email" className={field} />
      {mode !== "magic" && (
        <>
          <label className="sr-only" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="Password"
            className={field}
          />
        </>
      )}

      {state.error && <p role="alert" className="px-1 text-[14px] text-danger">{state.error}</p>}
      {state.message && <p role="status" className="px-1 text-[14px] text-success">{state.message}</p>}

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {mode === "magic" ? "Email Me a Link" : mode === "signup" ? "Create Account" : "Sign In"}
      </Button>

      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[14px]">
        {(["password", "magic", "signup"] as const)
          .filter((m) => m !== mode)
          .map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("font-medium text-fg-2 transition-colors hover:text-fg")}
            >
              {m === "magic" ? "Use a magic link" : m === "signup" ? "Create an account" : "Use a password"}
            </button>
          ))}
      </div>
    </form>
  );
}
