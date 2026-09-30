import { NextResponse } from "next/server";
import { getSeason } from "@/lib/providers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  try {
    const season = await getSeason(id, Number.parseInt(n, 10));
    return NextResponse.json(season, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
