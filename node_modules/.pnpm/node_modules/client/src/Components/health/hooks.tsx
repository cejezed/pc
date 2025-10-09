// src/Components/health/hooks.tsx - MET AUTH
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ========== TYPES ==========
export type Workout = {
  id: string;
  user_id: string;
  workout_type: "cardio" | "strength" | "flexibility" | "sports" | "other";
  title?: string;
  duration_minutes?: number;
  intensity_level?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  logged_at: string;
  created_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  meal_date: string;
  meal_time?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  satisfaction_rating?: number;
  healthiness_rating?: number;
  notes?: string;
  tags?: string[];
  logged_at: string;
  created_at: string;
};

// ========== WORKOUTS HOOKS ==========
export function useWorkouts() {
  const queryClient = useQueryClient();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data as Workout[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addWorkout = useMutation({
    mutationFn: async (workout: Omit<Workout, "id" | "created_at" | "user_id">) => {
      if (!supabase) throw new Error("Supabase not initialized");

      // ✅ Haal user op
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workouts")
        .insert([{
          ...workout,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
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

  return { workouts, isLoading, addWorkout, deleteWorkout };
}

// ========== MEALS HOOKS ==========
export function useMeals() {
  const queryClient = useQueryClient();

  const { data: meals, isLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("meal_date", { ascending: false });

      if (error) throw error;
      return data as Meal[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addMeal = useMutation({
    mutationFn: async (meal: Partial<Meal>) => {
      if (!supabase) throw new Error("Supabase not initialized");

      // ✅ Haal user op
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("meals")
        .insert([{
          ...meal,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
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

  return { meals, isLoading, addMeal, deleteMeal };
}