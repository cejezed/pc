import React from "react";
import { X, Flame, Calendar, CheckCircle2 } from "lucide-react";

// Utils
export const classNames = (...xs: (string | false | null | undefined)[]) => 
  xs.filter(Boolean).join(" ");

export const monthNames = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"
];

export const weekDayShort = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

// Header component
export function Header({ onNew }: { onNew: () => void }) {
  const today = new Date();
  const label = `${today.toLocaleDateString("nl-NL", { weekday: "long" })} ${today.getDate()} ${monthNames[today.getMonth()]}`;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" /> Habits
      </h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" /> Vandaag – {label}
      </div>
      <button 
        onClick={onNew}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-black text-white hover:bg-gray-800"
      >
        <Plus className="w-4 h-4" /> Nieuwe
      </button>
    </div>
  );
}

// Stat card component
export function StatCard({ 
  label, 
  value, 
  subtitle, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold flex items-center gap-2">
        {icon}
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
}

// Modal wrapper
export function Modal({ 
  open, 
  onClose, 
  title, 
  children 
}: { 
  open: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 md:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Confetti overlay
export function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none grid place-items-center text-4xl animate-pulse select-none z-50">
      <div>🎉🔥✅✨</div>
    </div>
  );
}