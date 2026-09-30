import { NextResponse, type NextRequest } from "next/server";
import { picks } from "@/lib/discover/picks";
import { isMediaType, type MediaType } from "@/lib/media/types";

/** Random, taste-aware picks for Surprise Me and Swipe to Discover. */
export async function GET(request: NextRequest) {
  const types = (request.nextUrl.searchParams.get("types") ?? "movie")
    .split(",")
    .filter(isMediaType)
    .slice(0, 4) as MediaType[];
  const count = Math.min(40, Math.max(1, Number(request.nextUrl.searchParams.get("count")) || 20));
  const items = await picks(types.length ? types : ["movie"], { count, random: true });
  return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
}
