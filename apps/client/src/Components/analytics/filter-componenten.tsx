import React from "react";
import { Calendar } from "lucide-react";

export function PeriodSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: {
  value: "week" | "month" | "quarter" | "year" | "custom";
  onChange: (period: "week" | "month" | "quarter" | "year" | "custom") => void;
  customRange: { from: string; to: string };
  onCustomRangeChange: (range: { from: string; to: string }) => void;
}) {
  const periods = [
    { value: "week", label: "Deze week" },
    { value: "month", label: "Deze maand" },
    { value: "quarter", label: "Dit kwartaal" },
    { value: "year", label: "Dit jaar" },
    { value: "custom", label: "Custom" },
  ] as const;

  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-[var(--zeus-primary)]" />
        <span className="text-sm font-medium text-[var(--zeus-text)]">Periode</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${value === period.value
                ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_10px_var(--zeus-primary-glow)]"
                : "bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-primary)]/10 border border-transparent hover:border-[var(--zeus-primary)]/30"
              }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {value === "custom" && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--zeus-border)]">
          <div>
            <label className="block text-xs font-medium text-[var(--zeus-text-secondary)] mb-1">
              Van
            </label>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, from: e.target.value })
              }
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-3 py-2 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--zeus-text-secondary)] mb-1">
              Tot
            </label>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, to: e.target.value })
              }
              className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-3 py-2 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ViewToggle({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex bg-[var(--zeus-bg-secondary)] rounded-lg p-1 border border-[var(--zeus-border)]">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${value === option.value
              ? "bg-[var(--zeus-card)] text-[var(--zeus-primary)] shadow-sm border border-[var(--zeus-border)]"
              : "text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-card)]/50"
            }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}