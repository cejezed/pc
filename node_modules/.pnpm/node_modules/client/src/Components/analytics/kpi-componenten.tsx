import React from "react";
import { Loader2 } from "lucide-react";
import { TrendIndicator } from "./basis-componenten";

export function KPICard({
  title,
  value,
  trend,
  loading,
  icon,
}: {
  title: string;
  value: string | number;
  trend?: number;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Laden...</span>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend != null && (
            <div className="mt-1">
              <TrendIndicator value={trend} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "red" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    red: "bg-red-50 border-red-200 text-red-900",
    purple: "bg-purple-50 border-purple-200 text-purple-900",
    orange: "bg-orange-50 border-orange-200 text-orange-900",
  }[color];

  return (
    <div className={`rounded-lg border p-4 ${colorClasses}`}>
      <div className="text-sm font-medium opacity-75">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
}