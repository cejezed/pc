// src/components/affirmations/hooks.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Affirmation, AffirmationLog, AffirmationStats } from "./types";

// Fetch all active affirmations
export const useAffirmations = () => {
  return useQuery({
    queryKey: ["affirmations"],
    queryFn: async (): Promise<Affirmation[]> => {
      const { data, error } = await supabase
        .from("affirmations")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Fetch affirmation stats
export const useAffirmationStats = () => {
  return useQuery({
    queryKey: ["affirmation-stats"],
    queryFn: async (): Promise<AffirmationStats | null> => {
      const { data, error } = await supabase
        .from("affirmation_stats")
        .select("*")
        .single();

      if (error) {
        // If no stats yet, return default
        return {
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
          avg_intensity: 0,
          completed_today: 0,
        };
      }
      return data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

// Fetch today's logs
export const useTodayLogs = () => {
  return useQuery({
    queryKey: ["affirmation-logs-today"],
    queryFn: async (): Promise<AffirmationLog[]> => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("affirmation_logs")
        .select("*")
        .gte("completed_at", `${today}T00:00:00`)
        .lte("completed_at", `${today}T23:59:59`);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Create affirmation
export const useCreateAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (affirmation: Omit<Affirmation, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("affirmations")
        .insert([
          {
            ...affirmation,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affirmations"] });
    },
  });
};

// Log affirmation completion
export const useLogAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<AffirmationLog, "id" | "user_id" | "completed_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("affirmation_logs")
        .insert([
          {
            ...log,
            user_id: user.id,
            completed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affirmation-logs-today"] });
      queryClient.invalidateQueries({ queryKey: ["affirmation-stats"] });
    },
  });
};

// Delete affirmation
export const useDeleteAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("affirmations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affirmations"] });
    },
  });
};

// Update affirmation
export const useUpdateAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Affirmation> & { id: string }) => {
      const { data, error } = await supabase
        .from("affirmations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affirmations"] });
    },
  });
};