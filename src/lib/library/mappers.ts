import type { LibraryItem, LibraryStatus, MediaProgress, MediaType } from "@/lib/media/types";

export interface LibraryRow {
  id: string;
  user_id: string;
  media_type: MediaType;
  external_id: string;
  title: string;
  subtitle: string | null;
  artwork_url: string | null;
  backdrop_url: string | null;
  release_date: string | null;
  status: LibraryStatus;
  rating: number | string | null;
  review: string | null;
  reviewed_at: string | null;
  date_started: string | null;
  date_finished: string | null;
  progress: MediaProgress | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const LIBRARY_COLUMNS =
  "id,user_id,media_type,external_id,title,subtitle,artwork_url,backdrop_url,release_date,status,rating,review,reviewed_at,date_started,date_finished,progress,metadata,created_at,updated_at";

export function fromRow(row: LibraryRow): LibraryItem {
  return {
    id: row.id,
    mediaType: row.media_type,
    externalId: row.external_id,
    title: row.title,
    subtitle: row.subtitle,
    artworkUrl: row.artwork_url,
    backdropUrl: row.backdrop_url,
    releaseDate: row.release_date,
    status: row.status,
    rating: row.rating == null ? null : Number(row.rating),
    review: row.review,
    reviewedAt: row.reviewed_at,
    dateStarted: row.date_started,
    dateFinished: row.date_finished,
    progress: row.progress,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
