import React from "react";
import { FileText, X } from "lucide-react";
import type { Invoice } from "./types";

// Money formatter
export const centsToMoney = (cents: number) =>
  (cents / 100).toLocaleString("nl-NL", { 
    style: "currency", 
    currency: "EUR" 
  });

// Status badge
export function StatusBadge({ status }: { status: Invoice["status"] }) {
  const map: Record<Invoice["status"], { color: string; label: string }> = {
    draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft 🟡" },
    sent: { color: "bg-blue-100 text-blue-800", label: "Sent 🔵" },
    paid: { color: "bg-green-100 text-green-700", label: "Paid 🟢" },
    overdue: { color: "bg-red-100 text-red-700", label: "Overdue 🔴" },
    cancelled: { color: "bg-gray-200 text-gray-700", label: "Cancelled ⚫" },
  };
  
  const c = map[status];
  
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}
    >
      {c.label}
    </span>
  );
}

// Pill component
export function Pill({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border px-3 py-2 text-sm ${className || ""}`}>
      {children}
    </div>
  );
}

// KPI Card
export function KPICard({ 
  label, 
  value 
}: { 
  label: string; 
  value: string;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

// Modal wrapper
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "5xl"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`w-full md:max-w-${maxWidth} bg-white rounded-t-2xl md:rounded-2xl shadow-lg max-h-[92vh] overflow-hidden`}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Timeline dot (voor status)
export function TimelineDot({ 
  active, 
  label, 
  date 
}: { 
  active: boolean; 
  label: string; 
  date?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className={`h-3 w-3 rounded-full ${active ? "bg-black" : "bg-gray-300"}`} 
      />
      <div className="text-sm">
        {label}
        {date && ` — ${date}`}
      </div>
    </div>
  );
}