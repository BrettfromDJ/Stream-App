import { NextResponse, type NextRequest } from "next/server";
import { isMediaType } from "@/lib/media/types";
import { ProviderError } from "@/lib/providers/http";
import { isAiConfigured } from "@/lib/ai/openai";
import { aiSearch } from "@/lib/ai/search";

/** "Find me a book about…" — AI suggestions resolved to real catalog entries. */
export async function GET(request: NextRequest) {
  if (!isAiConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 404 });
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 200);
  const typeParam = params.get("type");
  const type = isMediaType(typeParam) ? typeParam : "all";
  if (q.length < 3) return NextResponse.json({ error: "too_short" }, { status: 400 });

  try {
    const data = await aiSearch(q, type);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch (err) {
    const kind = err instanceof ProviderError ? err.kind : "unavailable";
    console.error("[ai-search]", (err as Error).message);
    return NextResponse.json({ error: kind }, { status: kind === "rate_limited" ? 429 : 502 });
  }
}
