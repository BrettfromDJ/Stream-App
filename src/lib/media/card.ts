import type { LibraryItem, LibraryStatus, MediaSearchResult, MediaSnapshot, MediaType } from "./types";
import { yearFrom } from "./format";

/** Everything a card (and its quick actions) needs, from either the library or a provider. */
export interface CardData {
  type: MediaType;
  externalId: string;
  title: string;
  subtitle?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  artworkUrl?: string | null;
  backdropUrl?: string | null;
  /** Artwork is landscape (e.g. a screenshot stand-in); cards crop it and request a wider image. */
  landscape?: boolean;
  libraryId?: string | null;
  status?: LibraryStatus | null;
  rating?: number | null;
  progress?: LibraryItem["progress"];
  metadata?: Record<string, unknown>;
}

export type LibraryIndex = Record<string, { id: string; status: LibraryStatus; rating: number | null }>;

export const libraryKey = (type: MediaType, externalId: string) => `${type}:${externalId}`;

export function cardFromItem(item: LibraryItem): CardData {
  return {
    type: item.mediaType,
    externalId: item.externalId,
    title: item.title,
    subtitle: item.subtitle,
    year: yearFrom(item.releaseDate),
    releaseDate: item.releaseDate,
    artworkUrl: item.artworkUrl,
    backdropUrl: item.backdropUrl,
    landscape: item.metadata.landscapeArtwork === true,
    libraryId: item.id,
    status: item.status,
    rating: item.rating,
    progress: item.progress,
    metadata: item.metadata,
  };
}

export function cardFromResult(result: MediaSearchResult, index?: LibraryIndex): CardData {
  const entry = index?.[libraryKey(result.type, result.externalId)];
  return {
    type: result.type,
    externalId: result.externalId,
    title: result.title,
    subtitle: result.subtitle,
    year: result.year ?? yearFrom(result.releaseDate),
    releaseDate: result.releaseDate,
    artworkUrl: result.artworkUrl,
    backdropUrl: result.backdropUrl,
    landscape: result.metadata?.landscapeArtwork === true,
    libraryId: entry?.id ?? null,
    status: entry?.status ?? null,
    rating: entry?.rating ?? null,
    metadata: result.metadata,
  };
}

export function snapshotOf(card: CardData | MediaSearchResult): MediaSnapshot {
  // Only a few metadata keys are worth persisting.
  const meta = card.metadata ?? {};
  const keep = ["genres", "genreIds", "platforms", "authors", "pages", "runtime", "seasons", "episodes", "director", "network", "developers"];
  const metadata = Object.fromEntries(Object.entries(meta).filter(([k, v]) => keep.includes(k) && v != null));
  return {
    type: card.type,
    externalId: card.externalId,
    title: card.title,
    subtitle: card.subtitle ?? null,
    artworkUrl: card.artworkUrl ?? null,
    backdropUrl: card.backdropUrl ?? null,
    releaseDate: card.releaseDate ?? null,
    metadata,
  };
}
