"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftRight,
  Search,
  TrendingUp,
  Zap,
  ExternalLink,
} from "lucide-react";
import type { KalshiMarket } from "@/lib/kalshi";
import { formatVolume } from "@/lib/kalshi";

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: {
    id: string;
    question: string;
    outcomePrices: string;
    volume: number;
    liquidity: number;
    active: boolean;
    closed: boolean;
  }[];
}

interface ComparisonRow {
  topic: string;
  kalshiTicker: string | null;
  kalshiPrice: number | null;
  kalshiVolume: number | null;
  polymarketId: string | null;
  polymarketPrice: number | null;
  polymarketVolume: number | null;
  spread: number | null;
}

export default function ComparePage() {
  const [kalshiMarkets, setKalshiMarkets] = useState<KalshiMarket[]>([]);
  const [polyEvents, setPolyEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [kalshiRes, polyRes] = await Promise.all([
          fetch("/api/kalshi?limit=100&status=open"),
          fetch("/api/polymarket?limit=50"),
        ]);

        if (kalshiRes.ok) {
          const kData = await kalshiRes.json();
          setKalshiMarkets(kData.markets ?? []);
        }

        if (polyRes.ok) {
          const pData = await polyRes.json();
          setPolyEvents(pData.events ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Build comparison rows by fuzzy matching market titles
  const comparisons: ComparisonRow[] = [];
  const matchedPolyIds = new Set<string>();

  for (const km of kalshiMarkets) {
    const kalshiWords = km.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let bestMatch: {
      event: PolymarketEvent;
      market: PolymarketEvent["markets"][0];
      score: number;
    } | null = null;

    for (const event of polyEvents) {
      for (const pm of event.markets) {
        if (matchedPolyIds.has(pm.id)) continue;
        const polyWords = (event.title + " " + pm.question)
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 3);

        const overlap = kalshiWords.filter((w) => polyWords.includes(w)).length;
        const score = overlap / Math.max(kalshiWords.length, 1);

        if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { event, market: pm, score };
        }
      }
    }

    let polyPrice: number | null = null;
    let polyVol: number | null = null;
    let polyId: string | null = null;

    if (bestMatch) {
      matchedPolyIds.add(bestMatch.market.id);
      try {
        const prices = JSON.parse(bestMatch.market.outcomePrices || "[]");
        polyPrice = prices[0] ? Math.round(Number(prices[0]) * 100) : null;
      } catch {
        polyPrice = null;
      }
      polyVol = bestMatch.market.volume ?? null;
      polyId = bestMatch.market.id;
    }

    const spread =
      km.last_price != null && polyPrice != null
        ? Math.abs(km.last_price - polyPrice)
        : null;

    comparisons.push({
      topic: km.title,
      kalshiTicker: km.ticker,
      kalshiPrice: km.last_price,
      kalshiVolume: km.volume_24h,
      polymarketId: polyId,
      polymarketPrice: polyPrice,
      polymarketVolume: polyVol,
      spread,
    });
  }

  // Add unmatched Polymarket events
  for (const event of polyEvents) {
    for (const pm of event.markets) {
      if (matchedPolyIds.has(pm.id)) continue;
      let price: number | null = null;
      try {
        const prices = JSON.parse(pm.outcomePrices || "[]");
        price = prices[0] ? Math.round(Number(prices[0]) * 100) : null;
      } catch {
        price = null;
      }
      comparisons.push({
        topic: pm.question || event.title,
        kalshiTicker: null,
        kalshiPrice: null,
        kalshiVolume: null,
        polymarketId: pm.id,
        polymarketPrice: price,
        polymarketVolume: pm.volume ?? null,
        spread: null,
      });
    }
  }

  // Sort: cross-platform matches with largest spreads first
  const sorted = [...comparisons].sort((a, b) => {
    // Matched on both > single platform
    const aMatched = a.kalshiPrice != null && a.polymarketPrice != null ? 1 : 0;
    const bMatched = b.kalshiPrice != null && b.polymarketPrice != null ? 1 : 0;
    if (aMatched !== bMatched) return bMatched - aMatched;
    return (b.spread ?? 0) - (a.spread ?? 0);
  });

  const filtered = sorted.filter((r) =>
    r.topic.toLowerCase().includes(search.toLowerCase())
  );

  const arbOpportunities = comparisons.filter(
    (r) => r.spread != null && r.spread >= 5
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cross-Platform Compare
        </h1>
        <p className="text-muted-foreground">
          Compare odds and pricing between Kalshi and Polymarket.
        </p>
      </div>

      {/* Arbitrage Alert */}
      {arbOpportunities.length > 0 && (
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Zap className="h-5 w-5" />
              Potential Arbitrage ({arbOpportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {arbOpportunities.slice(0, 5).map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 p-3"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">{row.topic}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Kalshi</p>
                      <p className="font-mono font-medium">
                        {row.kalshiPrice}¢
                      </p>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Polymarket
                      </p>
                      <p className="font-mono font-medium">
                        {row.polymarketPrice}¢
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      {row.spread}¢ spread
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kalshi Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kalshiMarkets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Polymarket Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{polyEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cross-Platform Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                comparisons.filter(
                  (r) =>
                    r.kalshiPrice != null && r.polymarketPrice != null
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              All Markets
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-center">Kalshi</TableHead>
                  <TableHead className="text-center">Polymarket</TableHead>
                  <TableHead className="text-center">Spread</TableHead>
                  <TableHead className="text-right">Volume (K/P)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm max-w-[300px] truncate">
                      {row.topic}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {row.kalshiPrice != null ? (
                        `${row.kalshiPrice}¢`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {row.polymarketPrice != null ? (
                        `${row.polymarketPrice}¢`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.spread != null ? (
                        <Badge
                          variant={row.spread >= 5 ? "default" : "secondary"}
                          className={
                            row.spread >= 5 ? "bg-green-500 text-white" : ""
                          }
                        >
                          {row.spread}¢
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {row.kalshiVolume != null
                        ? formatVolume(row.kalshiVolume)
                        : "—"}
                      {" / "}
                      {row.polymarketVolume != null
                        ? `$${formatVolume(row.polymarketVolume)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
