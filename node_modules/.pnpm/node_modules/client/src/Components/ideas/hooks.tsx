// src/components/ideas/hooks.tsx - Voor bestaande database schema
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Idea, IdeaStats } from "./types";

// Fetch all ideas
export const useIdeas = (filters?: {
  status?: string;
  priority?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["ideas", filters],
    queryFn: async (): Promise<Idea[]> => {
      let query = supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', parseInt(filters.priority));
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Add new idea
export const useAddIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idea: Omit<Idea, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ideas")
        .insert([
          {
            ...idea,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

// Update idea
export const useUpdateIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Idea> & { id: string }) => {
      const { data, error } = await supabase
        .from("ideas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

// Delete idea
export const useDeleteIdea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

// Update idea status
export const useUpdateIdeaStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Idea['status'] }) => {
      const { data, error } = await supabase
        .from("ideas")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

// Comments zijn NIET aanwezig in jouw database, dus dummy implementaties
export const useIdeaComments = (ideaId: string) => {
  return useQuery({
    queryKey: ["idea-comments", ideaId],
    queryFn: async () => {
      // No comments table exists in your schema
      return [];
    },
    enabled: false, // Disabled omdat tabel niet bestaat
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: any) => {
      // No comments table exists
      throw new Error("Comments not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-comments"] });
    },
  });
};

// Get idea statistics
export const useIdeaStats = () => {
  return useQuery({
    queryKey: ["idea-stats"],
    queryFn: async (): Promise<IdeaStats> => {
      const { data: ideas, error } = await supabase
        .from("ideas")
        .select("*");

      if (error) throw error;

      // Status mapping - jouw database heeft andere statussen
      const stats: IdeaStats = {
        total_ideas: ideas?.length || 0,
        new_ideas: ideas?.filter(i => i.status === 'new' || i.status === 'idea').length || 0,
        in_progress: ideas?.filter(i => i.status === 'in_progress' || i.status === 'planning').length || 0,
        implemented: ideas?.filter(i => i.status === 'implemented' || i.status === 'done').length || 0,
        archived: ideas?.filter(i => i.status === 'archived').length || 0,
        by_category: {}, // Geen categories in jouw schema
        by_priority: {},
      };

      // Priority is integer in jouw database
      ideas?.forEach(idea => {
        const priority = idea.priority?.toString() || 'unknown';
        stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
      });

      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
};