import type { Metadata } from "next";
import { Suspense } from "react";
import { browse } from "@/lib/providers";
import { exploreHref } from "@/lib/discover/taxonomy";
import { DiscoverRow } from "@/components/discover/discover-row";
import { Hero } from "@/components/discover/hero";
import { HeroSkeleton } from "@/components/discover/hero-carousel";
import { Lazy, Rows } from "@/components/discover/sections";
import { favoriteOf, notInLibrary } from "@/components/discover/personal";
import { ChartList } from "@/components/discover/chart-list";
import { GridBlock } from "@/components/discover/grid-block";
import { Spotlight } from "@/components/discover/spotlight";
import { ReleaseCalendar } from "@/components/discover/release-calendar";
import { GenreTiles, MoodTiles, genreTilesFor, moodTilesFor } from "@/components/explore/tiles";
import { CollectionRow, presetItems } from "@/components/explore/collection-row";
import { PickedForYou } from "@/components/discover/picked-for-you";


export const metadata: Metadata = { title: "Games" };

const g = browse.games;

export default function GamesPage() {
  // One batched IGDB request feeds most sections.
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

      <div className="mt-8 md:relative md:z-10 md:-mt-6">
        <Rows>
          <Lazy size="wide">
            <DiscoverRow title="Countdown" items={hub.then((h) => h.countdown)} variant="countdown" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Top Sellers on Steam" items={steam.then((s) => s.topSellers)} variant="ranked" />
          </Lazy>
          <GenreTiles title="Browse by Genre" tiles={genreTilesFor("game")} allHref={exploreHref({ type: "game" })} />
          <Lazy>
            <PickedForYou types={["game"]} />
          </Lazy>
          <Lazy>
            <ChartList
              title="Most Played on Steam"
              items={steam.then((s) => s.mostPlayed)}
              detail={(i) => (typeof i.metadata?.badge === "string" ? `${i.metadata.badge} at peak` : null)}
            />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Popular Right Now" items={g.popularNow()} />
          </Lazy>
          <Lazy>
            <BecauseYouLoved />
          </Lazy>
          <Lazy>
            <GridBlock
              title="Just Released"
              subtitle="The last 30 days"
              items={hub.then((h) => h.justReleased)}
              href={exploreHref({ type: "game", sort: "new" })}
            />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Popular New Releases on Steam" items={steam.then((s) => s.newReleases)} />
          </Lazy>
          <MoodTiles title="What Are You in the Mood For?" tiles={moodTilesFor(["game"])} />
          <Lazy>
            <DiscoverRow title="Top 10 This Year" items={hub.then((h) => h.topThisYear)} variant="ranked" />
          </Lazy>
          <Lazy>
            <Spotlight eyebrow="Hidden Gem of the Day" items={presetItems("game", "hidden-gems")} />
          </Lazy>
          <Lazy>
            <CollectionRow type="game" preset="weekend" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Steam Deals" items={steam.then((s) => s.deals)} />
          </Lazy>
          <Lazy>
            <ReleaseCalendar
              title="Release Calendar"
              items={hub.then((h) => [...h.countdown, ...h.anticipated])}
              months={6}
            />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Coming Soon on Steam" items={steam.then((s) => s.comingSoon)} dates />
          </Lazy>
          <Lazy>
            <CollectionRow type="game" preset="hidden-gems" />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Great Recent RPGs" items={hub.then((h) => h.rpg)} href={exploreHref({ type: "game", genre: "rpg", decade: "2020s", sort: "top" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Indie Standouts" items={hub.then((h) => h.indie)} href={exploreHref({ type: "game", genre: "indie", decade: "2020s", sort: "top" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="Shooters" items={hub.then((h) => h.shooter)} href={exploreHref({ type: "game", genre: "shooter", decade: "2020s", sort: "top" })} />
          </Lazy>
          <Lazy>
            <DiscoverRow title="All-Time Greats" items={hub.then((h) => h.allTime)} href={exploreHref({ type: "game", sort: "top" })} />
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
