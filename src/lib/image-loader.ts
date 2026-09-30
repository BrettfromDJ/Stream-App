"use client";

/**
 * Maps requested widths onto each provider's own CDN sizes, so artwork is served
 * at the right resolution straight from TMDB / Open Library / IGDB without
 * spending Vercel image-optimization quota.
 */

const TMDB_WIDTHS = [92, 154, 185, 342, 500, 780, 1280];
const IGDB_COVERS: [number, string][] = [
  [90, "t_cover_small"],
  [264, "t_cover_big"],
];
const IGDB_WIDE: [number, string][] = [
  [569, "t_screenshot_med"],
  [889, "t_screenshot_big"],
  [1280, "t_720p"],
];

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  // TMDB: https://image.tmdb.org/t/p/{size}/{file}
  const tmdb = src.match(/^https:\/\/image\.tmdb\.org\/t\/p\/[^/]+(\/.+)$/);
  if (tmdb) {
    const size = TMDB_WIDTHS.find((w) => w >= width);
    return `https://image.tmdb.org/t/p/${size ? `w${size}` : "original"}${tmdb[1]}`;
  }

  // Open Library covers: -M is ~180px wide, -L is the full-size scan.
  const ol = src.match(/^(https:\/\/covers\.openlibrary\.org\/[ab]\/(?:id|isbn|olid)\/[^-]+)-[SML](\.jpg)$/);
  if (ol) return `${ol[1]}-${width <= 180 ? "M" : "L"}${ol[2]}`;

  // IGDB: https://images.igdb.com/igdb/image/upload/t_{size}/{id}.jpg
  const igdb = src.match(/^https:\/\/images\.igdb\.com\/igdb\/image\/upload\/t_([a-z0-9_]+)\/(.+)$/);
  if (igdb) {
    const isCover = igdb[1].startsWith("cover");
    const steps = isCover ? IGDB_COVERS : IGDB_WIDE;
    const size = steps.find(([w]) => w >= width)?.[1] ?? (isCover ? "t_cover_big_2x" : "t_1080p");
    return `https://images.igdb.com/igdb/image/upload/${size}/${igdb[2]}`;
  }

  return src;
}
