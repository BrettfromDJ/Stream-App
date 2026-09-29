import { NextResponse, type NextRequest } from "next/server";
import { searchAll, type SearchFilter } from "@/lib/providers";
import { isMediaType } from "@/lib/media/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const typeParam = params.get("type");
  const type: SearchFilter = isMediaType(typeParam) ? typeParam : "all";

  if (q.length < 2) {
    return NextResponse.json({ results: { movie: [], tv: [], book: [], game: [] }, unavailable: [] });
  }

  const data = await searchAll(q, type);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
