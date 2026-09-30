import "server-only";
import type { AuthorProfile, MediaDetail, MediaFact, MediaSearchResult } from "@/lib/media/types";
import { cleanDescription, formatDate, normalizeDate } from "@/lib/media/format";
import { ProviderError, fetchJson, safely } from "./http";

/**
 * Hardcover adapter — books (GraphQL). Requires HARDCOVER_API_TOKEN from
 * hardcover.app/account/api. Must only be called server-side; the API allows ~60 requests/min,
 * so responses are cached generously.
 */

const API = "https://api.hardcover.app/v1/graphql";

function token() {
  const raw = process.env.HARDCOVER_API_TOKEN?.trim();
  if (!raw) throw new ProviderError("hardcover", "not_configured", "HARDCOVER_API_TOKEN is not set");
  // The settings page shows the token with or without the "Bearer " prefix; accept both.
  return raw.replace(/^bearer\s+/i, "");
}

export function isHardcoverConfigured() {
  return Boolean(process.env.HARDCOVER_API_TOKEN?.trim());
}

async function gql<T>(query: string, variables: Record<string, unknown>, revalidate: number): Promise<T> {
  const res = await fetchJson<{ data?: T; errors?: { message: string }[] }>(API, {
    provider: "hardcover",
    method: "POST",
    body: JSON.stringify({ query, variables }),
    revalidate,
    timeoutMs: 9000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      "User-Agent": "Shelf personal media tracker",
    },
  });
  if (res.errors?.length || !res.data) {
    const message = res.errors?.map((e) => e.message).join("; ") ?? "Empty response";
    throw new ProviderError("hardcover", /jwt|auth|token/i.test(message) ? "not_configured" : "unavailable", message);
  }
  return res.data;
}

/* ----------------------------------------------------------------- shapes */

interface HcImage {
  url?: string | null;
}

/** Search documents come from Hardcover's search index; fields are loosely typed. */
interface HcSearchDoc {
  id: string | number;
  title?: string;
  subtitle?: string | null;
  author_names?: string[];
  release_year?: number | null;
  release_date?: string | null;
  image?: HcImage | null;
  pages?: number | null;
  genres?: string[];
  users_count?: number;
}

interface HcContributor {
  author?: { name?: string };
  contribution?: string | null;
}

interface HcBook {
  id: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  release_date?: string | null;
  release_year?: number | null;
  pages?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  users_count?: number | null;
  image?: HcImage | null;
  cached_contributors?: HcContributor[] | null;
  cached_tags?: Record<string, { tag?: string }[]> | null;
  book_series?: { position?: number | null; series?: { id?: number; name?: string } | null }[];
  contributions?: { contribution?: string | null; author?: { id?: number; name?: string } | null }[];
}

/* ---------------------------------------------------------------- mapping */

/** Primary authorship: Hardcover leaves `contribution` empty (or "Author") for the writer. */
const isPrimary = (contribution?: string | null) => !contribution || /^author$/i.test(contribution.trim());

const https = (url?: string | null) => (url && url.startsWith("https://") ? url : null);

function authorsOf(contributors?: HcContributor[] | null) {
  // Primary authors have no contribution label ("Translator", "Illustrator"…).
  const all = contributors ?? [];
  const primary = all.filter((c) => isPrimary(c.contribution));
  return (primary.length ? primary : all).map((c) => c.author?.name).filter((n): n is string => Boolean(n)).slice(0, 3);
}

function genresOf(tags?: HcBook["cached_tags"]) {
  return (tags?.Genre ?? [])
    .map((t) => t.tag)
    .filter((t): t is string => Boolean(t))
    .slice(0, 4);
}

function normalizeDoc(doc: HcSearchDoc): MediaSearchResult | null {
  if (!doc.title || doc.id == null) return null;
  const year = doc.release_year ?? (doc.release_date ? Number(doc.release_date.slice(0, 4)) : null);
  return {
    externalId: String(doc.id),
    type: "book",
    title: doc.title,
    subtitle: doc.author_names?.slice(0, 2).join(", ") || null,
    year: year || null,
    releaseDate: normalizeDate(doc.release_date) ?? (year ? `${year}-01-01` : null),
    artworkUrl: https(doc.image?.url),
    backdropUrl: null,
    description: null,
    metadata: {
      authors: doc.author_names?.slice(0, 3) ?? [],
      pages: doc.pages ?? null,
      genres: doc.genres?.slice(0, 4) ?? [],
    },
  };
}

