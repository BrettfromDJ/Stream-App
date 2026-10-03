import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMediaDetail, getSeason, ProviderError, resolveBookIsbn } from "@/lib/providers";
import { getLibraryIndex, getLibraryItem } from "@/lib/library/queries";
import { cardFromItem, cardFromResult, type CardData } from "@/lib/media/card";
import { yearFrom } from "@/lib/media/format";
import { TYPE_LABEL } from "@/lib/media/labels";
import type { LibraryItem, MediaDetail, MediaType } from "@/lib/media/types";
import { Artwork } from "@/components/media/artwork";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { LibraryPanel } from "@/components/library/library-panel";
import { BackButton } from "./back-button";
import { ExpandableText } from "./expandable-text";
import { HowToPlay, SteamReviewsSection, TimeToBeat, WhereToBuy } from "./game-extras";
import { ExternalScores, PlayersNow } from "./scores";
import { Adaptations } from "./adaptations";
import { BookVibes } from "./book-vibes";
import { ReviewsSection } from "./reviews";
import { WhereToWatch } from "./where-to-watch";
import { EpisodeTracker } from "./episode-tracker";
import { ProgressTracker } from "./progress-tracker";
import { BookBackdrop, BookCover } from "./book-hero";
import { RemindMe } from "@/components/reminders/remind-me";
import { FriendlyDate } from "@/components/ui/friendly-date";
import { todayIso } from "@/lib/reminders/reminders";
import { getUser } from "@/lib/supabase/server";
import { PlayTrailerButton, VideoModal, VideoRow } from "./video-player";
import { cn } from "@/lib/utils";

const SOURCE: Record<MediaType, string> = { movie: "TMDB", tv: "TMDB", book: "Hardcover", game: "IGDB" };
const sourceOf = (type: MediaType, id: string) => (type === "book" && !/^\d+$/.test(id) ? "Open Library" : SOURCE[type]);

// Phones: pull the cover up so it starts just below the back button (hero is min(62vh, 560px) tall).
const PHONE_TOP = "-mt-[calc(min(62vh,560px)-var(--nav-h)-4.25rem)]";

type Loaded = { detail: MediaDetail; degraded: boolean };

async function load(type: MediaType, id: string, item: LibraryItem | null): Promise<Loaded | null> {
  try {
    return { detail: await getMediaDetail(type, id), degraded: false };
  } catch (err) {
    if (err instanceof ProviderError && err.kind === "not_found" && !item) notFound();
    // Provider down / not configured: fall back to what we saved.
    if (item) return { detail: detailFromItem(item), degraded: true };
    if (!(err instanceof ProviderError)) console.error("[detail]", err);
    return null;
  }
}

function detailFromItem(item: LibraryItem): MediaDetail {
  const year = yearFrom(item.releaseDate);
  const genres = Array.isArray(item.metadata.genres) ? (item.metadata.genres as string[]) : [];
  return {
    type: item.mediaType,
    externalId: item.externalId,
    title: item.title,
    subtitle: item.subtitle,
    year,
    releaseDate: item.releaseDate,
    artworkUrl: item.artworkUrl,
    backdropUrl: item.backdropUrl,
    description: null,
    genres,
    highlights: year ? [String(year)] : [],
    facts: [],
  };
}

