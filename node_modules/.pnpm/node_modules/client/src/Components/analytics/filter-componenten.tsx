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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">Periode</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === period.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {value === "custom" && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Van
            </label>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, from: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tot
            </label>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, to: e.target.value })
              }
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
    <div className="inline-flex bg-gray-100 rounded-lg p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            value === option.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}