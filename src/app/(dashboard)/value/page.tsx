"use client";

import { useEffect, useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Search,
  TrendingUp,
  TrendingDown,
  Gem,
  AlertTriangle,
} from "lucide-react";
import type { KalshiMarket } from "@/lib/kalshi";
import { formatVolume } from "@/lib/kalshi";

interface ScoredMarket {
  market: KalshiMarket;
  valueScore: number; // -100 to +100
  modelProb: number; // 0-100 estimated fair probability
  marketProb: number; // 0-100 current market price
  edge: number; // modelProb - marketProb
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  reasons: string[];
}

/**
 * AI Value Score Algorithm
 *
 * Estimates "fair value" using multiple signals:
 * 1. Volume-weighted price momentum: high volume at extreme prices suggests conviction
 * 2. Bid-ask spread efficiency: tight spreads = well-priced, wide spreads = opportunity
 * 3. Open interest vs volume ratio: high OI/vol = established, low = speculative
 * 4. Price extremity: markets near 50¢ have most uncertainty/opportunity
 * 5. Close time premium: markets near expiry with extreme prices are more reliable
 */
function scoreMarket(market: KalshiMarket): ScoredMarket {
  const reasons: string[] = [];
  let modelProb = market.last_price; // Start with market price as base

  // 1. Spread analysis — tight spread means market is efficient
  const spread = (market.yes_ask ?? 0) - (market.yes_bid ?? 0);
  const spreadPenalty = spread > 10 ? (spread - 10) * 0.5 : 0;

  if (spread > 15) {
    reasons.push("Wide spread suggests pricing inefficiency");
    // Wide spread = less efficient, model should discount toward 50
    modelProb = modelProb + (50 - modelProb) * 0.1;
  } else if (spread <= 3) {
    reasons.push("Tight spread indicates strong price discovery");
  }

  // 2. Volume conviction signal
  const vol24h = market.volume_24h ?? 0;
  if (vol24h > 10000 && market.last_price > 70) {
    reasons.push("High volume confirms bullish conviction");
    modelProb = Math.min(99, modelProb + 3);
  } else if (vol24h > 10000 && market.last_price < 30) {
    reasons.push("High volume confirms bearish conviction");
    modelProb = Math.max(1, modelProb - 3);
  } else if (vol24h < 100 && (market.last_price > 80 || market.last_price < 20)) {
    reasons.push("Low volume at extreme price — potential mispricing");
    modelProb = modelProb + (50 - modelProb) * 0.15;
  }

  // 3. Open interest ratio
  const oi = market.open_interest ?? 0;
  if (oi > 0 && vol24h > 0) {
    const oiRatio = oi / vol24h;
    if (oiRatio > 10) {
      reasons.push("High OI/volume ratio — established positions");
    } else if (oiRatio < 0.5) {
      reasons.push("Low OI relative to volume — speculative activity");
      modelProb = modelProb + (50 - modelProb) * 0.05;
    }
  }

  // 4. Time decay — markets near close with conviction
  if (market.close_time) {
    const hoursToClose =
      (new Date(market.close_time).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursToClose < 24 && hoursToClose > 0) {
      if (market.last_price > 85 || market.last_price < 15) {
        reasons.push("Near expiry with strong conviction — likely accurate");
        // Trust the market more when close to expiry
        modelProb = market.last_price;
      } else {
        reasons.push("Near expiry but uncertain — volatility opportunity");
      }
    }
  }

  // 5. Bid-ask midpoint vs last price divergence
  const midpoint =
    ((market.yes_bid ?? 0) + (market.yes_ask ?? 0)) / 2;
  if (midpoint > 0) {
    const divergence = market.last_price - midpoint;
    if (Math.abs(divergence) > 5) {
      reasons.push(
        `Last trade ${divergence > 0 ? "above" : "below"} midpoint by ${Math.abs(Math.round(divergence))}¢`
      );
      // Lean toward midpoint as fair value
      modelProb = modelProb - divergence * 0.3;
    }
  }

  // Clamp
  modelProb = Math.max(1, Math.min(99, Math.round(modelProb)));

  const marketProb = market.last_price;
  const edge = modelProb - marketProb;

  // Value score: edge magnitude * confidence (volume-based)
  const volumeConfidence = Math.min(1, vol24h / 5000);
  const rawScore = edge * (0.5 + volumeConfidence * 0.5);
  const valueScore = Math.max(-100, Math.min(100, Math.round(rawScore * 2)));

  let signal: ScoredMarket["signal"];
  if (valueScore >= 15) signal = "strong_buy";
  else if (valueScore >= 5) signal = "buy";
  else if (valueScore <= -15) signal = "strong_sell";
  else if (valueScore <= -5) signal = "sell";
  else signal = "neutral";

  if (reasons.length === 0) reasons.push("No significant signals detected");

  return {
    market,
    valueScore,
    modelProb,
    marketProb,
    edge,
    signal,
    reasons,
  };
}