export async function DetailPage({ type, id }: { type: MediaType; id: string }) {
  if (type === "book" && id.startsWith("isbn-")) {
    const resolved = await resolveBookIsbn(id.slice(5));
    if (!resolved) notFound();
    redirect(`/book/${resolved}`);
  }
  const item = await getLibraryItem(type, id);
  const [loaded, index] = await Promise.all([load(type, id, item), getLibraryIndex()]);

  if (!loaded) return <Unavailable type={type} id={id} />;
  const { detail, degraded } = loaded;

  const card: CardData = item
    ? { ...cardFromItem(item), metadata: detail.metadata ?? item.metadata }
    : cardFromResult(detail, index);
  // Keep the snapshot fresh with the richer detail data when adding.
  if (!item) {
    card.subtitle = detail.subtitle;
    card.backdropUrl = detail.backdropUrl;
    card.artworkUrl = detail.artworkUrl;
  }

  // Not out yet (or a new episode is scheduled): offer a reminder.
  const today = todayIso();
  const upcoming =
    type === "tv"
      ? // Mid-season episodes only matter once you're watching; premieres always do.
        detail.nextEpisode?.airDate && detail.nextEpisode.airDate > today && (detail.nextEpisode.episode === 1 || item?.status === "in_progress")
        ? detail.nextEpisode.airDate
        : null
      : detail.releaseDate && /^\d{4}-\d{2}-\d{2}$/.test(detail.releaseDate) && detail.releaseDate > today
        ? detail.releaseDate
        : null;

  const highlights = detail.readingMinutes ? [...detail.highlights, `~${formatReadTime(detail.readingMinutes)} read`] : detail.highlights;
  const hero = detail.backdropUrl ?? null;
  const hasHero = Boolean(hero || detail.artworkUrl);
  // Books get a cover-built header (no wide backdrop exists).
  const isBook = type === "book" && !hero && Boolean(detail.artworkUrl);
  const shelf = isBook ? (detail.relatedRows ?? []).flatMap((r) => r.items).filter((b) => b.externalId !== id) : [];
  // Phones: everything in the title block is centered under the artwork.
  const center = "max-md:justify-center";

  return (
    <article className="relative animate-fade-in">
      {/* Hero */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          hasHero ? "h-[min(62vh,560px)] md:h-[min(70vh,640px)]" : "h-[calc(var(--nav-h)+4.5rem)]",
        )}
      >
        {isBook ? (
          <BookBackdrop cover={detail.artworkUrl} shelf={shelf} />
        ) : hero ? (
          <Image src={hero} alt="" fill priority sizes="100vw" className="fade-to-bg object-cover object-top" />
        ) : detail.artworkUrl ? (
          <Image
            src={detail.artworkUrl}
            alt=""
            fill
            priority
            sizes="400px"
            className="fade-to-bg scale-125 object-cover opacity-60 blur-3xl saturate-150"
          />
        ) : null}
        {!isBook && (
          <>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/10" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-transparent max-md:hidden" />
          </>
        )}
        <div className="gutter absolute top-[calc(var(--nav-h)+0.75rem)] left-0">
          <BackButton />
        </div>
      </div>

      {/* Title block */}
      <div
        className={cn(
          "gutter relative",
          isBook ? `${PHONE_TOP} md:-mt-[34vh] lg:-mt-[330px]` : hasHero ? `${PHONE_TOP} md:-mt-[30vh] lg:-mt-[300px]` : "mt-2",
        )}
      >
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:gap-8 md:text-left">
          {isBook ? (
            <BookCover
              src={detail.artworkUrl}
              title={detail.title}
              sizes="(min-width: 1024px) 248px, (min-width: 768px) 220px, 58vw"
              className="w-[58vw] max-w-[250px] md:w-[220px] md:max-w-none lg:w-[248px]"
            />
          ) : (
          <div
            className={cn(
              "relative w-[56vw] max-w-[240px] shrink-0 overflow-hidden rounded-[16px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 md:w-[220px] md:max-w-none lg:w-[248px]",
              "aspect-[2/3]",
            )}
          >
            <Artwork src={detail.artworkUrl} title={detail.title} type={type} sizes="(min-width: 1024px) 248px, (min-width: 768px) 220px, 56vw" priority />
          </div>
          )}
          <div className="min-w-0 max-md:w-full md:pb-2">
            <p className="text-[12px] font-semibold tracking-[0.1em] text-fg-3 uppercase">{TYPE_LABEL[type]}</p>
            <h1 className="mt-1 text-[30px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[44px] lg:text-[52px]">
              {detail.title}
            </h1>
            {detail.creators?.length ? (
              <p className="mt-2 text-[15px] text-fg-2 md:text-[17px]">
                {detail.creatorsLabel && <span>{detail.creatorsLabel} </span>}
                {detail.creators.map((c, i) => (
                  <span key={c.href}>
                    {i > 0 && ", "}
                    <Link href={c.href} className="text-fg/90 underline decoration-white/25 underline-offset-4 transition-colors hover:text-fg hover:decoration-white/60">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : detail.subtitle ? (
              <p className="mt-2 text-[15px] text-fg-2 md:text-[17px]">{detail.subtitle}</p>
            ) : null}
            <p className={cn("mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-fg-2 md:text-[15px]", center)}>
              {highlights.map((h, i) => (
                <span key={h} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-fg-3">·</span>}
                  {h}
                </span>
              ))}
              {detail.score && !detail.externalScores?.length ? (
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-1.5 py-px text-[12px] font-semibold text-fg">
                    {detail.score.max === 100 ? `${detail.score.source} ${detail.score.value}` : `${detail.score.source} ${detail.score.value}/${detail.score.max}`}
                  </span>
                </span>
              ) : null}
            </p>
            {detail.genres.length > 0 && <p className="mt-1.5 text-[14px] text-fg-3">{detail.genres.slice(0, 4).join(" · ")}</p>}
            {(detail.externalScores?.length || detail.awards) && <ExternalScores scores={detail.externalScores ?? []} awards={detail.awards} />}
            {detail.playersNow ? <PlayersNow count={detail.playersNow} /> : null}
            {(detail.videos?.[0] || upcoming) && (
              <div className={cn("mt-5 flex gap-2 max-md:w-full max-md:*:flex-1 md:flex-wrap", center)}>
                {detail.videos?.[0] && <PlayTrailerButton video={detail.videos[0]} />}
                {upcoming && <RemindMe media={card} date={upcoming} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="gutter mt-3 grid gap-10 md:mt-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 flex min-w-0 flex-col gap-10 lg:order-1">
          {degraded && (
            <p className="rounded-2xl bg-white/[0.05] px-4 py-3 text-[14px] text-fg-2">
              Full details from {sourceOf(type, id)} aren&apos;t available right now — showing what&apos;s saved in your library.
            </p>
          )}
          {detail.description ? (
            <section>
              <h2 className="sr-only">Overview</h2>
              <ExpandableText text={detail.description} lines={5} />
            </section>
          ) : null}
          {detail.adaptations && <Adaptations data={detail.adaptations} />}
          {type === "book" && <BookVibes moods={detail.moods ?? []} warnings={detail.contentWarnings ?? []} />}

          {type === "tv" && detail.seasons && detail.seasons.length > 0 && (
            <EpisodeTracker
              show={card}
              seasons={detail.seasons}
              initialSeason={await initialSeason(id, detail.seasons, item)}
              watched={item?.progress?.kind === "episode" ? item.progress.watched ?? {} : {}}
              ended={Boolean(detail.ended)}
            />
          )}
          {type === "book" && (
            <ProgressTracker
              media={card}
              progress={item?.progress && item.progress.kind !== "episode" ? item.progress : null}
              totalPages={typeof detail.metadata?.pages === "number" && detail.metadata.pages > 0 ? detail.metadata.pages : null}
            />
          )}
          {detail.watch && <WhereToWatch watch={detail.watch} services={(await getUser())?.services ?? []} />}
          {detail.playModes && detail.playModes.length > 0 && <HowToPlay modes={detail.playModes} />}
          {detail.timeToBeat && <TimeToBeat data={detail.timeToBeat} />}
          {detail.stores && detail.stores.length > 0 && <WhereToBuy stores={detail.stores} />}
          {detail.steamReviews && <SteamReviewsSection data={detail.steamReviews} />}
          {detail.reviews && (detail.reviews.reviews.length > 0 || detail.reviews.overall) && <ReviewsSection data={detail.reviews} />}

          {detail.facts.length > 0 && (
            <section>
              <h2 className="mb-3 text-[18px] font-bold tracking-[-0.02em]">Details</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {detail.facts.map((f) => (
                  <div key={f.label} className="min-w-0">
                    <dt className="text-[12px] font-medium tracking-wide text-fg-3 uppercase">{f.label}</dt>
                    <dd className="mt-0.5 text-[15px] break-words text-fg/90">
                      {f.label === "Next episode" && detail.nextEpisode?.airDate ? (
                        <>
                          S{detail.nextEpisode.season} E{detail.nextEpisode.episode} · <FriendlyDate date={detail.nextEpisode.airDate} />
                        </>
                      ) : (
                        f.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-8">
            <LibraryPanel media={card} review={item?.review ?? null} reviewedAt={item?.reviewedAt ?? null} />
          </div>
        </aside>
      </div>

      <div className="mt-12 flex flex-col gap-10 md:gap-12">
        {detail.cast && detail.cast.length > 0 && (
          <section aria-label="Cast">
            <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em]">Cast</h2>
            <div className="no-scrollbar gutter flex gap-4 overflow-x-auto pb-1">
              {detail.cast.map((p) => (
                <PersonLink key={`${p.name}-${p.role}`} href={p.href} className="group w-[84px] shrink-0 text-center md:w-[96px]">
                  <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-elevated-2 transition-transform group-active:scale-95">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-[22px] font-semibold text-fg-3">{p.name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-tight font-medium group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-2">{p.name}</p>
                  {p.role && <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-tight text-fg-3">{p.role}</p>}
                </PersonLink>
              ))}
            </div>
          </section>
        )}

        {detail.videos && detail.videos.length > 0 && <VideoRow videos={detail.videos} />}

        {detail.screenshots && detail.screenshots.length > 0 && (
          <section aria-label="Screenshots">
            <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em]">Screenshots</h2>
            <div className="no-scrollbar gutter snap-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {detail.screenshots.map((src, i) => (
                <div key={src} className="relative aspect-video w-[78vw] shrink-0 snap-start overflow-hidden rounded-[14px] bg-elevated-2 md:w-[420px]">
                  <Image src={src} alt={`Screenshot ${i + 1}`} fill sizes="(min-width: 768px) 420px, 78vw" className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {(detail.relatedRows ?? (detail.related?.length ? [{ title: "You Might Also Like", items: detail.related }] : [])).map(
          (row) => (
            <Row key={row.title} title={row.title} href={"href" in row ? row.href : undefined}>
              {row.items.map((r) => (
                <MediaCard
                  key={r.externalId}
                  media={cardFromResult(r, index)}
                  sizes={ROW_SIZES.poster}
                  showRating={false}
                  showInLibrary
                  badge={r.externalId === id ? (type === "book" ? "This book" : "This film") : typeof r.metadata?.badge === "string" ? r.metadata.badge : null}
                />
              ))}
            </Row>
          ),
        )}

        <p className="gutter text-[12px] text-fg-3">Data from {sourceOf(type, id)}.</p>
        {detail.videos && detail.videos.length > 0 && <VideoModal videos={detail.videos} />}
      </div>
    </article>
  );
}

/** Open on the season with the next unwatched episode (or the first season). */
async function initialSeason(id: string, seasons: NonNullable<MediaDetail["seasons"]>, item: LibraryItem | null) {
  const next = item?.progress?.kind === "episode" ? item.progress.season : null;
  const target = seasons.find((s) => s.number === next) ?? seasons.find((s) => s.number > 0) ?? seasons[0];
  if (!target) return null;
  try {
    return await getSeason(id, target.number);
  } catch {
    return null;
  }
}

function Unavailable({ type, id }: { type: MediaType; id: string }) {
  return (
    <div className="gutter pt-[calc(var(--nav-h)+1rem)]">
      <BackButton />
      <div className="py-20 md:text-center">
        <p className="text-[22px] font-bold tracking-[-0.02em]">This title isn&apos;t available right now.</p>
        <p className="mt-1.5 text-[15px] text-fg-2">
          {sourceOf(type, id)} didn&apos;t respond. Try again in a moment.
        </p>
      </div>
    </div>
  );
}

function PersonLink({ href, className, children }: { href?: string | null; className: string; children: React.ReactNode }) {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function formatReadTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
