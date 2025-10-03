// src/Components/abonnementen/hooks.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import type { Subscription, UpcomingDeadline } from "./types";

export const useSubscriptions = () =>
  useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Subscription[];
    },
    staleTime: 2 * 60 * 1000,
  });

export const useUpcomingDeadlines = () =>
  useQuery<UpcomingDeadline[]>({
    queryKey: ["subscription-deadlines"],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active");
      
      if (error) throw error;
      
      // Calculate deadlines client-side
      const deadlines: UpcomingDeadline[] = [];
      const today = new Date();
      
      (subscriptions || []).forEach((sub: any) => {
        if (!sub.next_billing_date || !sub.auto_renew) return;
        
        const billing = new Date(sub.next_billing_date);
        const deadline = new Date(billing);
        deadline.setDate(deadline.getDate() - (sub.cancellation_deadline_days || 30));
        
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= (sub.reminder_days || 7)) {
          deadlines.push({
            subscription: sub as Subscription,
            days_until_deadline: daysUntil,
          });
        }
      });
      
      return deadlines.sort((a, b) => a.days_until_deadline - b.days_until_deadline);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Subscription>) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subscription> }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useDeleteSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};