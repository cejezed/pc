import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Habit, HabitLog, HabitStats } from "./types";

// Date helpers
export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
export const todayISO = () => fmtDate(new Date());
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

function toMonthRange(viewMonth: Date) {
  return {
    from: fmtDate(startOfMonth(viewMonth)),
    to: fmtDate(endOfMonth(viewMonth))
  };
}

// Data fetching hooks
export const useHabits = () => 
  useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: () => api("/api/habits"),
    staleTime: 5 * 60 * 1000
  });

export const useHabitLogs = (viewMonth: Date) => {
  const { from, to } = toMonthRange(viewMonth);
  return useQuery<HabitLog[]>({
    queryKey: ["habit-logs", from, to],
    queryFn: () => api(`/api/habit-logs?from=${from}&to=${to}`),
    staleTime: 60 * 1000
  });
};

export const useHabitStats = (habitId: string | null) =>
  useQuery<HabitStats>({
    queryKey: ["habit-stats", habitId],
    queryFn: () => api(`/api/habits/${habitId}/stats`),
    enabled: !!habitId
  });

// Mutation hooks
export const useCreateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Habit>) => 
      api("/api/habits", { 
        method: "POST", 
        body: JSON.stringify(input) 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] })
  });
};

export const useUpdateHabit = (id?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Habit>) => 
      api(`/api/habits/${id}`, { 
        method: "PUT", 
        body: JSON.stringify(input) 
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] })
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      api(`/api/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] })
  });
};

export const useLogCompletion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      habit_id: string;
      completed_date: string;
      value?: number | null;
      notes?: string;
    }) => api("/api/habit-logs", { 
      method: "POST", 
      body: JSON.stringify(payload) 
    }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
      if (variables?.habit_id) {
        qc.invalidateQueries({ queryKey: ["habit-stats", variables.habit_id] });
      }
    }
  });
};

// Confetti hook
export function useEmojiConfetti() {
  const [show, setShow] = React.useState(false);
  const timer = React.useRef<number | null>(null);
  
  const burst = () => {
    setShow(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), 1200);
  };
  
  return { show, burst };
}