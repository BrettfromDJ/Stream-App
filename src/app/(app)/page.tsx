import { Suspense } from "react";
import { getLibrary } from "@/lib/library/queries";
import { homeSections } from "@/lib/library/selectors";
import { cardFromItem } from "@/lib/media/card";
import { ContinueCard } from "@/components/media/continue-card";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { DiscoveryRows } from "@/components/home/discovery-rows";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PreviewBanner } from "@/components/profile/preview-banner";
import { HomeHero } from "@/components/home/home-hero";
import { FeaturedContinue } from "@/components/home/featured-continue";
import { CategoryTiles } from "@/components/home/category-tiles";
import { HeadsUp } from "@/components/reminders/heads-up";

// The quiet second line of the headline: short and about you.
function statusLine(inProgress: number, total: number) {
  if (!total) return "Let's start your shelf.";
  if (!inProgress) return "What's next?";
  return inProgress === 1 ? "One thing on the go." : `${inProgress} things on the go.`;
}

export default async function HomePage() {
  const library = await getLibrary();
  const sections = homeSections(library.items);
  const continuing = sections.find((s) => s.variant === "continue");
  const featured = continuing?.items[0] ?? null;
  const status = statusLine(continuing?.items.length ?? 0, library.items.length);
  const hasError = "error" in library && Boolean(library.error);
  const counts = {
    watch: library.items.filter((i) => i.mediaType === "movie" || i.mediaType === "tv").length,
    book: library.items.filter((i) => i.mediaType === "book").length,
    game: library.items.filter((i) => i.mediaType === "game").length,
  };

  return (
    <div className="animate-fade-in">
      <HomeHero
        status={status}
        stats={{
          total: library.items.length,
          inProgress: library.items.filter((i) => i.status === "in_progress").length,
          finishedThisYear: library.items.filter((i) => i.dateFinished?.startsWith(String(new Date().getFullYear()))).length,
        }}
      />
      {library.mode === "preview" && <PreviewBanner />}
      {hasError ? <ErrorNotice className="mt-4" message={(library as { error: string }).error} /> : null}

      <div className="mt-2 flex flex-col gap-9 md:gap-11">
        {featured && <FeaturedContinue item={featured} />}

        <Suspense fallback={null}>
          <HeadsUp items={library.items} />
        </Suspense>

        {sections.length === 0 && !hasError && (
          <CategoryTiles counts={counts} />
        )}

        {sections.map((section, i) => {
          if (section.variant === "continue") {
            const rest = section.items.slice(1);
            if (!rest.length) return null;
            return (
              <Row key={section.key} title="Also in Progress" href={section.href} size="wide">
                {rest.map((item) => (
                  <ContinueCard key={item.id} media={cardFromItem(item)} />
                ))}
              </Row>
            );
          }
          return (
            <Row key={section.key} title={section.title} href={section.href}>
              {section.items.map((item, j) => (
                <MediaCard key={item.id} media={cardFromItem(item)} sizes={ROW_SIZES.poster} priority={i < 2 && j < 4} />
              ))}
            </Row>
          );
        })}

        {sections.length > 0 && (
          <CategoryTiles counts={counts} />
        )}
        <DiscoveryRows />
      </div>
    </div>
  );
}
