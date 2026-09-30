import Link from "next/link";
import { Search } from "lucide-react";
import { getLibrary } from "@/lib/library/queries";
import { homeSections } from "@/lib/library/selectors";
import { cardFromItem } from "@/lib/media/card";
import { ContinueCard } from "@/components/media/continue-card";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { PageHeader } from "@/components/ui/page-header";
import { Greeting, TodayLabel } from "@/components/home/greeting";
import { DiscoveryRows } from "@/components/home/discovery-rows";
import { HomeEmpty } from "@/components/home/home-empty";
import { ErrorNotice } from "@/components/ui/error-notice";
import { PreviewBanner } from "@/components/profile/preview-banner";
import { DiscoverActions } from "@/components/discover/discover-actions";

export default async function HomePage() {
  const library = await getLibrary();
  const sections = homeSections(library.items);

  return (
    <div className="animate-fade-in">
      {library.mode === "preview" && <PreviewBanner />}
      <PageHeader
        className={library.mode === "preview" ? "pt-6 lg:pt-6" : undefined}
        eyebrow={<TodayLabel />}
        title={<Greeting />}
        actions={
          <Link
            href="/search"
            aria-label="Search"
            className="glass grid size-11 place-items-center rounded-full transition-transform active:scale-95 lg:hidden"
          >
            <Search className="size-5" strokeWidth={2.1} />
          </Link>
        }
      />

      {"error" in library && library.error ? <ErrorNotice className="mt-6" message={library.error} /> : null}

      <div className="mt-6 flex flex-col gap-9 md:mt-8 md:gap-11">
        {sections.length === 0 && !("error" in library && library.error) ? <HomeEmpty /> : null}

        {sections.map((section, i) =>
          section.variant === "continue" ? (
            <Row key={section.key} title={section.title} href={section.href} size="wide">
              {section.items.map((item, j) => (
                <ContinueCard key={item.id} media={cardFromItem(item)} priority={j < 2} />
              ))}
            </Row>
          ) : (
            <Row key={section.key} title={section.title} href={section.href}>
              {section.items.map((item, j) => (
                <MediaCard key={item.id} media={cardFromItem(item)} sizes={ROW_SIZES.poster} priority={i < 2 && j < 4} />
              ))}
            </Row>
          ),
        )}

        <div className="flex flex-col gap-9 md:gap-11">
          {sections.length > 0 && (
            <div className="gutter -mb-4 md:-mb-5">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-fg-3 uppercase">Discover</p>
            </div>
          )}
          <DiscoverActions types={["movie", "tv", "book", "game"]} label="anything" />
          <DiscoveryRows />
        </div>
      </div>
    </div>
  );
}
