// src/Components/budget/basis-componenten.tsx
import React from "react";
import { X } from "lucide-react";

// EUR formatter
export const EUR = (cents: number): string =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Today ISO
export const todayISO = (): string => new Date().toISOString().split("T")[0];

// Modal Component
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// StatCard Component
export function StatCard({
  label,
  value,
  color,
  subtext,
}: {
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "gray";
  subtext?: string;
}) {
  const colorClasses = {
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    gray: "text-gray-600 bg-gray-50 border-gray-200",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold mb-1 ${colorClasses[color].split(' ')[0]}`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
    </div>
  );
}

// PeriodSelector Component
export function PeriodSelector({
  value,
  onChange,
}: {
  value: "week" | "month" | "year" | "all";
  onChange: (value: "week" | "month" | "year" | "all") => void;
}) {
  const options = [
    { value: "week" as const, label: "Deze week" },
    { value: "month" as const, label: "Deze maand" },
    { value: "year" as const, label: "Dit jaar" },
    { value: "all" as const, label: "Alles" },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            value === option.value
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// CategoryBadge Component
export function CategoryBadge({
  name,
  color,
  type,
  category,
}: {
  name?: string;
  color?: string;
  type?: 'income' | 'expense' | 'savings';
  category?: { name: string; color: string; type: 'income' | 'expense' | 'savings'; icon?: string };
}) {
  // Use either individual props or category object
  const displayName = name || category?.name || "Unknown";
  const displayColor = color || category?.color || "#6B7280";
  const displayType = type || category?.type || "expense";
  const icon = category?.icon;

  const typeSymbol = displayType === "income" ? "+" : displayType === "expense" ? "-" : "=";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
      style={{
        backgroundColor: displayColor + "20",
        color: displayColor,
        borderColor: displayColor + "40",
        border: "1px solid",
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{typeSymbol}</span>
      <span>{displayName}</span>
    </span>
  );
}