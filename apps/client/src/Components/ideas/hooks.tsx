// src/Components/ideas/hooks.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idea, IdeaComment, IdeaStats } from "./types";

// Ideas hooks
export const useIdeas = (filters?: {
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["ideas", filters],
    queryFn: async (): Promise<Idea[]> => {
      // Mock implementation
      const mockIdeas: Idea[] = [
        {
          id: "1",
          title: "AI-powered project cost estimation",
          description: "Gebruik machine learning om automatisch project kosten te schatten op basis van historische data",
          category: "feature",
          status: "new", 
          priority: "high",
          tags: ["AI", "automation", "estimation"],
          estimated_effort: "large",
          estimated_value: "high",
          notes: "Zou veel tijd kunnen besparen bij offertes maken",
          source: "Client feedback",
          created_at: new Date().toISOString(),
        },
        {
          id: "2", 
          title: "Mobile app voor tijd registratie",
          description: "Native app om onderweg tijd te kunnen registreren met GPS tracking",
          category: "product",
          status: "in_progress",
          priority: "medium",
          tags: ["mobile", "time-tracking", "GPS"],
          estimated_effort: "extra_large",
          estimated_value: "medium",
          notes: "Eerste prototype al gemaakt",
          source: "Team brainstorm",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          title: "Automatische factuur herinneringen", 
          description: "Stuur automatisch herinneringen voor openstaande facturen",
          category: "feature",
          status: "implemented",
          priority: "medium",
          tags: ["automation", "invoicing", "email"],
          estimated_effort: "small",
          estimated_value: "medium",
          implemented_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ];

      // Apply filters
      let filtered = mockIdeas;
      if (filters?.category) {
        filtered = filtered.filter(idea => idea.category === filters.category);
      }
      if (filters?.status) {
        filtered = filtered.filter(idea => idea.status === filters.status);
      }
      if (filters?.priority) {
        filtered = filtered.filter(idea => idea.priority === filters.priority);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(idea => 
          idea.title.toLowerCase().includes(search) ||
          idea.description?.toLowerCase().includes(search) ||
          idea.tags?.some(tag => tag.toLowerCase().includes(search))
        );
      }

      return filtered;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useAddIdea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (idea: Omit<Idea, "id" | "created_at" | "updated_at">) => {
      console.log("Adding idea:", idea);
      const newIdea: Idea = { 
        id: Date.now().toString(), 
        ...idea, 
        created_at: new Date().toISOString() 
      };
      return newIdea;
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
      console.log("Updating idea:", id, updates);
      return { id, ...updates, updated_at: new Date().toISOString() };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

export const useDeleteIdea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting idea:", id);
      return true;
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
      console.log("Updating idea status:", id, status);
      const updates: Partial<Idea> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'implemented') {
        updates.implemented_at = new Date().toISOString();
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }
      
      return { id, ...updates };
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
      // Mock implementation
      return [
        {
          id: "1",
          idea_id: ideaId,
          comment: "Dit is een geweldig idee! Zou veel tijd kunnen besparen.",
          created_at: new Date().toISOString(),
        }
      ];
    },
    enabled: !!ideaId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comment: Omit<IdeaComment, "id" | "created_at">) => {
      console.log("Adding comment:", comment);
      return { 
        id: Date.now().toString(), 
        ...comment, 
        created_at: new Date().toISOString() 
      };
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
      // Mock implementation
      return {
        total_ideas: 5,
        new_ideas: 2,
        in_progress: 1,
        implemented: 1,
        archived: 1,
        by_category: { feature: 2, product: 1, business: 1, improvement: 1 },
        by_priority: { high: 1, medium: 3, low: 1 },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};