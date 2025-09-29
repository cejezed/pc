// src/components/abonnementen/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Subscription, UpcomingDeadline } from "./types";

export const useSubscriptions = () =>
  useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: () => api<Subscription[]>("/api/subscriptions"),
    staleTime: 2 * 60 * 1000,
  });

export const useUpcomingDeadlines = () =>
  useQuery<UpcomingDeadline[]>({
    queryKey: ["subscription-deadlines"],
    queryFn: () => api<UpcomingDeadline[]>("/api/subscriptions/deadlines"),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Subscription>) =>
      api<Subscription>("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscription> }) =>
      api<Subscription>(`/api/subscriptions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useDeleteSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/subscriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

// ============================================
// src/components/abonnementen/helpers.ts

export const EUR = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);

export const todayISO = () => new Date().toISOString().split("T")[0];

export const addMonths = (date: string, months: number): string => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};

export const addDays = (date: string, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const calculateNextBillingDate = (
  startDate: string,
  cycle: string
): string => {
  const today = new Date();
  const start = new Date(startDate);
  
  let nextDate = new Date(start);
  
  while (nextDate <= today) {
    switch (cycle) {
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
    }
  }
  
  return nextDate.toISOString().split("T")[0];
};

export const calculateMonthlyCost = (
  costCents: number,
  cycle: string
): number => {
  switch (cycle) {
    case "monthly":
      return costCents;
    case "yearly":
      return Math.round(costCents / 12);
    case "quarterly":
      return Math.round(costCents / 3);
    case "weekly":
      return Math.round(costCents * 4.33);
    default:
      return costCents;
  }
};

export const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    streaming: "bg-purple-100 text-purple-700 border-purple-200",
    software: "bg-blue-100 text-blue-700 border-blue-200",
    fitness: "bg-green-100 text-green-700 border-green-200",
    utilities: "bg-orange-100 text-orange-700 border-orange-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[category || "other"] || colors.other;
};

export const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    streaming: "🎬",
    software: "💻",
    fitness: "💪",
    utilities: "⚡",
    other: "📦",
  };
  return icons[category || "other"] || icons.other;
};

export const formatBillingCycle = (cycle: string): string => {
  const labels: Record<string, string> = {
    monthly: "per maand",
    yearly: "per jaar",
    quarterly: "per kwartaal",
    weekly: "per week",
  };
  return labels[cycle] || cycle;
};