function normalizeBook(b: HcBook): MediaSearchResult {
  const authors = authorsOf(b.cached_contributors);
  const releaseDate = normalizeDate(b.release_date) ?? (b.release_year ? `${b.release_year}-01-01` : null);
  return {
    externalId: String(b.id),
    type: "book",
    title: b.title,
    subtitle: authors.join(", ") || null,
    year: b.release_year ?? (releaseDate ? Number(releaseDate.slice(0, 4)) : null),
    releaseDate,
    artworkUrl: https(b.image?.url),
    backdropUrl: null,
    description: cleanDescription(b.description),
    metadata: { authors, pages: b.pages ?? null, genres: genresOf(b.cached_tags) },
  };
}

/* ------------------------------------------------------------------ search */

export async function searchBooks(query: string): Promise<MediaSearchResult[]> {
  const data = await gql<{ search?: { results?: { hits?: { document?: HcSearchDoc }[] } | string } }>(
    `query Search($q: String!) {
       search(query: $q, query_type: "Book", per_page: 24, page: 1) { results }
     }`,
    { q: query },
    60 * 60 * 6,
  );
  let results = data.search?.results;
  if (typeof results === "string") results = JSON.parse(results) as { hits?: { document?: HcSearchDoc }[] };
  const docs = (results?.hits ?? []).map((h) => h.document).filter((d): d is HcSearchDoc => Boolean(d));
  const normalized = docs.map(normalizeDoc).filter((r): r is MediaSearchResult => r !== null);
  return [...normalized.filter((r) => r.artworkUrl), ...normalized.filter((r) => !r.artworkUrl)];
}

const LIST_FIELDS = `id title release_date release_year pages image { url } cached_contributors`;

/** Most-shelved books released in the last two years. */
export async function popularBooks(): Promise<MediaSearchResult[]> {
  const since = new Date().getFullYear() - 1;
  const data = await gql<{ books: HcBook[] }>(
    `query Popular($since: Int!) {
       books(where: { release_year: { _gte: $since }, image_id: { _is_null: false } },
             order_by: { users_count: desc }, limit: 24) { ${LIST_FIELDS} }
     }`,
    { since },
    60 * 60 * 12,
  );
  return data.books.map(normalizeBook).filter((b) => b.artworkUrl);
}

/* ------------------------------------------------------------ related */

interface HcRelatedBook extends HcBook {
  users_count?: number | null;
}

const RELATED_FIELDS = `${LIST_FIELDS} users_count`;

/** Hardcover lists some editions as separate books; keep the most-read one per title. */
function dedupeByTitle(books: HcRelatedBook[]) {
  const best = new Map<string, HcRelatedBook>();
  for (const b of books) {
    const key = b.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const cur = best.get(key);
    if (!cur || (b.users_count ?? 0) > (cur.users_count ?? 0)) best.set(key, b);
  }
  return [...best.values()];
}

async function seriesBooks(seriesId: number): Promise<MediaSearchResult[]> {
  const data = await gql<{ book_series: { position?: number | null; book?: HcRelatedBook | null }[] }>(
    `query Series($sid: Int!) {
       book_series(where: { series_id: { _eq: $sid }, position: { _is_null: false } }, order_by: { position: asc }, limit: 80) {
         position book { ${RELATED_FIELDS} }
       }
     }`,
    { sid: seriesId },
    60 * 60 * 24,
  );
  // One book per whole-number position (skip novellas like 1.5), picking the most-read edition.
  const byPosition = new Map<number, HcRelatedBook>();
  for (const entry of data.book_series) {
    const pos = entry.position;
    const book = entry.book;
    if (pos == null || !Number.isInteger(pos) || pos < 1 || !book?.image?.url) continue;
    const cur = byPosition.get(pos);
    if (!cur || (book.users_count ?? 0) > (cur.users_count ?? 0)) byPosition.set(pos, book);
  }
  return [...byPosition.entries()]
    .sort(([a], [b]) => a - b)
    .map(([pos, book]) => {
      const r = normalizeBook(book);
      return { ...r, metadata: { ...r.metadata, badge: `Book ${pos}` } };
    });
}

