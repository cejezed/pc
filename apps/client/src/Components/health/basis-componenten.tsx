import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  unit,
  icon,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="zeus-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--zeus-text-secondary)]">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[var(--zeus-text)]">
          {value}
          {unit && <span className="text-sm font-normal ml-1 text-[var(--zeus-text-secondary)]">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--zeus-text-secondary)] mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2">
            <TrendBadge trend={trend} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendBadge({ trend }: { trend: "up" | "down" | "neutral" }) {
  const config = {
    up: { label: "↑ Stijgend", className: "bg-green-900/20 text-green-400 border border-green-800/50" },
    down: { label: "↓ Dalend", className: "bg-red-900/20 text-red-400 border border-red-800/50" },
    neutral: { label: "→ Stabiel", className: "bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]" },
  };

  return (
    <Badge variant="secondary" className={cn("text-xs", config[trend].className)}>
      {config[trend].label}
    </Badge>
  );
}

export function StarRating({
  rating,
  max = 5,
  onChange,
  readonly = false,
}: {
  rating: number;
  max?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "text-xl transition-colors",
            star <= rating ? "text-yellow-500" : "text-[var(--zeus-border)]",
            !readonly && "hover:text-yellow-400 cursor-pointer"
          )}
        >
          {star <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function IntensityBadge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  const config = {
    1: { label: "Licht", className: "bg-green-900/20 text-green-400 border border-green-800/50" },
    2: { label: "Matig", className: "bg-blue-900/20 text-blue-400 border border-blue-800/50" },
    3: { label: "Medium", className: "bg-yellow-900/20 text-yellow-400 border border-yellow-800/50" },
    4: { label: "Intensief", className: "bg-orange-900/20 text-orange-400 border border-orange-800/50" },
    5: { label: "Zeer intensief", className: "bg-red-900/20 text-red-400 border border-red-800/50" },
  };

  return (
    <Badge variant="secondary" className={config[level].className}>
      {config[level].label}
    </Badge>
  );
}

export function EnergyIndicator({
  level,
  showLabel = true,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
}) {
  const emojis = {
    1: "😴",
    2: "😐",
    3: "🙂",
    4: "😊",
    5: "🚀",
  };

  const labels = {
    1: "Zeer laag",
    2: "Laag",
    3: "Normaal",
    4: "Goed",
    5: "Uitstekend",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{emojis[level]}</span>
      {showLabel && (
        <span className="text-sm text-[var(--zeus-text-secondary)]">{labels[level]}</span>
      )}
    </div>
  );
}

export function MealTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    breakfast: "🌅",
    lunch: "🌤️",
    dinner: "🌙",
    snack: "🍎",
  };

  const labels: Record<string, string> = {
    breakfast: "Ontbijt",
    lunch: "Lunch",
    dinner: "Diner",
    snack: "Snack",
  };

  return (
    <div className="flex items-center gap-2 text-[var(--zeus-text)]">
      <span className="text-xl">{icons[type] || "🍽️"}</span>
      <span className="text-sm font-medium">{labels[type] || type}</span>
    </div>
  );
}

export function LoadingState({ message = "Laden..." }: { message?: string }) {
  return (
    <div className="p-6 flex items-center gap-2 text-[var(--zeus-text-secondary)]">
      <Loader2 className="h-4 w-4 animate-spin" /> {message}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mb-4 flex justify-center text-4xl">{icon}</div>}
      <h3 className="text-lg font-medium text-[var(--zeus-text)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--zeus-text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 6,
  label,
}: {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--zeus-border)]"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[var(--zeus-primary)] transition-all duration-300"
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-medium text-[var(--zeus-text)]">{label}</span>
      )}
    </div>
  );
}

export function DateHeader({ date }: { date: string }) {
  const dateObj = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label = dateObj.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (dateObj.toDateString() === today.toDateString()) {
    label = "Vandaag";
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    label = "Gisteren";
  }

  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-sm font-medium text-[var(--zeus-text-secondary)]">{label}</h3>
      <div className="flex-1 border-t border-[var(--zeus-border)]" />
    </div>
  );
}
