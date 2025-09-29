import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import type { Idea, IdeaComment, IdeaStats } from "./types";

// Ideas hooks
export const useIdeas = () => {
  return useQuery({
    queryKey: ["ideas"],
    queryFn: async (): Promise<Idea[]> => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddIdea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (idea: Omit<Idea, "id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("ideas")
        .insert({
          ...idea,
          user_id: user?.id,
        })
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

export const useUpdateIdea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Idea> & { id: string }) => {
      const { data, error } = await supabase
        .from("ideas")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
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

export const useDeleteIdea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ideas")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

export const useUpdateIdeaStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Idea['status'] }) => {
      const updates: Partial<Idea> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'implemented') {
        updates.implemented_at = new Date().toISOString();
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }
      
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

export const useIdeaComments = (ideaId: string) => {
  return useQuery({
    queryKey: ["idea-comments", ideaId],
    queryFn: async (): Promise<IdeaComment[]> => {
      const { data, error } = await supabase
        .from("idea_comments")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comment: Omit<IdeaComment, "id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("idea_comments")
        .insert({
          ...comment,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["idea-comments", data.idea_id] });
    },
  });
};

export const useIdeaStats = () => {
  return useQuery({
    queryKey: ["idea-stats"],
    queryFn: async (): Promise<IdeaStats> => {
      const { data: ideas, error } = await supabase
        .from("ideas")
        .select("status, category, priority");
      
      if (error) throw error;
      
      const stats: IdeaStats = {
        total_ideas: ideas.length,
        new_ideas: ideas.filter(i => i.status === 'new').length,
        in_progress: ideas.filter(i => i.status === 'in_progress').length,
        implemented: ideas.filter(i => i.status === 'implemented').length,
        archived: ideas.filter(i => i.status === 'archived').length,
        by_category: {},
        by_priority: {},
      };
      
      ideas.forEach(idea => {
        stats.by_category[idea.category] = (stats.by_category[idea.category] || 0) + 1;
        stats.by_priority[idea.priority] = (stats.by_priority[idea.priority] || 0) + 1;
      });
      
      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
};