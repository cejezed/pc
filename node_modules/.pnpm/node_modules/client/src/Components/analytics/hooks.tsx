import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* Types */
export type TimeAnalytics = {
  project_id: string;
  project_name: string;
  total_hours: number;
  total_amount: number;
  phases: Array<{
    phase_code: string;
    phase_name: string;
    hours: number;
    percentage: number;
  }>;
};

export type BudgetAnalytics = {
  category_id: string;
  category_name: string;
  category_type: "income" | "expense";
  total_amount: number;
  transaction_count: number;
  monthly_data: Array<{
    month: string;
    amount: number;
  }>;
};

export type TaskAnalytics = {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  completion_rate: number;
  by_priority: Record<string, number>;
};

export type DashboardKPI = {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
};

/* Hooks */
export function useTimeAnalytics(from: string, to: string) {
  return useQuery<TimeAnalytics[]>({
    queryKey: ["analytics", "time", from, to],
    queryFn: () => api<TimeAnalytics[]>(`/api/analytics/time?from=${from}&to=${to}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBudgetAnalytics(from: string, to: string) {
  return useQuery<BudgetAnalytics[]>({
    queryKey: ["analytics", "budget", from, to],
    queryFn: () => api<BudgetAnalytics[]>(`/api/analytics/budget?from=${from}&to=${to}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaskAnalytics(from: string, to: string) {
  return useQuery<TaskAnalytics>({
    queryKey: ["analytics", "tasks", from, to],
    queryFn: () => api<TaskAnalytics>(`/api/analytics/tasks?from=${from}&to=${to}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardKPIs() {
  return useQuery<DashboardKPI[]>({
    queryKey: ["analytics", "kpis"],
    queryFn: () => api<DashboardKPI[]>("/api/analytics/kpis"),
    staleTime: 2 * 60 * 1000,
  });
}