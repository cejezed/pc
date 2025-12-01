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
} from "recharts";
import type {
  RevenueProfitPoint,
  CostStructurePoint,
  PrivateWithdrawalsPoint,
} from "./finance-types";

export type CostCategory = "office" | "vehicle" | "sales" | "general";

interface RevenueChartProps {
  data: RevenueProfitPoint[];
  onSelectYear?: (year: number) => void;
}

export function RevenueChart({ data, onSelectYear }: RevenueChartProps) {
  const handleClick = (state: any) => {
    if (!onSelectYear) return;
    const year = state?.activeLabel;
    if (typeof year === "number") {
      onSelectYear(year);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} onClick={handleClick}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Omzet"
          stroke="#10b981"
          strokeWidth={3}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="net_profit"
          name="Netto winst"
          stroke="#3b82f6"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CostStructureChartProps {
  data: CostStructurePoint[];
  onSelectCost?: (year: number, category: CostCategory) => void;
}

export function CostStructureChart({
  data,
  onSelectCost,
}: CostStructureChartProps) {
  const handleBarClick =
    (category: CostCategory) =>
    (entry: any /* Recharts click payload */) => {
      if (!onSelectCost) return;
      const year = entry?.payload?.year;
      if (typeof year === "number") {
        onSelectCost(year, category);
      }
    };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="office"
          name="Kantoor"
          fill="#6366f1"
          onClick={handleBarClick("office")}
        />
        <Bar
          dataKey="vehicle"
          name="Auto"
          fill="#f59e0b"
          onClick={handleBarClick("vehicle")}
        />
        <Bar
          dataKey="sales"
          name="Verkoop"
          fill="#10b981"
          onClick={handleBarClick("sales")}
        />
        <Bar
          dataKey="general"
          name="Algemeen"
          fill="#ef4444"
          onClick={handleBarClick("general")}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PrivateWithdrawalsChartProps {
  data: PrivateWithdrawalsPoint[];
}

export function PrivateWithdrawalsChart({ data }: PrivateWithdrawalsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="withdrawals" name="Privé-opnamen" fill="#e11d48" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface VatYearChartProps {
  // data items: { year, Q1, Q2, Q3, Q4 }
  data: Array<{ year: number; Q1: number; Q2: number; Q3: number; Q4: number }>;
}

export function VatYearChart({ data }: VatYearChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} stackOffset="none">
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Q1" name="Q1" stackId="vat" fill="#0ea5e9" />
        <Bar dataKey="Q2" name="Q2" stackId="vat" fill="#22c55e" />
        <Bar dataKey="Q3" name="Q3" stackId="vat" fill="#a855f7" />
        <Bar dataKey="Q4" name="Q4" stackId="vat" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
}
