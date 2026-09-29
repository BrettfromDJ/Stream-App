import type { MediaType } from "./types";

export const TYPE_LABEL: Record<MediaType, string> = {
  movie: "Movie",
  tv: "TV Show",
  book: "Book",
  game: "Game",
};

export const TYPE_LABEL_PLURAL: Record<MediaType, string> = {
  movie: "Movies",
  tv: "TV",
  book: "Books",
  game: "Games",
};

export const TYPE_NOUN_PLURAL: Record<MediaType, string> = {
  movie: "Movies",
  tv: "Shows",
  book: "Books",
  game: "Games",
};

export function mediaHref(type: MediaType, externalId: string) {
  return `/${type}/${encodeURIComponent(externalId)}`;
}
