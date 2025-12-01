// src/Components/analytics/finance-utils.ts

import type {
  FinancialYearReportRow,
  RevenueProfitPoint,
  CostStructurePoint,
  PrivateWithdrawalsPoint,
  VatQuarterPoint,
  SalesCostItem,
} from "./finance-types";

export function toNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function sumSalesCosts(items: SalesCostItem[] | undefined): number {
  if (!items) return 0;
  return items.reduce((sum: number, item: SalesCostItem) => sum + item.amount, 0);
}

export function buildRevenueSeries(
  reports: FinancialYearReportRow[]
): RevenueProfitPoint[] {
  return reports.map((r) => ({
    year: r.year,
    revenue: toNum(r.revenue),
    net_profit: toNum(r.net_profit),
  }));
}

export function buildCostSeries(
  reports: FinancialYearReportRow[]
): CostStructurePoint[] {
  return reports.map((r) => ({
    year: r.year,
    office: toNum(r.office_costs),
    vehicle: toNum(r.vehicle_costs),
    general: toNum(r.general_expenses),
    sales: sumSalesCosts(r.raw_json?.cost_details?.sales_costs),
  }));
}

export function buildPrivateSeries(
  reports: FinancialYearReportRow[]
): PrivateWithdrawalsPoint[] {
  return reports.map((r) => ({
    year: r.year,
    withdrawals: toNum(r.private_withdrawals),
  }));
}

export function buildVatSeries(
  reports: FinancialYearReportRow[]
): VatQuarterPoint[] {
  const points: VatQuarterPoint[] = [];

  for (const r of reports) {
    const vat = r.raw_json?.vat;
    if (!vat) continue;

    if (vat.q1 != null) points.push({ year: r.year, quarter: "Q1", amount: vat.q1 ?? 0 });
    if (vat.q2 != null) points.push({ year: r.year, quarter: "Q2", amount: vat.q2 ?? 0 });
    if (vat.q3 != null) points.push({ year: r.year, quarter: "Q3", amount: vat.q3 ?? 0 });
    if (vat.q4 != null) points.push({ year: r.year, quarter: "Q4", amount: vat.q4 ?? 0 });
  }

  return points;
}
