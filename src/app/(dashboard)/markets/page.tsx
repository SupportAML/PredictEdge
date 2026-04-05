import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
        <p className="text-muted-foreground">
          Browse trending markets and AI value scores.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Market Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 2 — browse Kalshi, Polymarket, and DraftKings
            markets with AI-powered value scores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
