"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Key,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Position {
  ticker: string;
  market_ticker: string;
  side: string;
  quantity: number;
  avg_price: number;
  market_value: number;
}

interface Trade {
  trade_id: string;
  ticker: string;
  side: string;
  count: number;
  price: number;
  created_time: string;
}

interface PortfolioData {
  balance: number | null;
  positions: Position[];
  trades: Trade[];
}

export default function PortfolioPage() {
  const [apiKeyId, setApiKeyId] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    balance: null,
    positions: [],
    trades: [],
  });

  async function fetchPortfolioData(action: "balance" | "positions" | "trades") {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKeyId, apiKeySecret, action }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? `Failed: ${res.status}`);
    }
    return res.json();
  }

  async function handleConnect() {
    if (!apiKeyId.trim() || !apiKeySecret.trim()) {
      setError("Both API Key ID and Secret are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [balanceData, positionsData, tradesData] = await Promise.all([
        fetchPortfolioData("balance"),
        fetchPortfolioData("positions"),
        fetchPortfolioData("trades"),
      ]);

      setPortfolio({
        balance: balanceData.balance ?? balanceData.available_balance ?? 0,
        positions: positionsData.market_positions ?? positionsData.positions ?? [],
        trades: tradesData.fills ?? tradesData.trades ?? [],
      });
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    setConnected(false);
    setApiKeyId("");
    setApiKeySecret("");
    setPortfolio({ balance: null, positions: [], trades: [] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          Connect your Kalshi account to track positions and trades.
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
              Enter your Kalshi API credentials to import your portfolio. Your
              keys are sent server-side and never stored.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apiKeyId">API Key ID</Label>
                <Input
                  id="apiKeyId"
                  placeholder="Your Kalshi API key ID"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKeySecret">API Key Secret</Label>
                <Input
                  id="apiKeySecret"
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
              {loading ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect & Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Kalshi Connected</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${((portfolio.balance ?? 0) / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolio.positions.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {portfolio.trades.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="positions">
            <TabsList>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="trades">Trade History</TabsTrigger>
            </TabsList>

            <TabsContent value="positions">
              <Card>
                <CardContent className="pt-6">
                  {portfolio.positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No open positions found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Market</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Avg Price</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.positions.map((pos, i) => (
                          <TableRow key={pos.ticker || i}>
                            <TableCell className="font-medium">
                              {pos.market_ticker || pos.ticker}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  pos.side === "yes" ? "default" : "secondary"
                                }
                              >
                                {pos.side === "yes" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {pos.side.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {pos.quantity}
                            </TableCell>
                            <TableCell className="font-mono">
                              {pos.avg_price}¢
                            </TableCell>
                            <TableCell className="font-mono">
                              ${((pos.market_value ?? 0) / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades">
              <Card>
                <CardContent className="pt-6">
                  {portfolio.trades.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No trades found.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Market</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.trades.slice(0, 50).map((trade, i) => (
                          <TableRow key={trade.trade_id || i}>
                            <TableCell className="text-muted-foreground text-xs">
                              {trade.created_time
                                ? new Date(trade.created_time).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {trade.ticker}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  trade.side === "yes" ? "default" : "secondary"
                                }
                              >
                                {trade.side?.toUpperCase() ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {trade.count}
                            </TableCell>
                            <TableCell className="font-mono">
                              {trade.price}¢
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
