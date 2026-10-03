import "server-only";
import type { ExternalScore } from "@/lib/media/types";
import { ProviderError, fetchJson } from "./http";

/**
 * OMDb (omdbapi.com): Rotten Tomatoes, IMDb and Metacritic scores plus awards, by IMDb ID.
 * Free key (1,000 requests/day) in OMDB_API_KEY; without it this quietly does nothing.
 */

interface OmdbResponse {
  Response?: "True" | "False";
  Ratings?: { Source: string; Value: string }[];
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Awards?: string;
}

export function isOmdbConfigured() {
  return Boolean(process.env.OMDB_API_KEY?.trim());
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export async function omdbScores(imdbId: string): Promise<{ scores: ExternalScore[]; awards: string | null }> {
  const key = process.env.OMDB_API_KEY?.trim();
  if (!key) throw new ProviderError("omdb", "not_configured");
  if (!/^tt\d+$/.test(imdbId)) return { scores: [], awards: null };
  const data = await fetchJson<OmdbResponse>(`https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&i=${imdbId}&tomatoes=true`, {
    provider: "omdb",
    revalidate: 60 * 60 * 24,
    timeoutMs: 6000,
  });
  if (data.Response !== "True") return { scores: [], awards: null };

  const scores: ExternalScore[] = [];
  const rt = data.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;
  if (rt && /^\d+%$/.test(rt)) scores.push({ source: "Rotten Tomatoes", value: rt, percent: Number.parseInt(rt, 10) });

  const imdb = Number.parseFloat(data.imdbRating ?? "");
  if (Number.isFinite(imdb)) {
    const votes = Number((data.imdbVotes ?? "").replace(/,/g, ""));
    scores.push({
      source: "IMDb",
      value: imdb.toFixed(1),
      percent: imdb * 10,
      url: `https://www.imdb.com/title/${imdbId}/`,
      note: Number.isFinite(votes) && votes > 0 ? `${compact.format(votes)} votes` : null,
    });
  }

  const meta = Number.parseInt(data.Metascore ?? "", 10);
  if (Number.isFinite(meta)) scores.push({ source: "Metacritic", value: String(meta), percent: meta });

  const awards = data.Awards && data.Awards !== "N/A" ? data.Awards.replace(/\s+/g, " ").trim() : null;
  return { scores, awards };
}
