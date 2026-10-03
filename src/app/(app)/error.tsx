"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="gutter flex min-h-[70dvh] flex-col justify-center md:items-center md:text-center">
      <p className="text-[24px] font-display font-bold tracking-[-0.04em]">Something went sideways.</p>
      <p className="mt-2 max-w-sm text-[15px] text-fg-2">Your library is safe. Give it another try.</p>
      <Button className="mt-6 self-start md:self-center" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
