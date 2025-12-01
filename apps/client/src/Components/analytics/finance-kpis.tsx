// src/Components/analytics/finance-kpis.tsx

import React from "react";
import type { FinancialYearReportRow } from "./finance-types";
import { formatEUR, toNum } from "./finance-utils";

interface FinanceKpisProps {
  selected?: FinancialYearReportRow;
}

export function FinanceKpis({ selected }: FinanceKpisProps) {
  if (!selected) {
    return (
      <div className="text-sm text-[var(--zeus-text-secondary)]">
        Nog geen jaar geselecteerd / geen financiële data gevonden.
      </div>
    );
  }

  const salesCosts =
    selected.raw_json?.cost_details?.sales_costs?.reduce(
      (sum: number, item) => sum + item.amount,
      0
    ) ?? 0;

  const totalCosts =
    toNum(selected.office_costs) +
    toNum(selected.vehicle_costs) +
    toNum(selected.general_expenses) +
    salesCosts;

  const revenue = toNum(selected.revenue);
  const netProfit = toNum(selected.net_profit);
  const profitMargin =
    revenue > 0 ? Math.round((netProfit / revenue) * 100) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Kpi label="Omzet" value={formatEUR(revenue)} />
      <Kpi label="Netto winst" value={formatEUR(netProfit)} />
      <Kpi label="Totale kosten" value={formatEUR(totalCosts)} />
      <Kpi
        label="Winstmarge"
        value={profitMargin != null ? `${profitMargin}%` : "–"}
      />
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
}

function Kpi({ label, value }: KpiProps) {
  return (
    <div className="bg-[var(--zeus-card)] border border-[var(--zeus-border)] rounded-xl p-4 shadow-sm">
      <div className="text-xs text-[var(--zeus-text-secondary)] mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold text-[var(--zeus-text)]">
        {value}
      </div>
    </div>
  );
}
