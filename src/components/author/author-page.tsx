import { notFound } from "next/navigation";
import Image from "next/image";
import { getAuthor, ProviderError } from "@/lib/providers";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { AuthorProfile } from "@/lib/media/types";
import { BackButton } from "@/components/detail/back-button";
import { ExpandableText } from "@/components/detail/expandable-text";
import { MediaCard } from "@/components/media/media-card";
import { GRID_SIZES, MediaGrid } from "@/components/media/grid";
import { Row, ROW_SIZES } from "@/components/media/row";

async function load(id: string): Promise<AuthorProfile | null> {
  try {
    return await getAuthor(id);
  } catch (err) {
    if (err instanceof ProviderError && err.kind === "not_found") notFound();
    console.error("[author page]", id, (err as Error)?.message ?? err);
    return null;
  }
}

export async function AuthorPage({ id }: { id: string }) {
  const [author, index] = await Promise.all([load(id), getLibraryIndex()]);

  if (!author) {
    return (
      <div className="gutter pt-[calc(var(--nav-h)+1rem)]">
        <BackButton />
        <p className="py-20 text-[20px] font-bold tracking-[-0.02em] md:text-center">This author isn&apos;t available right now.</p>
      </div>
    );
  }

  const readCount = author.all.filter((b) => index[`book:${b.externalId}`]).length;
  const backdrop = author.popular[0]?.artworkUrl;

  return (
    <article className="relative animate-fade-in">
      {/* Soft wash from their most popular cover */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="400px" className="fade-to-bg scale-125 object-cover opacity-40 blur-3xl saturate-150" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
      </div>

      <div className="gutter relative pt-[calc(var(--nav-h)+0.75rem)]">
        <BackButton />
        <header className="mt-6 flex flex-col items-start gap-5 md:flex-row md:items-end md:gap-8">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-elevated-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 md:size-36">
            {author.photoUrl ? (
              <Image src={author.photoUrl} alt={author.name} fill sizes="144px" className="object-cover" priority />
            ) : (
              <span className="grid size-full place-items-center text-[44px] font-bold text-fg-3">{author.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold tracking-[0.1em] text-fg-3 uppercase">Author</p>
            <h1 className="mt-1 text-[34px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[48px]">{author.name}</h1>
            <p className="mt-2 text-[14px] text-fg-2 md:text-[15px]">
              {[
                author.lifespan,
                `${author.bookCount} book${author.bookCount === 1 ? "" : "s"}`,
                author.series.length ? `${author.series.length} series` : null,
                readCount ? `${readCount} in your library` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </header>
        {author.bio && <ExpandableText text={author.bio} lines={4} className="mt-6 max-w-3xl" />}
      </div>

      <div className="mt-10 flex flex-col gap-10 md:gap-12">
        {author.popular.length > 0 && (
          <Row title="Most Popular">
            {author.popular.map((b, i) => (
              <MediaCard key={b.externalId} media={cardFromResult(b, index)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary priority={i < 4} />
            ))}
          </Row>
        )}

        {author.series.map((s) => (
          <Row key={s.title} title={s.title}>
            {s.items.map((b) => (
              <MediaCard
                key={b.externalId}
                media={cardFromResult(b, index)}
                sizes={ROW_SIZES.poster}
                showRating={false}
                showInLibrary
                badge={typeof b.metadata?.badge === "string" ? b.metadata.badge : null}
              />
            ))}
          </Row>
        ))}

        {author.all.length > author.popular.length && (
          <section aria-label="All books">
            <h2 className="gutter mb-3 text-[20px] font-bold tracking-[-0.02em] md:text-[22px]">All Books</h2>
            <MediaGrid>
              {author.all.map((b) => (
                <MediaCard key={b.externalId} media={cardFromResult(b, index)} sizes={GRID_SIZES} showRating={false} showInLibrary />
              ))}
            </MediaGrid>
          </section>
        )}

        <p className="gutter text-[12px] text-fg-3">Data from {author.source}.</p>
      </div>
    </article>
  );
}
