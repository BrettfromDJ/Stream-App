import { notFound } from "next/navigation";
import Image from "next/image";
import { getPerson, ProviderError } from "@/lib/providers";
import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult, libraryKey } from "@/lib/media/card";
import type { PersonProfile } from "@/lib/media/types";
import { BackButton } from "@/components/detail/back-button";
import { ExpandableText } from "@/components/detail/expandable-text";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";

const ROLE: Record<string, string> = {
  Acting: "Actor",
  Directing: "Director",
  Writing: "Writer",
  Production: "Producer",
  Creator: "Creator",
  Sound: "Composer",
  Camera: "Cinematographer",
  Editing: "Editor",
};

async function load(id: string): Promise<PersonProfile | null> {
  try {
    return await getPerson(id);
  } catch (err) {
    if (err instanceof ProviderError && err.kind === "not_found") notFound();
    console.error("[person page]", id, (err as Error)?.message ?? err);
    return null;
  }
}

/** Directors, creators and actors: best-known work, then everything by role, newest first. */
export async function PersonPage({ id }: { id: string }) {
  const [person, index] = await Promise.all([load(id), getLibraryIndex()]);

  if (!person) {
    return (
      <div className="gutter pt-[calc(var(--nav-h)+1rem)]">
        <BackButton />
        <p className="py-20 text-[20px] font-bold tracking-[-0.02em] md:text-center">This page isn&apos;t available right now.</p>
      </div>
    );
  }

  const seen = new Set(person.sections.flatMap((s) => s.items).map((i) => libraryKey(i.type, i.externalId)));
  const inLibrary = [...seen].filter((k) => index[k]).length;
  const backdrop = person.popular.find((p) => p.backdropUrl)?.backdropUrl;
  const role = person.knownFor ? ROLE[person.knownFor] ?? person.knownFor : null;

  return (
    <article className="relative animate-fade-in">
      {/* Their best-known work, faded behind the header */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[440px] overflow-hidden md:h-[520px]">
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-top opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/70 to-bg" />
      </div>

      <div className="gutter relative pt-[calc(var(--nav-h)+0.75rem)]">
        <BackButton />
        <header className="mt-4 flex flex-col items-center gap-5 text-center md:mt-8 md:flex-row md:items-end md:gap-8 md:text-left">
          <div className="relative size-40 shrink-0 overflow-hidden rounded-full bg-elevated-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/15 md:size-44">
            {person.photoUrl ? (
              <Image src={person.photoUrl} alt={person.name} fill sizes="176px" className="object-cover object-top" priority />
            ) : (
              <span className="grid size-full place-items-center text-[52px] font-bold text-fg-3">{person.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            {role && <p className="text-[12px] font-semibold tracking-[0.1em] text-fg-3 uppercase">{role}</p>}
            <h1 className="mt-1 text-[34px] leading-[1.05] font-bold tracking-[-0.03em] text-balance md:text-[48px]">{person.name}</h1>
            <p className="mt-2 text-[14px] text-fg-2 md:text-[15px]">
              {[person.lifespan, person.birthplace, `${person.credits} title${person.credits === 1 ? "" : "s"}`, inLibrary ? `${inLibrary} in your library` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </header>
        {person.bio && <ExpandableText text={person.bio} lines={4} className="mx-auto mt-6 max-w-3xl md:mx-0" />}
      </div>

      <div className="mt-10 flex flex-col gap-10 md:gap-12">
        {person.popular.length >= 3 && (
          <Row title="Best Known For">
            {person.popular.map((m, i) => (
              <MediaCard key={`${m.type}-${m.externalId}`} media={cardFromResult(m, index)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary priority={i < 4} />
            ))}
          </Row>
        )}

        {person.sections.map((s) => (
          <Row key={s.title} title={s.title} subtitle={`${s.items.length} title${s.items.length === 1 ? "" : "s"} · newest first`}>
            {s.items.map((m) => (
              <MediaCard key={`${m.type}-${m.externalId}`} media={cardFromResult(m, index)} sizes={ROW_SIZES.poster} showRating={false} showInLibrary />
            ))}
          </Row>
        ))}

        <p className="gutter text-[12px] text-fg-3">Data from TMDB.</p>
      </div>
    </article>
  );
}
