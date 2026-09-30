import Image from "next/image";
import Link from "next/link";
import { Tv } from "lucide-react";
import { browse } from "@/lib/providers";
import { exploreHref } from "@/lib/discover/taxonomy";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Lazy } from "@/components/discover/sections";

/** "New on your services" + "Popular on <service>" rows, or a prompt to pick services. */
export async function ServiceRows() {
  const user = await getUser();
  const services = user?.services ?? [];

  if (!services.length) {
    if (!isSupabaseConfigured || !user) return null;
    return (
      <section className="gutter">
        <Link
          href="/profile/services"
          className="flex items-center gap-4 rounded-[20px] bg-white/[0.05] p-4 transition-colors hover:bg-white/[0.08] md:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.08]">
            <Tv className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] font-semibold">What do you subscribe to?</span>
            <span className="block text-[14px] text-fg-2">Pick your streaming services to see what&apos;s on them.</span>
          </span>
        </Link>
      </section>
    );
  }

  const providers = await browse.watch.providers();
  const mine = services.map((id) => providers.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <Lazy>
        <DiscoverRow title="New on Your Services" items={browse.watch.onServices(services, "new")} href={exploreHref({ type: "movie", mine: true, sort: "new" })} />
      </Lazy>
      {mine.slice(0, 3).map((p) => (
        <Lazy key={p.id}>
          <DiscoverRow title={`Popular on ${p.name}`} items={browse.watch.onServices([p.id])} />
        </Lazy>
      ))}
      <div className="gutter -mt-4 flex flex-wrap items-center gap-2">
        {mine.map((p) => (
          <span key={p.id} className="relative size-7 overflow-hidden rounded-lg ring-1 ring-white/10" title={p.name}>
            {p.logoUrl && <Image src={p.logoUrl} alt={p.name} fill sizes="28px" className="object-cover" />}
          </span>
        ))}
        <Link href="/profile/services" className="ml-1 text-[13px] text-fg-2 hover:text-fg">
          Edit services
        </Link>
      </div>
    </>
  );
}