const SIGNAL_COLORS: Record<string, string> = {
  strong_buy: "bg-green-500 text-white",
  buy: "bg-green-500/20 text-green-500",
  neutral: "bg-muted text-muted-foreground",
  sell: "bg-red-500/20 text-red-500",
  strong_sell: "bg-red-500 text-white",
};

const SIGNAL_LABELS: Record<string, string> = {
  strong_buy: "Strong Buy",
  buy: "Buy",
  neutral: "Neutral",
  sell: "Sell",
  strong_sell: "Strong Sell",
};

export default function ValuePage() {
  const [markets, setMarkets] = useState<KalshiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSignal, setFilterSignal] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/kalshi?limit=100&status=open");
        if (res.ok) {
          const data = await res.json();
          setMarkets(data.markets ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scored = useMemo(
    () =>
      markets
        .map(scoreMarket)
        .sort((a, b) => Math.abs(b.valueScore) - Math.abs(a.valueScore)),
    [markets]
  );

  const filtered = scored.filter((s) => {
    if (search && !s.market.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (filterSignal !== "all" && s.signal !== filterSignal) return false;
    return true;
  });

  const strongBuys = scored.filter((s) => s.signal === "strong_buy").length;
  const buys = scored.filter((s) => s.signal === "buy").length;
  const sells = scored.filter((s) => s.signal === "sell").length;
  const strongSells = scored.filter((s) => s.signal === "strong_sell").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Value Score</h1>
        <p className="text-muted-foreground">
          Model-estimated fair probability vs market price. Find mispriced
          markets.
        </p>
      </div>

      {/* Signal Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Strong Buy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{strongBuys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gem className="h-4 w-4 text-green-400" />
              Buy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{buys}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Sell
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{sells}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Strong Sell
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{strongSells}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Scored Markets
            </CardTitle>
            <div className="flex gap-3">
              <Select value={filterSignal} onValueChange={(v) => setFilterSignal(v ?? "all")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signals</SelectItem>
                  <SelectItem value="strong_buy">Strong Buy</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="strong_sell">Strong Sell</SelectItem>
                </SelectContent>
              </Select>
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
                  <TableHead className="text-center">Market Price</TableHead>
                  <TableHead className="text-center">Model Est.</TableHead>
                  <TableHead className="text-center">Edge</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Signal</TableHead>
                  <TableHead>Key Insight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((s) => (
                  <TableRow key={s.market.ticker}>
                    <TableCell className="font-medium text-sm max-w-[250px]">
                      <p className="truncate">{s.market.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Vol: {formatVolume(s.market.volume_24h ?? 0)}
                      </p>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {s.marketProb}¢
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium">
                      {s.modelProb}¢
                    </TableCell>
                    <TableCell
                      className={`text-center font-mono font-medium ${s.edge > 0 ? "text-green-500" : s.edge < 0 ? "text-red-500" : ""}`}
                    >
                      {s.edge > 0 ? "+" : ""}
                      {s.edge}¢
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-mono font-bold ${s.valueScore > 0 ? "text-green-500" : s.valueScore < 0 ? "text-red-500" : ""}`}
                      >
                        {s.valueScore > 0 ? "+" : ""}
                        {s.valueScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={SIGNAL_COLORS[s.signal]}>
                        {SIGNAL_LABELS[s.signal]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {s.reasons[0]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Scoring Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The AI Value Score estimates fair probability using five signals:
            spread efficiency, volume conviction, open interest ratios, time
            decay, and bid-ask midpoint divergence.
          </p>
          <p>
            Scores range from -100 (strong sell) to +100 (strong buy). A
            positive score means the model estimates the true probability is
            higher than the market price.
          </p>
          <p className="text-xs">
            This is not financial advice. All scores are model estimates and
            should be used as one input among many.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
