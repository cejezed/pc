// components/analytics/finance-utils.ts

import {
  FinancialYearReport,
  RevenueProfitPoint,
  CostStructurePoint,
  PrivateWithdrawalsPoint,
  VatQuarterPoint,
} from "./types";

export const toNum = (v: any) =>
  typeof v === "number" ? v : v ? Number(v) : 0;

export function buildRevenueSeries(reports: FinancialYearReport[]): RevenueProfitPoint[] {
  return reports.map(r => ({
    year: r.year,
    revenue: toNum(r.revenue),
    net_profit: toNum(r.net_profit),
  }));
}

export function buildCostSeries(reports: FinancialYearReport[]): CostStructurePoint[] {
  return reports.map(r => {
    const sales =
      r.raw_json?.cost_details?.sales_costs?.reduce(
        (sum, item) => sum + item.amount,
        0
      ) ?? 0;

    return {
      year: r.year,
      office: toNum(r.office_costs),
      vehicle: toNum(r.vehicle_costs),
      general: toNum(r.general_expenses),
      sales,
    };
  });
}

export function buildPrivateSeries(reports: FinancialYearReport[]): PrivateWithdrawalsPoint[] {
  return reports.map(r => ({
    year: r.year,
    withdrawals: toNum(r.private_withdrawals),
  }));
}

export function buildVatSeries(reports: FinancialYearReport[]): VatQuarterPoint[] {
  const points: VatQuarterPoint[] = [];

  for (const r of reports) {
    const v = r.raw_json?.vat;
    if (!v) continue;

    if (v.q1 != null) points.push({ year: r.year, quarter: "Q1", amount: v.q1 });
    if (v.q2 != null) points.push({ year: r.year, quarter: "Q2", amount: v.q2 });
    if (v.q3 != null) points.push({ year: r.year, quarter: "Q3", amount: v.q3 });
    if (v.q4 != null) points.push({ year: r.year, quarter: "Q4", amount: v.q4 });
  }

  return points;
}

export function formatEUR(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
