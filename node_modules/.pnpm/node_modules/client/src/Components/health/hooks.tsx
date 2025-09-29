import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ======================= Types ======================= */

export type Workout = {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  intensity?: "low" | "medium" | "high";
  logged_at: string;
  created_at?: string;
};

export type Steps = {
  id: string;
  step_count: number;
  step_date: string; // YYYY-MM-DD
  source?: string;
  created_at?: string;
};

export type EnergyCheck = {
  id: string;
  energy_level: number; // 1-5
  mood?: string;
  notes?: string;
  logged_at: string;
  created_at?: string;
};

export type Meal = {
  id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  meal_date: string; // YYYY-MM-DD
  meal_time?: string; // HH:MM
  
  // Optionele nutritie
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  
  // Ratings (1-5 sterren)
  satisfaction_rating?: number;
  healthiness_rating?: number;
  
  notes?: string;
  tags?: string[];
  
  logged_at: string;
  created_at?: string;
};

/* ======================= Workouts Hooks ======================= */

export function useWorkouts() {
  return useQuery<Workout[]>({
    queryKey: ["workouts"],
    queryFn: () => api<Workout[]>("/api/workouts"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Workout, "id" | "created_at">) => 
      api<Workout>("/api/workouts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/workouts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

/* ======================= Steps Hooks ======================= */

export function useSteps() {
  return useQuery<Steps[]>({
    queryKey: ["steps"],
    queryFn: () => api<Steps[]>("/api/steps"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddSteps() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Steps, "id" | "created_at">) =>
      api<Steps>("/api/steps", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
    },
  });
}

export function useDeleteSteps() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/steps/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
    },
  });
}

/* ======================= Energy Hooks ======================= */

export function useEnergyChecks() {
  return useQuery<EnergyCheck[]>({
    queryKey: ["energy-checks"],
    queryFn: () => api<EnergyCheck[]>("/api/energy-checks"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddEnergyCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<EnergyCheck, "id" | "created_at">) =>
      api<EnergyCheck>("/api/energy-checks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-checks"] });
    },
  });
}

export function useDeleteEnergyCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/energy-checks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-checks"] });
    },
  });
}

/* ======================= Meals Hooks (NIEUW) ======================= */

export function useMeals() {
  return useQuery<Meal[]>({
    queryKey: ["meals"],
    queryFn: () => api<Meal[]>("/api/meals"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Meal, "id" | "created_at" | "logged_at">) =>
      api<Meal>("/api/meals", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          logged_at: new Date().toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Meal> }) =>
      api<Meal>(`/api/meals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/meals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}