async function authorBooks(authorId: number, exclude: number[]): Promise<MediaSearchResult[]> {
  const data = await gql<{ books: HcRelatedBook[] }>(
    `query ByAuthor($aid: Int!, $exclude: [Int!]) {
       books(where: { contributions: { author_id: { _eq: $aid } }, id: { _nin: $exclude }, image_id: { _is_null: false } },
             order_by: { users_count: desc }, limit: 30) { ${RELATED_FIELDS} }
     }`,
    { aid: authorId, exclude },
    60 * 60 * 24,
  );
  return dedupeByTitle(data.books).map(normalizeBook).slice(0, 20);
}

async function similarBooks(genres: string[], exclude: number[]): Promise<MediaSearchResult[]> {
  if (!genres.length) return [];
  // Require the top two genres when available so "Fantasy + Romance" doesn't return any fantasy.
  const tags = genres.slice(0, 2).map((g) => `{ cached_tags: { _contains: { Genre: [{ tag: ${JSON.stringify(g)} }] } } }`);
  const data = await gql<{ books: HcRelatedBook[] }>(
    `query Similar($exclude: [Int!], $since: Int!) {
       books(where: { _and: [${tags.join(", ")}], id: { _nin: $exclude }, image_id: { _is_null: false },
                      release_year: { _gte: $since } },
             order_by: { users_count: desc }, limit: 40) { ${RELATED_FIELDS} }
     }`,
    { exclude, since: new Date().getFullYear() - 25 },
    60 * 60 * 24,
  );
  return dedupeByTitle(data.books).map(normalizeBook);
}

function seriesTitle(name: string | null) {
  if (!name) return "In This Series";
  const bare = name.replace(/^the\s+/i, "");
  return /\b(series|saga|trilogy|chronicles|cycle|archive)\b/i.test(bare) ? `The ${bare}` : `The ${bare} Series`;
}

/** Series, author and genre rows for a book page. Each is optional and fails independently. */
async function relatedFor(
  book: HcBook,
  ctx: { seriesId: number | null; seriesName: string | null; author: { id: number; name: string } | null; genres: string[]; authorNames: string[] },
) {
  const [series, byAuthor, similar] = await Promise.all([
    ctx.seriesId ? safely(() => seriesBooks(ctx.seriesId!), []) : Promise.resolve([]),
    ctx.author ? safely(() => authorBooks(ctx.author!.id, [book.id]), []) : Promise.resolve([]),
    safely(() => similarBooks(ctx.genres, [book.id]), []),
  ]);

  // Don't repeat a book across rows: series first, then author, then similar.
  const seen = new Set<string>([String(book.id)]);
  const take = (list: MediaSearchResult[], keepCurrent = false) =>
    list.filter((b) => {
      if (keepCurrent && b.externalId === String(book.id)) return true;
      if (seen.has(b.externalId)) return false;
      seen.add(b.externalId);
      return true;
    });

  const seriesRow = take(series, true);
  const authorRow = take(byAuthor);
  const authorSet = new Set(ctx.authorNames.map((n) => n.toLowerCase()));
  const similarRow = take(similar.filter((b) => !(b.metadata?.authors as string[] | undefined)?.some((a) => authorSet.has(a.toLowerCase())))).slice(0, 20);

  return [
    { title: seriesTitle(ctx.seriesName), items: seriesRow },
    {
      title: `More by ${ctx.author?.name ?? ctx.authorNames[0] ?? "This Author"}`,
      items: authorRow,
      href: ctx.author ? `/author/${ctx.author.id}` : undefined,
    },
    { title: "You Might Also Like", items: similarRow },
  ].filter((r) => r.items.length >= 2);
}

/* ------------------------------------------------------------------ detail */

