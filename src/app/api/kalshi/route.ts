import { fetchKalshiMarkets } from "@/lib/kalshi";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get("limit") ?? "40");
  const cursor = searchParams.get("cursor") ?? undefined;
  const status = searchParams.get("status") ?? "open";

  try {
    const data = await fetchKalshiMarkets({ limit, cursor, status });
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
