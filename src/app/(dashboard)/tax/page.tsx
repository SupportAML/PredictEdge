"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Key,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";

interface KalshiFill {
  trade_id: string;
  ticker: string;
  side: string;
  count: number;
  price: number;
  created_time: string;
  is_taker: boolean;
  order_id: string;
}

interface TaxLot {
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  term: "short" | "long";
  washSale: boolean;
}

export default function TaxPage() {
  const [apiKeyId, setApiKeyId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<KalshiFill[]>([]);
  const [taxYear, setTaxYear] = useState("2025");

  async function handleConnect() {
    if (!apiKeyId.trim() || !apiKeySecret.trim()) {
      setError("Both API Key ID and Secret are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId, apiKeySecret, action: "trades" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed: ${res.status}`);
      }
      const data = await res.json();
      setTrades(data.fills ?? data.trades ?? []);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  // Build tax lots from trades — group buys and sells by ticker
  const taxLots = useMemo(() => {
    const yearTrades = trades.filter((t) => {
      if (!t.created_time) return false;
      return new Date(t.created_time).getFullYear() === Number(taxYear);
    });

    // Group by ticker
    const byTicker: Record<string, KalshiFill[]> = {};
    for (const t of yearTrades) {
      const key = t.ticker;
      if (!byTicker[key]) byTicker[key] = [];
      byTicker[key].push(t);
    }

    const lots: TaxLot[] = [];

    for (const [ticker, tickerTrades] of Object.entries(byTicker)) {
      // Sort chronologically
      const sorted = [...tickerTrades].sort(
        (a, b) =>
          new Date(a.created_time).getTime() -
          new Date(b.created_time).getTime()
      );

      const buys: { price: number; count: number; date: string }[] = [];

      for (const trade of sorted) {
        if (trade.side === "yes" || trade.side === "buy") {
          buys.push({
            price: trade.price,
            count: trade.count,
            date: trade.created_time,
          });
        } else {
          // Sell — match against earliest buy (FIFO)
          let remaining = trade.count;
          while (remaining > 0 && buys.length > 0) {
            const buy = buys[0];
            const matched = Math.min(remaining, buy.count);
            const costBasis = (buy.price / 100) * matched;
            const proceeds = (trade.price / 100) * matched;
            const acqDate = new Date(buy.date);
            const soldDate = new Date(trade.created_time);
            const daysDiff =
              (soldDate.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24);

            lots.push({
              description: `${matched} contracts — ${ticker}`,
              dateAcquired: acqDate.toLocaleDateString("en-US"),
              dateSold: soldDate.toLocaleDateString("en-US"),
              proceeds: Math.round(proceeds * 100) / 100,
              costBasis: Math.round(costBasis * 100) / 100,
              gainLoss: Math.round((proceeds - costBasis) * 100) / 100,
              term: daysDiff > 365 ? "long" : "short",
              washSale: false,
            });

            buy.count -= matched;
            remaining -= matched;
            if (buy.count <= 0) buys.shift();
          }
        }
      }

      // Remaining open buys get listed as unrealized (no sell date)
      for (const buy of buys) {
        if (buy.count > 0) {
          lots.push({
            description: `${buy.count} contracts — ${ticker} (OPEN)`,
            dateAcquired: new Date(buy.date).toLocaleDateString("en-US"),
            dateSold: "—",
            proceeds: 0,
            costBasis: Math.round((buy.price / 100) * buy.count * 100) / 100,
            gainLoss: 0,
            term: "short",
            washSale: false,
          });
        }
      }
    }

    // Wash sale detection — same ticker sold at loss, rebought within 30 days
    for (let i = 0; i < lots.length; i++) {
      if (lots[i].gainLoss >= 0 || lots[i].dateSold === "—") continue;
      const soldDate = new Date(lots[i].dateSold);
      const ticker = lots[i].description.split(" — ")[1];
      for (let j = 0; j < lots.length; j++) {
        if (i === j) continue;
        const otherTicker = lots[j].description.split(" — ")[1];
        if (otherTicker !== ticker) continue;
        const acqDate = new Date(lots[j].dateAcquired);
        const daysDiff =
          (acqDate.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 0 && daysDiff <= 30) {
          lots[i].washSale = true;
          break;
        }
      }
    }

    return lots;
  }, [trades, taxYear]);

  const realizedLots = taxLots.filter((l) => l.dateSold !== "—");
  const totalGains = realizedLots
    .filter((l) => l.gainLoss > 0)
    .reduce((s, l) => s + l.gainLoss, 0);
  const totalLosses = realizedLots
    .filter((l) => l.gainLoss < 0)
    .reduce((s, l) => s + l.gainLoss, 0);
  const netGainLoss = totalGains + totalLosses;
  const shortTermCount = realizedLots.filter((l) => l.term === "short").length;
  const longTermCount = realizedLots.filter((l) => l.term === "long").length;
  const washSaleCount = realizedLots.filter((l) => l.washSale).length;

  function downloadCSV() {
    const headers = [
      "Description",
      "Date Acquired",
      "Date Sold",
      "Proceeds",
      "Cost Basis",
      "Gain/Loss",
      "Term",
      "Wash Sale",
    ];
    const rows = realizedLots.map((l) => [
      l.description,
      l.dateAcquired,
      l.dateSold,
      l.proceeds.toFixed(2),
      l.costBasis.toFixed(2),
      l.gainLoss.toFixed(2),
      l.term === "short" ? "Short-term" : "Long-term",
      l.washSale ? "W" : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictedge-schedule-d-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadForm8949() {
    const header = [
      "Form 8949 — Sales and Dispositions of Capital Assets",
      `Tax Year: ${taxYear}`,
      "",
      "(a) Description",
      "(b) Date Acquired",
      "(c) Date Sold",
      "(d) Proceeds",
      "(e) Cost Basis",
      "(f) Code",
      "(g) Adjustment",
      "(h) Gain or Loss",
    ].join("\n");

    const shortTerm = realizedLots
      .filter((l) => l.term === "short")
      .map(
        (l) =>
          `"${l.description}",${l.dateAcquired},${l.dateSold},${l.proceeds.toFixed(2)},${l.costBasis.toFixed(2)},${l.washSale ? "W" : ""},${l.washSale ? Math.abs(l.gainLoss).toFixed(2) : ""},${l.gainLoss.toFixed(2)}`
      );

    const longTerm = realizedLots
      .filter((l) => l.term === "long")
      .map(
        (l) =>
          `"${l.description}",${l.dateAcquired},${l.dateSold},${l.proceeds.toFixed(2)},${l.costBasis.toFixed(2)},${l.washSale ? "W" : ""},${l.washSale ? Math.abs(l.gainLoss).toFixed(2) : ""},${l.gainLoss.toFixed(2)}`
      );

    const content = [
      header,
      "",
      "Part I — Short-Term (held one year or less)",
      "(a),(b),(c),(d),(e),(f),(g),(h)",
      ...shortTerm,
      "",
      "Part II — Long-Term (held more than one year)",
      "(a),(b),(c),(d),(e),(f),(g),(h)",
      ...longTerm,
      "",
      `Total Short-Term Gain/Loss: $${realizedLots.filter((l) => l.term === "short").reduce((s, l) => s + l.gainLoss, 0).toFixed(2)}`,
      `Total Long-Term Gain/Loss: $${realizedLots.filter((l) => l.term === "long").reduce((s, l) => s + l.gainLoss, 0).toFixed(2)}`,
      `Net Gain/Loss: $${netGainLoss.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictedge-form-8949-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Report</h1>
        <p className="text-muted-foreground">
          Generate IRS-ready Schedule D and Form 8949 reports from your
          prediction market trades.
        </p>
      </div>

      {!connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Connect Kalshi Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your Kalshi API credentials to import your trade history for
              tax reporting. Keys are sent server-side and never stored.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxApiKeyId">API Key ID</Label>
                <Input
                  id="taxApiKeyId"
                  placeholder="Your Kalshi API key ID"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxApiKeySecret">API Key Secret</Label>
                <Input
                  id="taxApiKeySecret"
                  type="password"
                  placeholder="Your Kalshi API key secret"
                  value={apiKeySecret}
                  onChange={(e) => setApiKeySecret(e.target.value)}
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button onClick={handleConnect} disabled={loading}>
              {loading ? "Importing trades..." : "Import Trade History"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">
                {trades.length} trades imported
              </span>
              <Select value={taxYear} onValueChange={(v) => setTaxYear(v ?? "2025")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Schedule D CSV
              </Button>
              <Button size="sm" onClick={downloadForm8949}>
                <FileText className="h-4 w-4 mr-2" />
                Form 8949 CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Total Gains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  +${totalGains.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Total Losses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  ${totalLosses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Net Gain/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${netGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {netGainLoss >= 0 ? "+" : ""}${netGainLoss.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Wash Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{washSaleCount}</div>
                <p className="text-xs text-muted-foreground">
                  {shortTermCount} short / {longTermCount} long
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Lots Table */}
          <Tabs defaultValue="realized">
            <TabsList>
              <TabsTrigger value="realized">
                Realized ({realizedLots.length})
              </TabsTrigger>
              <TabsTrigger value="open">
                Open Positions (
                {taxLots.filter((l) => l.dateSold === "—").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="realized">
              <Card>
                <CardContent className="pt-6">
                  {realizedLots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No realized gains/losses for {taxYear}.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Acquired</TableHead>
                          <TableHead>Sold</TableHead>
                          <TableHead className="text-right">Proceeds</TableHead>
                          <TableHead className="text-right">
                            Cost Basis
                          </TableHead>
                          <TableHead className="text-right">
                            Gain/Loss
                          </TableHead>
                          <TableHead>Term</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {realizedLots.map((lot, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">
                              {lot.description}
                              {lot.washSale && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  W
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {lot.dateAcquired}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {lot.dateSold}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${lot.proceeds.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${lot.costBasis.toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono font-medium ${lot.gainLoss >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {lot.gainLoss >= 0 ? "+" : ""}$
                              {lot.gainLoss.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  lot.term === "short" ? "secondary" : "outline"
                                }
                                className="text-xs"
                              >
                                {lot.term === "short" ? "ST" : "LT"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="open">
              <Card>
                <CardContent className="pt-6">
                  {taxLots.filter((l) => l.dateSold === "—").length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No open positions for {taxYear}.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Acquired</TableHead>
                          <TableHead className="text-right">
                            Cost Basis
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxLots
                          .filter((l) => l.dateSold === "—")
                          .map((lot, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-sm">
                                {lot.description}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {lot.dateAcquired}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${lot.costBasis.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