export async function getBook(id: string): Promise<MediaDetail> {
  if (!/^\d+$/.test(id)) throw new ProviderError("hardcover", "not_found");
  const day = 60 * 60 * 24;
  const [data, editions] = await Promise.all([
    gql<{ books: HcBook[] }>(
      `query Book($id: Int!) {
         books(where: { id: { _eq: $id } }, limit: 1) {
           id title subtitle description release_date release_year pages rating ratings_count users_count
           image { url } cached_contributors cached_tags
           book_series { position series { id name } }
           contributions { contribution author { id name } }
         }
       }`,
      { id: Number(id) },
      day,
    ),
    // Kept separate so a schema hiccup here never breaks the page.
    safely(
      () =>
        gql<{ editions: { isbn_13?: string | null; isbn_10?: string | null; pages?: number | null; publisher?: { name?: string } | null }[] }>(
          `query Editions($id: Int!) {
             editions(where: { book_id: { _eq: $id } }, order_by: { users_count: desc }, limit: 10) {
               isbn_13 isbn_10 pages publisher { name }
             }
           }`,
          { id: Number(id) },
          day,
        ),
      { editions: [] },
    ),
  ]);

  const b = data.books[0];
  if (!b) throw new ProviderError("hardcover", "not_found");

  const base = normalizeBook(b);
  const authors = authorsOf(b.cached_contributors);
  const genres = genresOf(b.cached_tags);
  const editionList = editions.editions ?? [];
  const edition = editionList.find((e) => e.isbn_13 || e.isbn_10);
  const isbn = edition?.isbn_13 ?? edition?.isbn_10 ?? null;
  const pages = b.pages ?? editionList.find((e) => e.pages)?.pages ?? null;
  const series = b.book_series?.find((s) => s.series?.name);
  const seriesLabel = series
    ? `${series.series!.name}${series.position ? ` · Book ${Number.isInteger(series.position) ? series.position : series.position.toFixed(1)}` : ""}`
    : null;

  const facts: MediaFact[] = [
    ["Author", authors.join(", ")],
    ["Series", seriesLabel],
    ["Published", formatDate(base.releaseDate) ?? (base.year ? String(base.year) : null)],
    ["Pages", pages ? String(pages) : null],
    ["ISBN", isbn],
    ["Publisher", edition?.publisher?.name ?? null],
  ]
    .filter((f): f is [string, string] => Boolean(f[1]))
    .map(([label, value]) => ({ label, value }));

  const primaryAuthor = b.contributions?.find((c) => isPrimary(c.contribution) && c.author?.id)?.author ?? null;
  const relatedRows = await relatedFor(b, {
    seriesId: series?.series?.id ?? null,
    seriesName: series?.series?.name ?? null,
    author: primaryAuthor?.id ? { id: primaryAuthor.id, name: primaryAuthor.name ?? authors[0] ?? "the Author" } : null,
    genres,
    authorNames: authors,
  });

  return {
    ...base,
    subtitle: authors.join(", ") || null,
    genres,
    relatedRows,
    creators: (b.contributions ?? [])
      .filter((c) => isPrimary(c.contribution) && c.author?.id && c.author.name)
      .slice(0, 3)
      .map((c) => ({ name: c.author!.name!, href: `/author/${c.author!.id}` })),
    highlights: [base.year ? String(base.year) : null, pages ? `${pages} pages` : null, seriesLabel].filter(Boolean) as string[],
    facts,
    score:
      b.rating && (b.ratings_count ?? 0) >= 5 ? { value: Math.round(b.rating * 10) / 10, max: 5, source: "Hardcover" } : null,
    metadata: { authors, pages, isbn, genres },
  };
}

/* ------------------------------------------------------------- books hub */

export interface BooksHub {
  newReleases: MediaSearchResult[];
  anticipated: MediaSearchResult[];
  topThisYear: MediaSearchResult[];
  allTime: MediaSearchResult[];
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Most of the Books tab in one GraphQL request (aliases), cached for hours. */
export async function booksHub(): Promise<BooksHub> {
  const now = new Date();
  const today = isoDay(now);
  const since = isoDay(new Date(now.getTime() - 75 * 86_400_000));
  const year = now.getFullYear();
  const fields = `${LIST_FIELDS} description`;
  const data = await gql<Record<keyof BooksHub, HcBook[]>>(
    `query Hub($today: date!, $since: date!, $year: Int!) {
       newReleases: books(
         where: { release_date: { _gte: $since, _lte: $today }, image_id: { _is_null: false } },
         order_by: { users_count: desc }, limit: 24) { ${fields} }
       anticipated: books(
         where: { release_date: { _gt: $today }, image_id: { _is_null: false } },
         order_by: { users_count: desc }, limit: 24) { ${fields} }
       topThisYear: books(
         where: { release_year: { _gte: $year }, ratings_count: { _gte: 25 }, image_id: { _is_null: false } },
         order_by: { rating: desc }, limit: 20) { ${fields} }
       allTime: books(
         where: { image_id: { _is_null: false } },
         order_by: { users_count: desc }, limit: 24) { ${fields} }
     }`,
    { today, since, year: year - (now.getMonth() < 3 ? 1 : 0) },
    60 * 60 * 6,
  );
  const map = (list?: HcBook[]) => (list ?? []).map(normalizeBook).filter((b) => b.artworkUrl);
  return {
    newReleases: map(data.newReleases),
    anticipated: map(data.anticipated).sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "")),
    topThisYear: map(data.topThisYear),
    allTime: map(data.allTime),
  };
}

