// src/Components/abonnementen/hooks.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Subscription, UpcomingDeadline } from "./types";

export const useSubscriptions = () =>
  useQuery<Subscription[]>({
    queryKey: ["subscriptions"],
    queryFn: () => api<Subscription[]>("/api/subscriptions"),
    staleTime: 2 * 60 * 1000,
  });

export const useUpcomingDeadlines = () =>
  useQuery<UpcomingDeadline[]>({
    queryKey: ["subscription-deadlines"],
    queryFn: () => api<UpcomingDeadline[]>("/api/subscriptions/deadlines"),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Subscription>) =>
      api<Subscription>("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscription> }) =>
      api<Subscription>(`/api/subscriptions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};

export const useDeleteSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/subscriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["subscription-deadlines"] });
    },
  });
};