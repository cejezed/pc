// src/components/affirmations/hooks.tsx - NO AUTH VERSION
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
      // Since we're not using auth, we'll calculate stats from logs directly
      const { data: logs, error } = await supabase
        .from("affirmation_logs")
        .select("*")
        .order("completed_at", { ascending: false });

      if (error) {
        // If no logs yet, return default
        return {
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
          avg_intensity: 0,
          completed_today: 0,
        };
      }

      if (!logs || logs.length === 0) {
        return {
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
          avg_intensity: 0,
          completed_today: 0,
        };
      }

      // Calculate stats from logs
      const total_completions = logs.length;
      const avg_intensity = logs.reduce((sum, log) => sum + (log.emotional_intensity || 0), 0) / total_completions;
      
      // Count today's completions
      const today = new Date().toISOString().split("T")[0];
      const completed_today = logs.filter(log => 
        log.completed_at && log.completed_at.startsWith(today)
      ).length;

      // Simple streak calculation (consecutive days with at least one completion)
      let current_streak = 0;
      let longest_streak = 0;
      let temp_streak = 0;
      
      // Group logs by date
      const dateGroups = new Map();
      logs.forEach(log => {
        if (log.completed_at) {
          const date = log.completed_at.split("T")[0];
          if (!dateGroups.has(date)) {
            dateGroups.set(date, []);
          }
          dateGroups.get(date).push(log);
        }
      });

      const dates = Array.from(dateGroups.keys()).sort().reverse();
      
      // Calculate current streak
      let checkDate = new Date();
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const dateStr = checkDate.toISOString().split("T")[0];
        if (dateGroups.has(dateStr)) {
          current_streak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Calculate longest streak (simplified)
      longest_streak = Math.max(current_streak, dates.length > 0 ? Math.min(dates.length, 10) : 0);

      return {
        current_streak,
        longest_streak,
        total_completions,
        avg_intensity,
        completed_today,
      };
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

// Create affirmation - NO AUTH
export const useCreateAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (affirmation: Omit<Affirmation, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data, error } = await supabase
        .from("affirmations")
        .insert([
          {
            ...affirmation,
            user_id: null, // Explicitly set to null
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

// Log affirmation completion - NO AUTH
export const useLogAffirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<AffirmationLog, "id" | "user_id" | "completed_at">) => {
      const { data, error } = await supabase
        .from("affirmation_logs")
        .insert([
          {
            ...log,
            user_id: null, // Explicitly set to null
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