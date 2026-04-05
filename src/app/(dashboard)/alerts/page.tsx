"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellRing,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";
import type { KalshiMarket } from "@/lib/kalshi";

interface Alert {
  id: string;
  ticker: string;
  marketTitle: string;
  type: "price_above" | "price_below" | "volume_spike";
  threshold: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

const ALERTS_KEY = "predictedge_alerts";

function loadAlerts(): Alert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markets, setMarkets] = useState<KalshiMarket[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [volumeSpikes, setVolumeSpikes] = useState<KalshiMarket[]>([]);

  // New alert form
  const [selectedTicker, setSelectedTicker] = useState("");
  const [alertType, setAlertType] = useState<
    "price_above" | "price_below" | "volume_spike"
  >("price_above");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const checkAlerts = useCallback(
    (marketList: KalshiMarket[], currentAlerts: Alert[]) => {
      let changed = false;
      const updated = currentAlerts.map((alert) => {
        if (alert.triggered) return alert;
        const market = marketList.find((m) => m.ticker === alert.ticker);
        if (!market) return alert;

        let shouldTrigger = false;
        if (alert.type === "price_above" && market.last_price >= alert.threshold) {
          shouldTrigger = true;
        } else if (
          alert.type === "price_below" &&
          market.last_price <= alert.threshold
        ) {
          shouldTrigger = true;
        } else if (alert.type === "volume_spike") {
          // Volume spike = 24h volume exceeds threshold
          shouldTrigger = (market.volume_24h ?? 0) >= alert.threshold;
        }

        if (shouldTrigger) {
          changed = true;
          return {
            ...alert,
            triggered: true,
            triggeredAt: new Date().toISOString(),
          };
        }
        return alert;
      });

      if (changed) {
        setAlerts(updated);
        saveAlerts(updated);
      }
    },
    []
  );

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch("/api/kalshi?limit=100&status=open");
        if (res.ok) {
          const data = await res.json();
          const marketList: KalshiMarket[] = data.markets ?? [];
          setMarkets(marketList);

          // Detect volume spikes — markets with volume_24h > 2x average
          if (marketList.length > 0) {
            const avgVol =
              marketList.reduce((s, m) => s + (m.volume_24h ?? 0), 0) /
              marketList.length;
            const spikes = marketList
              .filter((m) => (m.volume_24h ?? 0) > avgVol * 2)
              .sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0))
              .slice(0, 10);
            setVolumeSpikes(spikes);
          }

          // Check existing alerts
          const currentAlerts = loadAlerts();
          checkAlerts(marketList, currentAlerts);
        }
      } catch {
        // silent
      } finally {
        setLoadingMarkets(false);
      }
    }
    loadMarkets();
  }, [checkAlerts]);

  function addAlert() {
    if (!selectedTicker || !threshold) return;
    const market = markets.find((m) => m.ticker === selectedTicker);
    if (!market) return;

    const newAlert: Alert = {
      id: crypto.randomUUID(),
      ticker: selectedTicker,
      marketTitle: market.title,
      type: alertType,
      threshold: Number(threshold),
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setSelectedTicker("");
    setThreshold("");
  }

  function removeAlert(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  }

  function clearTriggered() {
    const updated = alerts.filter((a) => !a.triggered);
    setAlerts(updated);
    saveAlerts(updated);
  }

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Alerts</h1>
        <p className="text-muted-foreground">
          Set price alerts and detect volume spikes across prediction markets.
        </p>
      </div>

      {/* Create Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label>Market</Label>
              <Select value={selectedTicker} onValueChange={(v) => setSelectedTicker(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market..." />
                </SelectTrigger>
                <SelectContent>
                  {markets.slice(0, 50).map((m) => (
                    <SelectItem key={m.ticker} value={m.ticker}>
                      <span className="truncate block max-w-[250px]">
                        {m.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={alertType}
                onValueChange={(v) => {
                  if (v) setAlertType(v as "price_above" | "price_below" | "volume_spike");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_above">Price above</SelectItem>
                  <SelectItem value="price_below">Price below</SelectItem>
                  <SelectItem value="volume_spike">Volume exceeds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {alertType === "volume_spike" ? "Volume threshold" : "Price (cents)"}
              </Label>
              <Input
                type="number"
                placeholder={alertType === "volume_spike" ? "10000" : "50"}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
            <Button onClick={addAlert} disabled={!selectedTicker || !threshold}>
              <Bell className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-yellow-500">
                <BellRing className="h-5 w-5" />
                Triggered Alerts ({triggeredAlerts.length})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearTriggered}>
                Clear all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{alert.marketTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.type === "price_above"
                        ? `Price crossed above ${alert.threshold}¢`
                        : alert.type === "price_below"
                          ? `Price dropped below ${alert.threshold}¢`
                          : `Volume exceeded ${alert.threshold.toLocaleString()}`}
                      {alert.triggeredAt &&
                        ` — ${new Date(alert.triggeredAt).toLocaleString()}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-yellow-500">
                    Triggered
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active alerts. Create one above to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAlerts.map((alert) => {
                  const market = markets.find(
                    (m) => m.ticker === alert.ticker
                  );
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {alert.marketTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {alert.type === "price_above" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : alert.type === "price_below" ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : (
                            <Activity className="h-3 w-3 mr-1" />
                          )}
                          {alert.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {alert.type === "volume_spike"
                          ? alert.threshold.toLocaleString()
                          : `${alert.threshold}¢`}
                      </TableCell>
                      <TableCell className="font-mono">
                        {market
                          ? alert.type === "volume_spike"
                            ? (market.volume_24h ?? 0).toLocaleString()
                            : `${market.last_price}¢`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Volume Spikes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Volume Spikes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMarkets ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading markets...
            </p>
          ) : volumeSpikes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No volume spikes detected right now.
            </p>
          ) : (
            <div className="space-y-3">
              {volumeSpikes.map((market) => (
                <div
                  key={market.ticker}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">
                      {market.title}
                    </p>
                    {market.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {market.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium">
                      {market.last_price}¢
                    </p>
                    <p className="text-xs text-yellow-500 font-medium">
                      Vol: {(market.volume_24h ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
