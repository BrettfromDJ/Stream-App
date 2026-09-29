import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { favoriteOf, notInLibrary } from "@/components/discover/personal";

export const metadata: Metadata = { title: "Games" };

const g = browse.games;

export default function GamesPage() {
  // One batched IGDB request feeds most rows.
  const hub = g.hub();
  const steam = g.steam();
  return (
    <div className="animate-fade-in">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero
          items={hub.then((h) => h.featured)}
          needsBackdrop
          eyebrow={() => "Just Released"}
          meta={(m) => [m.year ? String(m.year) : null, m.subtitle]}
        />
      </Suspense>

      <div className="mt-8 md:-mt-6 md:relative md:z-10">
        <Rows>
          <Lazy size="wide">
            <DiscoverRow title="Countdown" items={hub.then((h) => h.countdown)} variant="countdown" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Top Sellers on Steam" items={steam.then((s) => s.topSellers)} variant="ranked" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Most Played on Steam" items={steam.then((s) => s.mostPlayed)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Popular Right Now" items={g.popularNow()} />
          </Lazy>
          <Lazy>
            <BecauseYouLoved />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Just Released" items={hub.then((h) => h.justReleased)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Popular New Releases on Steam" items={steam.then((s) => s.newReleases)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Top 10 This Year" items={hub.then((h) => h.topThisYear)} variant="ranked" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Steam Deals" items={steam.then((s) => s.deals)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Most Anticipated" items={hub.then((h) => h.anticipated)} dates />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Coming Soon on Steam" items={steam.then((s) => s.comingSoon)} dates />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Great Recent RPGs" items={hub.then((h) => h.rpg)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Indie Standouts" items={hub.then((h) => h.indie)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Shooters" items={hub.then((h) => h.shooter)} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Greats" items={hub.then((h) => h.allTime)} />
          </Lazy>
        </Rows>
      </div>
    </div>
  );
}

async function BecauseYouLoved() {
  const fav = await favoriteOf(["game"]);
  if (!fav) return null;
  const recs = await g.similarTo(fav.externalId);
  return <DiscoverRow title={`Because You Loved ${fav.title}`} items={notInLibrary(recs)} />;
}
