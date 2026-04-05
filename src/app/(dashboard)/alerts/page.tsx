import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Smart alerts for price movements and arbitrage.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Smart Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 3 — price movement alerts, arbitrage detection, and
            custom notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
