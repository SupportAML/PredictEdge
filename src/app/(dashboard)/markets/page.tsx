"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, TrendingUp, RefreshCw } from "lucide-react";
import type { KalshiMarket } from "@/lib/kalshi";
import { formatCents, formatVolume } from "@/lib/kalshi";

type SortKey = "volume_24h" | "last_price" | "title" | "open_interest";
type SortDir = "asc" | "desc";

export default function MarketsPage() {
  const [markets, setMarkets] = useState<KalshiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume_24h");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  async function loadMarkets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kalshi?limit=100&status=open");
      if (!res.ok) throw new Error(`Failed to load markets: ${res.status}`);
      const data = await res.json();
      setMarkets(data.markets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(markets.map((m) => m.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [markets]);

  const filtered = useMemo(() => {
    let result = markets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.ticker.toLowerCase().includes(q) ||
          m.subtitle?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [markets, search, categoryFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <p className="text-muted-foreground">
            Browse live Kalshi prediction markets.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMarkets} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Live Markets
            </CardTitle>
            <Badge variant="secondary">{filtered.length} markets</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No markets found. Try adjusting your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort("title")}
                      >
                        Market
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort("last_price")}
                      >
                        Yes Price
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Spread</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort("volume_24h")}
                      >
                        24h Vol
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort("open_interest")}
                      >
                        Open Int.
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((market) => (
                    <TableRow key={market.ticker}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm leading-tight">
                            {market.title}
                          </p>
                          {market.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {market.subtitle}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">
                          {formatCents(market.last_price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-muted-foreground">
                          {formatCents(market.yes_ask - market.yes_bid)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatVolume(market.volume_24h)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatVolume(market.open_interest)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {market.category && (
                          <Badge variant="outline" className="text-xs">
                            {market.category}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
