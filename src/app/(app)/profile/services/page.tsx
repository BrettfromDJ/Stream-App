import type { Metadata } from "next";
import { browse } from "@/lib/providers";
import { getUser } from "@/lib/supabase/server";
import { BackButton } from "@/components/detail/back-button";
import { ServicesPicker } from "@/components/profile/services-picker";

export const metadata: Metadata = { title: "Streaming Services" };

export default async function ServicesPage() {
  const [providers, user] = await Promise.all([browse.watch.providers(), getUser()]);
  return (
    <div className="gutter animate-fade-in pt-[calc(var(--nav-h)+0.75rem)] lg:pt-[calc(var(--nav-h)+1.5rem)]">
      <BackButton />
      <h1 className="mt-5 display text-[46px] md:text-[60px]">Streaming Services</h1>
      <p className="mt-2 max-w-xl text-[15px] text-fg-2">
        Pick the services you pay for. We&apos;ll show what&apos;s on them, highlight them on movie and show pages, and let you
        filter Explore to just your services.
      </p>
      <div className="mt-8">
        {providers.length ? (
          <ServicesPicker providers={providers} initial={user?.services ?? []} />
        ) : (
          <p className="text-[15px] text-fg-2">Streaming services are unavailable right now.</p>
        )}
      </div>
    </div>
  );
}
