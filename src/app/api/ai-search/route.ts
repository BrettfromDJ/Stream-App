import { NextResponse, type NextRequest } from "next/server";
import { isMediaType } from "@/lib/media/types";
import { ProviderError } from "@/lib/providers/http";
import { isAiConfigured } from "@/lib/ai/openai";
import { aiSearch } from "@/lib/ai/search";

// Model call + catalog lookups; give it room on Vercel (the default limit can be as low as 10s).
export const maxDuration = 60;

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
    const detail = (err as Error).message;
    console.error("[ai-search]", detail);
    // The detail is OpenAI's own explanation (quota, model access…) — shown to the signed-in owner to fix setup.
    return NextResponse.json({ error: kind, detail }, { status: kind === "rate_limited" ? 429 : 502 });
  }
}
