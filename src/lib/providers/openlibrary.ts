import "server-only";
import type { AuthorProfile, MediaDetail, MediaFact, MediaSearchResult } from "@/lib/media/types";
import { cleanDescription, normalizeDate, yearFrom } from "@/lib/media/format";
import { ProviderError, fetchJson, safely } from "./http";

/**
 * Open Library adapter — books. No API key required.
 * Open Library asks clients to send an identifying User-Agent.
 */

const API = "https://openlibrary.org";
const USER_AGENT = `Shelf/1.0 (personal media tracker${process.env.OPENLIBRARY_CONTACT ? `; ${process.env.OPENLIBRARY_CONTACT}` : ""})`;
const headers = { "User-Agent": USER_AGENT };

export const coverUrl = (coverId?: number | null) =>
  coverId && coverId > 0 ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;

interface OlSearchDoc {
  key: string; // "/works/OL45804W"
  title: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  subject?: string[];
}

interface OlWork {
  key: string;
  title: string;
  subtitle?: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author?: { key: string } }[];
}

interface OlEdition {
  number_of_pages?: number;
  isbn_13?: string[];
  isbn_10?: string[];
  publish_date?: string;
  publishers?: string[];
  covers?: number[];
  languages?: { key: string }[];
}

const workId = (key: string) => key.replace(/^\/works\//, "");

function cleanSubjects(subjects: string[] | undefined, max = 4) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of subjects ?? []) {
    const s = raw.replace(/\s*\(.*?\)\s*/g, "").trim();
    if (!s || s.length > 28 || /[=:/]|fiction, |nyt:|accessible|protected|lending|in library|open_syllabus/i.test(s)) continue;
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    const k = label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(label);
    if (out.length >= max) break;
  }
  return out;
}

function normalizeDoc(doc: OlSearchDoc): MediaSearchResult {
  const year = doc.first_publish_year ?? null;
  return {
    externalId: workId(doc.key),
    type: "book",
    title: doc.title,
    subtitle: doc.author_name?.slice(0, 2).join(", ") ?? null,
    year,
    releaseDate: year ? `${year}-01-01` : null,
    artworkUrl: coverUrl(doc.cover_i),
    backdropUrl: null,
    description: null,
    metadata: {
      authors: doc.author_name?.slice(0, 3) ?? [],
      pages: doc.number_of_pages_median ?? null,
    },
  };
}

const SEARCH_FIELDS = "key,title,subtitle,author_name,first_publish_year,cover_i,number_of_pages_median";

export async function searchBooks(query: string, limit = 20): Promise<MediaSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit), fields: SEARCH_FIELDS });
  const data = await fetchJson<{ docs: OlSearchDoc[] }>(`${API}/search.json?${params}`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 6,
    headers,
    timeoutMs: 9000,
  });
  // Covers make the UI; keep relevance order but float cover-less works to the end.
  const results = data.docs.map(normalizeDoc);
  return [...results.filter((r) => r.artworkUrl), ...results.filter((r) => !r.artworkUrl)];
}

export async function trendingBooks(): Promise<MediaSearchResult[]> {
  const data = await fetchJson<{ works: OlSearchDoc[] }>(`${API}/trending/weekly.json?limit=30`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 12,
    headers,
    timeoutMs: 10000,
  });
  return data.works.filter((w) => w.cover_i).map(normalizeDoc).slice(0, 20);
}

/** The author's most-read other works. */
async function moreByAuthor(authorId: string, excludeWorkId: string): Promise<MediaSearchResult[]> {
  const params = new URLSearchParams({ author_key: authorId, sort: "readinglog", limit: "30", fields: SEARCH_FIELDS });
  const data = await fetchJson<{ docs: OlSearchDoc[] }>(`${API}/search.json?${params}`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 24,
    headers,
    timeoutMs: 9000,
  });
  return data.docs
    .map(normalizeDoc)
    .filter((b) => b.artworkUrl && b.externalId !== excludeWorkId)
    .slice(0, 20);
}

