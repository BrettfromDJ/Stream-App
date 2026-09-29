import type { LibraryStatus, MediaType } from "./types";

const VERB: Record<MediaType, { want: string; doing: string }> = {
  movie: { want: "Watch", doing: "Watching" },
  tv: { want: "Watch", doing: "Watching" },
  book: { want: "Read", doing: "Reading" },
  game: { want: "Play", doing: "Playing" },
};

export function statusLabel(status: LibraryStatus, type: MediaType): string {
  switch (status) {
    case "backlog":
      return `Want to ${VERB[type].want}`;
    case "in_progress":
      return VERB[type].doing;
    case "completed":
      return "Finished";
    case "dropped":
      return "Did Not Finish";
  }
}

/** Status labels when the media type is mixed (library filters). */
export const GENERIC_STATUS_LABEL: Record<LibraryStatus, string> = {
  in_progress: "In Progress",
  backlog: "Want To",
  completed: "Finished",
  dropped: "Did Not Finish",
};

export const STATUS_ORDER: LibraryStatus[] = ["backlog", "in_progress", "completed", "dropped"];

export function canRate(status: LibraryStatus | null | undefined) {
  return status === "in_progress" || status === "completed" || status === "dropped";
}
