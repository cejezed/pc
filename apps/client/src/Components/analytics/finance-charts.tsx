// src/Components/analytics/finance-charts.tsx

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatEUR, toNum } from "./finance-utils";
import type { FinancialYearReportRow } from "./finance-types";

/**
 * Eenvoudige omzet / kosten grafiek (laat ik staan zoals conceptueel bedoeld):
 * - data: [{ year, revenue, costs }]
 */
export type RevenueCostPoint = {
  year: number;
  revenue: number;
  costs: number;
};

interface RevenueCostChartProps {
  data: RevenueCostPoint[];
}

export function RevenueCostChart({ data }: RevenueCostChartProps) {
  return (
    <div className="bg-[var(--zeus-card)] p-6 rounded-xl border border-[var(--zeus-border)] shadow-lg">
      <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-4">
        Omzet &amp; kosten per jaar
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v) => formatEUR(Number(v))} />
            <Tooltip
              formatter={(value: any) => formatEUR(Number(value))}
              labelFormatter={(label) => `Jaar ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Omzet"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="costs"
              name="Kosten"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * 🔁 VERVANGER van de oude BTW-grafiek:
 *
 * VatChart toont nu:
 * - bruto inkomen (omzet)
 * - netto winst vóór belasting
 * - belastingen totaal (IB + Zvw)
 * - netto na belasting
 * - vrij besteedbaar (na belasting én privé-onttrekkingen)
 *
 * Let op:
 * - data = array FinancialYearReportRow (dus: geef hier "reports" door)
 */
interface VatChartProps {
  data: FinancialYearReportRow[];
}

export function VatChart({ data }: VatChartProps) {
  const chartData = (data || []).map((r) => {
    const tax = (r.raw_json && (r.raw_json as any).tax) || {};
    const bruto = toNum(r.revenue);
    const nettoVoorBelasting = toNum(r.net_profit);
    const inkomenBelasting = toNum(tax.income_tax_due);
    const zvwBelasting = toNum(tax.zvw_due);
    const belastingTotaal = inkomenBelasting + zvwBelasting;
    const nettoNaBelasting = nettoVoorBelasting - belastingTotaal;
    const vrijBesteedbaar =
      nettoNaBelasting - toNum(r.private_withdrawals ?? 0);

    return {
      year: r.year,
      bruto,
      nettoVoorBelasting,
      belastingTotaal,
      nettoNaBelasting,
      vrijBesteedbaar,
    };
  });

  return (
    <div className="bg-[var(--zeus-card)] p-6 rounded-xl border border-[var(--zeus-border)] shadow-lg">
      <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-1">
        Ondernemersinkomen: bruto, netto, belasting &amp; vrij besteedbaar
      </h3>
      <p className="text-xs text-[var(--zeus-text-secondary)] mb-4">
        Laat per jaar zien hoeveel je draait, hoeveel er naar belasting gaat en
        wat er uiteindelijk écht vrij beschikbaar blijft.
      </p>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="year" />
            <YAxis
              tickFormatter={(v) =>
                Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : `${v}`
              }
            />
            <Tooltip
              formatter={(value: any) => formatEUR(Number(value))}
              labelFormatter={(label) => `Jaar ${label}`}
            />
            <Legend />

            {/* Bruto inkomen */}
            <Bar
              dataKey="bruto"
              name="Bruto inkomen (omzet)"
              stackId="a"
              fill="#4ade80"
            />
            {/* Belastingen */}
            <Bar
              dataKey="belastingTotaal"
              name="Belastingen (IB + Zvw)"
              stackId="a"
              fill="#f97316"
            />
            {/* Vrij besteedbaar (na belasting én privé) */}
            <Bar
              dataKey="vrijBesteedbaar"
              name="Vrij besteedbaar (na belasting & privé)"
              stackId="a"
              fill="#a855f7"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
