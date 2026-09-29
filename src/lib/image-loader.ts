"use client";

/**
 * Maps requested widths onto each provider's own CDN sizes, so artwork is served
 * at the right resolution straight from TMDB / Open Library / RAWG without
 * spending Vercel image-optimization quota.
 */

const TMDB_WIDTHS = [92, 154, 185, 342, 500, 780, 1280];
const RAWG_WIDTHS = [420, 640, 1280];

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  // TMDB: https://image.tmdb.org/t/p/{size}/{file}
  const tmdb = src.match(/^https:\/\/image\.tmdb\.org\/t\/p\/[^/]+(\/.+)$/);
  if (tmdb) {
    const size = TMDB_WIDTHS.find((w) => w >= width);
    return `https://image.tmdb.org/t/p/${size ? `w${size}` : "original"}${tmdb[1]}`;
  }

  // Open Library covers: -M is ~180px wide, -L is the full-size scan.
  const ol = src.match(/^(https:\/\/covers\.openlibrary\.org\/b\/(?:id|isbn|olid)\/[^-]+)-[SML](\.jpg)$/);
  if (ol) return `${ol[1]}-${width <= 180 ? "M" : "L"}${ol[2]}`;

  // RAWG: https://media.rawg.io/media/games/... → /media/resize/{w}/-/games/...
  const rawg = src.match(/^https:\/\/media\.rawg\.io\/media\/(?!resize|crop)(.+)$/);
  if (rawg) {
    const size = RAWG_WIDTHS.find((w) => w >= width);
    return size ? `https://media.rawg.io/media/resize/${size}/-/${rawg[1]}` : src;
  }

  return src;
}
