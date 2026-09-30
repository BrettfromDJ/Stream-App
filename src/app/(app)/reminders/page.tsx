import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BellRing } from "lucide-react";
import { getLibrary } from "@/lib/library/queries";
import { getReminders } from "@/lib/reminders/reminders";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ReminderList } from "@/components/reminders/reminder-list";
import { CalendarConnect } from "@/components/reminders/calendar-connect";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const library = await getLibrary();
  return (
    <div className="animate-fade-in">
      <PageHeader title="Reminders" eyebrow="Your shelf" />
      <p className="gutter mt-2 max-w-xl text-[15px] text-fg-2">
        Release days and new episodes for everything you&apos;re watching, want to read or waiting to play.
      </p>
      <div className="gutter mt-7 flex max-w-3xl flex-col gap-9">
        <Suspense fallback={<ListSkeleton />}>
          <Lists items={library.items} />
        </Suspense>
        <CalendarConnect available={library.mode === "live"} />
      </div>
    </div>
  );
}

async function Lists({ items }: { items: Awaited<ReturnType<typeof getLibrary>>["items"] }) {
  const { recent, upcoming } = await getReminders(items);
  if (!recent.length && !upcoming.length) {
    return (
      <div className="rounded-2xl bg-white/[0.04] px-5 py-10 text-center">
        <BellRing className="mx-auto size-7 text-fg-3" />
        <p className="mt-3 text-[17px] font-semibold">Nothing coming up yet</p>
        <p className="mx-auto mt-1 max-w-sm text-[14px] text-fg-2">
          Add an upcoming game, movie or book to Want to, or start watching a show — new episodes and release days will show up here.
        </p>
        <Link href="/games" className="mt-5 inline-flex h-10 items-center rounded-full bg-white/[0.08] px-4 text-[14px] font-semibold hover:bg-white/[0.12]">
          See upcoming games
        </Link>
      </div>
    );
  }
  return (
    <>
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20px] font-bold tracking-[-0.02em]">Out Now</h2>
          <ReminderList reminders={recent} past />
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20px] font-bold tracking-[-0.02em]">Coming Up</h2>
          <ReminderList reminders={upcoming} />
        </section>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-32 rounded-md" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[76px] rounded-2xl" />
      ))}
    </div>
  );
}
