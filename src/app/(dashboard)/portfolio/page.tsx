import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          Track positions across all prediction markets.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No Accounts Connected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect your Kalshi, Polymarket, or DraftKings account to see your
            positions here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
