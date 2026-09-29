import type { LibraryItem, LibraryStatus, MediaType } from "@/lib/media/types";

/**
 * Sample library used only when Supabase isn't configured (e.g. a fresh Vercel preview).
 * Artwork is intentionally omitted — cards fall back to typographic covers.
 */

type Seed = [
  type: MediaType,
  id: string,
  title: string,
  subtitle: string | null,
  release: string,
  status: LibraryStatus,
  rating: number | null,
  daysAgo: number,
  review?: string,
];

const SEEDS: Seed[] = [
  ["tv", "100088", "The Last of Us", "HBO", "2023-01-15", "in_progress", 4.5, 2],
  ["book", "OL20941574W", "Project Hail Mary", "Andy Weir", "2021-05-04", "in_progress", null, 5],
  ["game", "983210", "Clair Obscur: Expedition 33", "Sandfall Interactive", "2025-04-24", "in_progress", 5, 8],
  ["tv", "95396", "Severance", "Apple TV+", "2022-02-18", "in_progress", 5, 12],
  ["movie", "693134", "Dune: Part Two", "Denis Villeneuve", "2024-02-27", "completed", 5, 20,
    "Enormous in every sense. The Harkonnen arena sequence in black-and-white sunlight is one of the most striking things I've seen in a theater."],
  ["movie", "872585", "Oppenheimer", "Christopher Nolan", "2023-07-19", "completed", 4.5, 34,
    "Three hours that felt like ninety minutes. The Trinity test sequence and the silence afterwards stayed with me for days."],
  ["book", "OL17930368W", "Tomorrow, and Tomorrow, and Tomorrow", "Gabrielle Zevin", "2022-07-05", "completed", 4.5, 40,
    "A book about games that's really about friendship and time. Sadie and Sam will live in my head for a while."],
  ["game", "326243", "Elden Ring", "FromSoftware", "2022-02-25", "completed", 5, 60,
    "The moment you step out into Limgrave for the first time is peak open-world design. Took me 140 hours and I'd do it again."],
  ["tv", "136315", "The Bear", "FX", "2022-06-23", "completed", 4, 70],
  ["movie", "792307", "Poor Things", "Yorgos Lanthimos", "2023-12-07", "completed", 4, 90],
  ["book", "OL27448W", "The Lord of the Rings", "J.R.R. Tolkien", "1954-07-29", "completed", 5, 120],
  ["game", "452638", "Baldur's Gate 3", "Larian Studios", "2023-08-03", "dropped", 3.5, 100,
    "Incredible, but I lost the thread somewhere in Act 2. Want to come back to it someday."],
  ["movie", "1064213", "Anora", "Sean Baker", "2024-10-14", "backlog", null, 3],
  ["movie", "1000837", "Sinners", "Ryan Coogler", "2025-04-16", "backlog", null, 6],
  ["movie", "933260", "The Substance", "Coralie Fargeat", "2024-09-07", "backlog", null, 15],
  ["tv", "124364", "From", "MGM+", "2022-02-20", "backlog", null, 9],
  ["tv", "76331", "Succession", "HBO", "2018-06-03", "backlog", null, 25],
  ["book", "OL24365582W", "Babel", "R.F. Kuang", "2022-08-23", "backlog", null, 4],
  ["book", "OL5735363W", "Piranesi", "Susanna Clarke", "2020-09-15", "backlog", null, 18],
  ["book", "OL893415W", "Dune", "Frank Herbert", "1965-08-01", "backlog", null, 30],
  ["game", "58175", "God of War", "Santa Monica Studio", "2018-04-20", "backlog", null, 7],
  ["game", "274755", "Hades", "Supergiant Games", "2020-09-17", "backlog", null, 22],
  ["game", "257201", "Hollow Knight: Silksong", "Team Cherry", "2025-09-04", "backlog", null, 1],
  ["movie", "157336", "Interstellar", "Christopher Nolan", "2014-11-05", "completed", 5, 200],
  ["tv", "87108", "Chernobyl", "HBO", "2019-05-06", "completed", 5, 260],
];

const DAY = 86_400_000;
// Fixed reference date keeps server and client renders identical.
const NOW = Date.UTC(2026, 8, 28, 20);

export const DEMO_LIBRARY: LibraryItem[] = SEEDS.map(
  ([type, id, title, subtitle, release, status, rating, daysAgo, review], i) => {
    const created = new Date(NOW - daysAgo * DAY - i * 3600_000).toISOString();
    const finished = status === "completed" || status === "dropped" ? new Date(NOW - (daysAgo - 1) * DAY).toISOString() : null;
    return {
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      mediaType: type,
      externalId: id,
      title,
      subtitle,
      artworkUrl: null,
      backdropUrl: null,
      releaseDate: release,
      status,
      rating,
      review: review ?? null,
      reviewedAt: review ? finished : null,
      dateStarted: status === "backlog" ? null : created,
      dateFinished: status === "completed" ? finished : null,
      progress: null,
      metadata: {},
      createdAt: created,
      updatedAt: created,
    };
  },
);
