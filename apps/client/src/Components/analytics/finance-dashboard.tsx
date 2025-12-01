// src/Components/analytics/finance-dashboard.tsx

import React from "react";
import { FinanceKpis } from "./finance-kpis";
import { RevenueChart, CostStructureChart } from "./finance-charts";
import { useFinanceAnalytics } from "./finance-hooks";

interface FinanceDashboardProps {
  userId: string | null;
}

export function FinanceDashboard({ userId }: FinanceDashboardProps) {
  const { reports, revenueSeries, costSeries, isLoading, error } =
    useFinanceAnalytics(userId);

  if (!userId) {
    return (
      <p className="text-sm text-[var(--zeus-text-secondary)]">
        Geen gebruiker gevonden – log in om je financiële overzicht te zien.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400">
        Fout bij laden financiële data:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }

  if (!reports.length) {
    return (
      <p className="text-sm text-[var(--zeus-text-secondary)]">
        Nog geen jaarrekeningen gevonden in <code>financial_year_reports</code>.
      </p>
    );
  }

  const selected = reports[reports.length - 1]; // meest recente jaar

  return (
    <div className="space-y-6">
      <FinanceKpis selected={selected} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Omzet & winst per jaar
          </h3>
          <RevenueChart data={revenueSeries} />
        </div>

        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Kostenstructuur per jaar
          </h3>
          <CostStructureChart data={costSeries} />
        </div>
      </div>
    </div>
  );
}
