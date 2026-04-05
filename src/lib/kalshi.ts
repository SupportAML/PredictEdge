const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  close_time: string;
  result: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  markets: KalshiMarket[];
}

export async function fetchKalshiMarkets(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  category?: string;
}): Promise<{ markets: KalshiMarket[]; cursor: string | null }> {
  const url = new URL(`${KALSHI_API_BASE}/markets`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.status) url.searchParams.set("status", params.status);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    markets: data.markets ?? [],
    cursor: data.cursor ?? null,
  };
}

export async function fetchKalshiEvents(params?: {
  limit?: number;
  cursor?: string;
  status?: string;
  category?: string;
}): Promise<{ events: KalshiEvent[]; cursor: string | null }> {
  const url = new URL(`${KALSHI_API_BASE}/events`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.category) url.searchParams.set("category", params.category);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    events: data.events ?? [],
    cursor: data.cursor ?? null,
  };
}

export function formatCents(cents: number): string {
  return `${cents}\u00a2`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return String(vol);
}
