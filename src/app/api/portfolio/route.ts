import type { NextRequest } from "next/server";

const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { apiKeyId, apiKeySecret, action } = body as {
    apiKeyId: string;
    apiKeySecret: string;
    action: "balance" | "positions" | "trades";
  };

  if (!apiKeyId || !apiKeySecret) {
    return Response.json(
      { error: "API key ID and secret are required" },
      { status: 400 }
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Kalshi uses email/password login to get a token, or API key auth
  // For demo purposes, we pass credentials as basic auth style
  headers["Authorization"] = `Basic ${btoa(`${apiKeyId}:${apiKeySecret}`)}`;

  try {
    let endpoint: string;
    switch (action) {
      case "balance":
        endpoint = "/portfolio/balance";
        break;
      case "positions":
        endpoint = "/portfolio/positions";
        break;
      case "trades":
        endpoint = "/portfolio/fills?limit=100";
        break;
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await fetch(`${KALSHI_API_BASE}${endpoint}`, { headers });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `Kalshi API: ${res.status} - ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
