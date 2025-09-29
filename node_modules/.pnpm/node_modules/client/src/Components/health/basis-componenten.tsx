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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
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
    up: { label: "↑ Stijgend", className: "bg-green-100 text-green-700" },
    down: { label: "↓ Dalend", className: "bg-red-100 text-red-700" },
    neutral: { label: "→ Stabiel", className: "bg-gray-100 text-gray-700" },
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
            star <= rating ? "text-yellow-500" : "text-gray-300",
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
    1: { label: "Licht", className: "bg-green-100 text-green-700" },
    2: { label: "Matig", className: "bg-blue-100 text-blue-700" },
    3: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
    4: { label: "Intensief", className: "bg-orange-100 text-orange-700" },
    5: { label: "Zeer intensief", className: "bg-red-100 text-red-700" },
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
        <span className="text-sm text-muted-foreground">{labels[level]}</span>
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
    <div className="flex items-center gap-2">
      <span className="text-xl">{icons[type] || "🍽️"}</span>
      <span className="text-sm font-medium">{labels[type] || type}</span>
    </div>
  );
}

export function LoadingState({ message = "Laden..." }: { message?: string }) {
  return (
    <div className="p-6 flex items-center gap-2 text-muted-foreground">
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
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
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
          className="text-gray-200"
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
          className="text-blue-500 transition-all duration-300"
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-medium">{label}</span>
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
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}
