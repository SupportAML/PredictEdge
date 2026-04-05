import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TaxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Report</h1>
        <p className="text-muted-foreground">
          Generate IRS-ready tax reports for prediction market gains.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tax Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Phase 3 — automatic Form 8949 generation, cost basis
            tracking, and wash sale detection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