/** What people are reading: Hardcover's trending books for the last month. */
export async function trendingBooks(): Promise<MediaSearchResult[]> {
  const now = new Date();
  const from = isoDay(new Date(now.getTime() - 30 * 86_400_000));
  const trending = await gql<{ books_trending?: { ids?: number[] } }>(
    `query Trending($from: date!, $to: date!) {
       books_trending(from: $from, to: $to, limit: 24, offset: 0) { ids }
     }`,
    { from, to: isoDay(now) },
    60 * 60 * 6,
  );
  const ids = trending.books_trending?.ids ?? [];
  if (!ids.length) return [];
  const data = await gql<{ books: HcBook[] }>(
    `query ByIds($ids: [Int!]) { books(where: { id: { _in: $ids } }) { ${LIST_FIELDS} description } }`,
    { ids },
    60 * 60 * 6,
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  return data.books
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map(normalizeBook)
    .filter((b) => b.artworkUrl);
}

/** Maps an ISBN (e.g. from a bestseller list) to a Hardcover book ID. */
export async function bookIdForIsbn(isbn: string): Promise<string | null> {
  const data = await gql<{ editions: { book_id: number }[] }>(
    `query ByIsbn($isbn: String!) {
       editions(where: { _or: [{ isbn_13: { _eq: $isbn } }, { isbn_10: { _eq: $isbn } }] }, limit: 1) { book_id }
     }`,
    { isbn },
    60 * 60 * 24 * 7,
  );
  const id = data.editions[0]?.book_id;
  return id ? String(id) : null;
}

/* ----------------------------------------------------------- genre rows */

export const BOOK_GENRES = {
  fantasy: ["Fantasy"],
  scifi: ["Science Fiction", "Science fiction"],
  thriller: ["Thriller", "Mystery", "Mystery & Thriller"],
  romance: ["Romance"],
} as const;
export type BookGenre = keyof typeof BOOK_GENRES;

/**
 * Most-shelved books from the last few years in each genre (one request, aliased).
 * Filters on Hardcover's cached genre tags so classics with new editions don't crowd the rows.
 */
export async function genreBooks(): Promise<Record<BookGenre, MediaSearchResult[]>> {
  const since = new Date().getFullYear() - 3;
  const where = (tags: readonly string[]) =>
    `{ release_year: { _gte: $since }, image_id: { _is_null: false },
       _or: [${tags.map((t) => `{ cached_tags: { _contains: { Genre: [{ tag: ${JSON.stringify(t)} }] } } }`).join(", ")}] }`;
  const fields = Object.entries(BOOK_GENRES)
    .map(([key, tags]) => `${key}: books(where: ${where(tags)}, order_by: { users_count: desc }, limit: 24) { ${LIST_FIELDS} }`)
    .join("\n");
  const data = await gql<Record<BookGenre, HcBook[]>>(`query Genres($since: Int!) { ${fields} }`, { since }, 60 * 60 * 12);
  const map = (list?: HcBook[]) => (list ?? []).map(normalizeBook).filter((b) => b.artworkUrl);
  return { fantasy: map(data.fantasy), scifi: map(data.scifi), thriller: map(data.thriller), romance: map(data.romance) };
}

/* ------------------------------------------------------------ author page */

interface HcAuthorBook extends HcRelatedBook {
  book_series?: { position?: number | null; series?: { id?: number; name?: string } | null }[];
}

async function authorCore(aid: number) {
  const day = 60 * 60 * 24;
  // Try progressively simpler queries so one unsupported filter/field can't break the page.
  const attempts = [
    `authors(where: { id: { _eq: $id } }, limit: 1) { id name }
     books(where: { contributions: { author_id: { _eq: $id } }, image_id: { _is_null: false } },
           order_by: { users_count: desc }, limit: 100) {
       ${RELATED_FIELDS} book_series { position series { id name } } contributions { contribution author { id name } }
     }`,
    `authors(where: { id: { _eq: $id } }, limit: 1) { id name }
     books(where: { contributions: { author_id: { _eq: $id } } }, order_by: { users_count: desc }, limit: 100) { ${RELATED_FIELDS} }`,
  ];
  let lastError: unknown;
  for (const body of attempts) {
    try {
      return await gql<{ authors: { id: number; name: string }[]; books: (HcAuthorBook & { contributions?: HcBook["contributions"] })[] }>(
        `query Author($id: Int!) { ${body} }`,
        { id: aid },
        day,
      );
    } catch (err) {
      lastError = err;
      console.error("[author] Hardcover query failed:", (err as Error).message);
    }
  }
  throw lastError;
}

export async function getAuthor(id: string): Promise<AuthorProfile> {
  if (!/^\d+$/.test(id)) throw new ProviderError("hardcover", "not_found");
  const aid = Number(id);
  const day = 60 * 60 * 24;
  const [core, extra] = await Promise.all([
    authorCore(aid),
    // Optional profile fields in their own request so a schema difference can't break the page.
    safely(
      () =>
        gql<{ authors: { bio?: string | null; born_year?: number | null; death_year?: number | null; image?: HcImage | null }[] }>(
          `query AuthorProfile($id: Int!) { authors(where: { id: { _eq: $id } }, limit: 1) { bio born_year death_year image { url } } }`,
          { id: aid },
          day,
        ),
      { authors: [] },
    ),
  ]);

  // Skip books where this person only translated/narrated/illustrated.
  core.books = core.books.filter(
    (b) => !b.contributions || b.contributions.some((c) => c.author?.id === aid && isPrimary(c.contribution)),
  );
  const nameFromBooks = core.books
    .flatMap((b) => b.contributions ?? [])
    .find((c) => c.author?.id === aid && c.author.name)?.author?.name;
  if (!core.authors[0] && nameFromBooks) core.authors = [{ id: aid, name: nameFromBooks }];
  const author = core.authors[0];
  if (!author) throw new ProviderError("hardcover", "not_found");
  const profile = extra.authors[0] ?? {};

  const books = dedupeByTitle(core.books);
  const popular = books.map(normalizeBook).filter((b) => b.artworkUrl).slice(0, 15);

  // Group into series (whole-number positions, most-read edition per position).
  const series = new Map<number, { name: string; readers: number; byPos: Map<number, HcAuthorBook> }>();
  for (const b of core.books) {
    for (const s of b.book_series ?? []) {
      const pos = s.position;
      if (!s.series?.id || !s.series.name || pos == null || !Number.isInteger(pos) || pos < 1) continue;
      const entry = series.get(s.series.id) ?? { name: s.series.name, readers: 0, byPos: new Map() };
      const cur = entry.byPos.get(pos);
      if (!cur || (b.users_count ?? 0) > (cur.users_count ?? 0)) entry.byPos.set(pos, b);
      entry.readers += b.users_count ?? 0;
      series.set(s.series.id, entry);
    }
  }
  const seriesRows = [...series.values()]
    .filter((s) => s.byPos.size >= 2)
    .sort((a, b) => b.readers - a.readers)
    .slice(0, 6)
    .map((s) => ({
      title: seriesTitle(s.name),
      items: [...s.byPos.entries()]
        .sort(([a], [b]) => a - b)
        .map(([pos, book]) => {
          const r = normalizeBook(book);
          return { ...r, metadata: { ...r.metadata, badge: `Book ${pos}` } };
        }),
    }));

  const all = books
    .map(normalizeBook)
    .filter((b) => b.artworkUrl)
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));

  const born = profile.born_year;
  const died = profile.death_year;
  return {
    id,
    name: author.name,
    bio: cleanDescription(profile.bio),
    photoUrl: https(profile.image?.url),
    lifespan: born ? `${born}–${died ?? ""}` : null,
    bookCount: books.length,
    popular,
    series: seriesRows,
    all,
    source: "Hardcover",
  };
}