export async function getBook(id: string): Promise<MediaDetail> {
  if (!/^OL\d+W$/i.test(id)) throw new ProviderError("openlibrary", "not_found");
  const opts = { provider: "openlibrary" as const, revalidate: 60 * 60 * 24, headers, timeoutMs: 9000 };

  const [work, editions, ratings] = await Promise.all([
    fetchJson<OlWork>(`${API}/works/${id}.json`, opts),
    safely(() => fetchJson<{ entries: OlEdition[] }>(`${API}/works/${id}/editions.json?limit=40`, opts), { entries: [] }),
    safely(
      () => fetchJson<{ summary?: { average?: number; count?: number } }>(`${API}/works/${id}/ratings.json`, opts),
      {},
    ),
  ]);

  const authorKeys = (work.authors ?? [])
    .map((a) => a.author?.key)
    .filter((k): k is string => Boolean(k))
    .slice(0, 3);
  const [authorDocs, byAuthor] = await Promise.all([
    Promise.all(authorKeys.map((key) => safely(() => fetchJson<{ name?: string }>(`${API}${key}.json`, opts), {}))),
    authorKeys[0] ? safely(() => moreByAuthor(authorKeys[0].replace("/authors/", ""), id), []) : Promise.resolve([]),
  ]);
  const authors = authorDocs.map((a) => a.name).filter((n): n is string => Boolean(n));

  // Prefer an English edition that has both page count and ISBN.
  const entries = editions.entries ?? [];
  const isEnglish = (e: OlEdition) => !e.languages || e.languages.some((l) => l.key === "/languages/eng");
  const best =
    entries.find((e) => isEnglish(e) && e.number_of_pages && (e.isbn_13?.length || e.isbn_10?.length)) ??
    entries.find((e) => e.number_of_pages) ??
    entries[0];
  const pages = best?.number_of_pages ?? null;
  const isbn = best?.isbn_13?.[0] ?? best?.isbn_10?.[0] ?? entries.find((e) => e.isbn_13?.length)?.isbn_13?.[0] ?? null;

  const firstPublished =
    normalizeDate(work.first_publish_date) ??
    entries
      .map((e) => normalizeDate(e.publish_date))
      .filter((d): d is string => Boolean(d))
      .sort()[0] ??
    null;
  const year = yearFrom(firstPublished);
  const cover = coverUrl(work.covers?.find((c) => c > 0)) ?? coverUrl(best?.covers?.find((c) => c > 0));
  const description = cleanDescription(typeof work.description === "string" ? work.description : work.description?.value);
  const genres = cleanSubjects(work.subjects);

  const facts: MediaFact[] = [
    ["Author", authors.join(", ")],
    ["First published", year ? String(year) : null],
    ["Pages", pages ? String(pages) : null],
    ["ISBN", isbn],
    ["Publisher", best?.publishers?.[0] ?? null],
    ["Editions", entries.length >= 40 ? "40+" : entries.length ? String(entries.length) : null],
  ]
    .filter((f): f is [string, string] => Boolean(f[1]))
    .map(([label, value]) => ({ label, value }));

  const avg = ratings.summary?.average;
  return {
    externalId: id,
    type: "book",
    title: work.title,
    subtitle: authors.length ? authors.join(", ") : null,
    year,
    releaseDate: firstPublished,
    artworkUrl: cover,
    backdropUrl: null,
    description,
    genres,
    highlights: [year ? String(year) : null, pages ? `${pages} pages` : null].filter(Boolean) as string[],
    facts,
    score: avg && (ratings.summary?.count ?? 0) >= 5 ? { value: Math.round(avg * 10) / 10, max: 5, source: "Open Library" } : null,
    relatedRows:
      byAuthor.length >= 2
        ? [{ title: `More by ${authors[0] ?? "This Author"}`, items: byAuthor, href: `/author/${authorKeys[0].replace("/authors/", "")}` }]
        : [],
    creators: authorDocs
      .map((a, i) => (a.name ? { name: a.name, href: `/author/${authorKeys[i].replace("/authors/", "")}` } : null))
      .filter((c): c is { name: string; href: string } => c !== null),
    metadata: { authors, pages, isbn, genres },
  };
}

/* ------------------------------------------------------------- browse */

export async function trendingToday(): Promise<MediaSearchResult[]> {
  const data = await fetchJson<{ works: OlSearchDoc[] }>(`${API}/trending/daily.json?limit=30`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 3,
    headers,
    timeoutMs: 10000,
  });
  return data.works.filter((w) => w.cover_i).map(normalizeDoc).slice(0, 20);
}

/** Maps an ISBN to an Open Library work ID ("OL…W"). */
export async function workIdForIsbn(isbn: string): Promise<string | null> {
  const data = await fetchJson<{ works?: { key: string }[] }>(`${API}/isbn/${encodeURIComponent(isbn)}.json`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 24 * 7,
    headers,
  });
  const key = data.works?.[0]?.key;
  return key ? workId(key) : null;
}

/**
 * Recent, widely-read books in a subject. Filters on *first* publication year (so reprints of
 * classics don't qualify) and sorts by how many readers have shelved them.
 */
export async function recentBooksBySubject(subject: string): Promise<MediaSearchResult[]> {
  const year = new Date().getFullYear();
  const params = new URLSearchParams({
    q: `subject:"${subject}" first_publish_year:[${year - 4} TO ${year}] language:eng`,
    sort: "readinglog",
    limit: "30",
    fields: SEARCH_FIELDS,
  });
  const data = await fetchJson<{ docs: OlSearchDoc[] }>(`${API}/search.json?${params}`, {
    provider: "openlibrary",
    revalidate: 60 * 60 * 12,
    headers,
    timeoutMs: 10000,
  });
  return data.docs.filter((d) => d.cover_i).map(normalizeDoc).slice(0, 20);
}

/* ------------------------------------------------------------ author page */

interface OlAuthor {
  name?: string;
  personal_name?: string;
  bio?: string | { value: string };
  photos?: number[];
  birth_date?: string;
  death_date?: string;
}

export async function getAuthor(id: string): Promise<AuthorProfile> {
  if (!/^OL\d+A$/i.test(id)) throw new ProviderError("openlibrary", "not_found");
  const opts = { provider: "openlibrary" as const, revalidate: 60 * 60 * 24, headers, timeoutMs: 9000 };
  const params = new URLSearchParams({ author_key: id, sort: "readinglog", limit: "80", fields: SEARCH_FIELDS });
  const [author, works] = await Promise.all([
    fetchJson<OlAuthor>(`${API}/authors/${id}.json`, opts),
    safely(() => fetchJson<{ docs: OlSearchDoc[] }>(`${API}/search.json?${params}`, opts), { docs: [] }),
  ]);
  const books = works.docs.map(normalizeDoc).filter((b) => b.artworkUrl);
  const photo = author.photos?.find((p) => p > 0);
  const born = yearFrom(normalizeDate(author.birth_date));
  const died = yearFrom(normalizeDate(author.death_date));
  return {
    id,
    name: author.name ?? author.personal_name ?? "Unknown author",
    bio: cleanDescription(typeof author.bio === "string" ? author.bio : author.bio?.value),
    photoUrl: photo ? `https://covers.openlibrary.org/a/id/${photo}-L.jpg` : null,
    lifespan: born ? `${born}–${died ?? ""}` : null,
    bookCount: books.length,
    popular: books.slice(0, 15),
    series: [],
    all: [...books].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "")),
    source: "Open Library",
  };
}
