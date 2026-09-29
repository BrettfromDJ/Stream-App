"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)" }}
      style={{ fontFamily: "var(--font-sans)" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-fg sm:w-[360px]",
          description: "text-[13px] text-fg-2",
          icon: "text-fg",
          actionButton: "ml-auto rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-black",
        },
      }}
    />
  );
}
