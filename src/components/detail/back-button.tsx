"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="glass grid size-10 place-items-center rounded-full transition-transform active:scale-90"
    >
      <ChevronLeft className="size-5" strokeWidth={2.5} />
    </button>
  );
}
