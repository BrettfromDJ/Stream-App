import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center px-6 md:items-center md:text-center">
      <p className="text-[13px] font-semibold tracking-[0.1em] text-fg-3 uppercase">Not found</p>
      <h1 className="mt-2 text-[28px] font-bold tracking-[-0.025em]">This one isn&apos;t on the shelf.</h1>
      <Link href="/" className={buttonClasses("primary", "md", "mt-6")}>
        Go Home
      </Link>
    </main>
  );
}
