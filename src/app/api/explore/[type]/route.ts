import { NextResponse, type NextRequest } from "next/server";
import { parseExplore } from "@/lib/discover/taxonomy";
import { explore } from "@/lib/providers/explore";
import { isMediaType } from "@/lib/media/types";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isMediaType(type)) return NextResponse.json({ error: "unknown type" }, { status: 404 });
  const q = parseExplore(type, Object.fromEntries(request.nextUrl.searchParams));
  const user = await getUser();
  const result = await explore(q, user?.services ?? []);
  return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=300" } });
}
