import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";

/* ======================= Types ======================= */

export type Workout = {
  id: string;
  workout_type?: "cardio" | "strength" | "flexibility" | "sports" | "other";
  title?: string;
  duration_minutes?: number;
  intensity_level?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
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
  const queryClient = useQueryClient();
  
  const query = useQuery<Workout[]>({
    queryKey: ["workouts"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("logged_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Workout[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addWorkout = useMutation({
    mutationFn: async (payload: Omit<Workout, "id" | "created_at">) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("workouts")
        .insert(payload);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  return {
    ...query,
    workouts: query.data,
    addWorkout,
    deleteWorkout,
  };
}

export function useAddWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<Workout, "id" | "created_at">) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("workouts")
        .insert(payload);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

/* ======================= Steps Hooks ======================= */

export function useSteps() {
  return useQuery<Steps[]>({
    queryKey: ["steps"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { data, error } = await supabase
        .from("steps")
        .select("*")
        .order("step_date", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Steps[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddSteps() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<Steps, "id" | "created_at">) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("steps")
        .insert(payload);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
    },
  });
}

export function useDeleteSteps() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("steps")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
    },
  });
}

/* ======================= Energy Hooks ======================= */

export function useEnergyChecks() {
  return useQuery<EnergyCheck[]>({
    queryKey: ["energy-checks"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { data, error } = await supabase
        .from("energy_checks")
        .select("*")
        .order("logged_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as EnergyCheck[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddEnergyCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Omit<EnergyCheck, "id" | "created_at">) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("energy_checks")
        .insert(payload);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-checks"] });
    },
  });
}

export function useDeleteEnergyCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("energy_checks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["energy-checks"] });
    },
  });
}

/* ======================= Meals Hooks ======================= */

export function useMeals() {
  const queryClient = useQueryClient();
  
  const query = useQuery<Meal[]>({
    queryKey: ["meals"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("meal_date", { ascending: false });
      
      if (error) throw error;
      return (data || []) as Meal[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addMeal = useMutation({
    mutationFn: async (payload: Partial<Meal>) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("meals")
        .insert({
          ...payload,
          logged_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });

  return {
    ...query,
    meals: query.data,
    addMeal,
    deleteMeal,
  };
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<Meal>) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("meals")
        .insert({
          ...payload,
          logged_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meal> }) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("meals")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
    },
  });
}