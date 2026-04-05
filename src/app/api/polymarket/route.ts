import type { NextRequest } from "next/server";

const POLYMARKET_API = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomePrices: string; // JSON stringified array like "[0.65, 0.35]"
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  clobTokenIds: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit") ?? "20";

  try {
    // Use Gamma API for event/market discovery (more user-friendly)
    const res = await fetch(
      `${GAMMA_API}/events?limit=${limit}&active=true&closed=false&order=volume24hr&ascending=false`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      // Fallback: try CLOB markets endpoint
      const clobRes = await fetch(`${POLYMARKET_API}/markets?limit=${limit}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      });
      if (!clobRes.ok) {
        return Response.json(
          { error: `Polymarket API: ${clobRes.status}` },
          { status: 502 }
        );
      }
      const clobData = await clobRes.json();
      return Response.json({ events: [], markets: clobData });
    }

    const events = await res.json();
    return Response.json({ events: events ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
