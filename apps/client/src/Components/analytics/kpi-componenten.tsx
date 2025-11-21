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
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-5 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:border-[var(--zeus-primary)]/50 transition-all group relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--zeus-primary)]/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100"></div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-sm font-medium text-[var(--zeus-text-secondary)]">{title}</span>
        {icon && <div className="text-[var(--zeus-primary)] p-2 bg-[var(--zeus-primary)]/10 rounded-lg">{icon}</div>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--zeus-primary)]" />
          <span className="text-sm text-[var(--zeus-text-secondary)]">Laden...</span>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="text-2xl font-bold text-[var(--zeus-text)] tracking-tight">{value}</div>
          {trend != null && (
            <div className="mt-2">
              <TrendIndicator value={trend} />
            </div>
          )}
        </div>
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
  // Map colors to Zeus theme variants if possible, or keep distinct colors but adapted for dark mode
  const colorClasses = {
    blue: "bg-blue-900/10 border-blue-500/30 text-blue-400",
    green: "bg-green-900/10 border-green-500/30 text-green-400",
    red: "bg-red-900/10 border-red-500/30 text-red-400",
    purple: "bg-purple-900/10 border-purple-500/30 text-purple-400",
    orange: "bg-orange-900/10 border-orange-500/30 text-orange-400",
  }[color];

  return (
    <div className={`rounded-xl border p-4 ${colorClasses} backdrop-blur-sm`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-2 text-[var(--zeus-text)]">{value}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
    </div>
  );
}