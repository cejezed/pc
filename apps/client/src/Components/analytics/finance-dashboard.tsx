// components/analytics/finance-dashboard.tsx

import { Card } from "./basis-componenten";
import { RevenueChart, CostStructureChart } from "./finance-charts";
import { FinanceKpis } from "./finance-kpis";
import { useFinanceAnalytics } from "./finance-hooks";

export function FinanceDashboard({ userId }) {
  const { reports, revenueSeries, costSeries } = useFinanceAnalytics(userId);

  const selected = reports[reports.length - 1];

  return (
    <div className="space-y-8">
      <FinanceKpis selected={selected} />

      <Card title="Omzet & Winstontwikkeling">
        <RevenueChart data={revenueSeries} />
      </Card>

      <Card title="Kostenstructuur per jaar">
        <CostStructureChart data={costSeries} />
      </Card>
    </div>
  );
}
