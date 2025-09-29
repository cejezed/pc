import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* Format Currency */
export const EUR = (amount: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);

/* Format Number */
export const formatNumber = (num: number, decimals = 0) => {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/* Date Helpers */
export const toISODate = (d: Date) => d.toISOString().split("T")[0];

export const startOfPeriod = (type: "week" | "month" | "quarter" | "year") => {
  const now = new Date();
  const d = new Date(now);
  
  if (type === "week") {
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
  } else if (type === "month") {
    d.setDate(1);
  } else if (type === "quarter") {
    const currentMonth = d.getMonth();
    const qStartMonth = Math.floor(currentMonth / 3) * 3;
    d.setMonth(qStartMonth, 1);
  } else if (type === "year") {
    d.setMonth(0, 1);
  }
  
  return d;
};

export const endOfPeriod = (type: "week" | "month" | "quarter" | "year") => {
  const s = startOfPeriod(type);
  const d = new Date(s);
  
  if (type === "week") {
    d.setDate(d.getDate() + 6);
  } else if (type === "month") {
    d.setMonth(d.getMonth() + 1, 0);
  } else if (type === "quarter") {
    d.setMonth(d.getMonth() + 3, 0);
  } else if (type === "year") {
    d.setFullYear(d.getFullYear() + 1, 0, 0);
  }
  
  return d;
};

/* Trend Indicator */
export function TrendIndicator({ value, showValue = true }: { value?: number; showValue?: boolean }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500">
        <Minus className="w-3 h-3" />
        {showValue && "—"}
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <TrendingUp className="w-3 h-3" />
        {showValue && `+${value.toFixed(1)}%`}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <TrendingDown className="w-3 h-3" />
        {showValue && `${value.toFixed(1)}%`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-gray-500">
      <Minus className="w-3 h-3" />
      {showValue && "0%"}
    </span>
  );
}

/* Chart Colors */
export const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];