import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice, UnbilledHours, Project } from "./types";

// Date helpers
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
export const parseDate = (s?: string) => (s ? new Date(s + "T00:00:00") : undefined);
export const fmtDate = (s?: string) => 
  s ? new Date(s + "T00:00:00").toLocaleDateString("nl-NL") : "-";
export const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Data fetching
export const useInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => api("/api/invoices"),
    staleTime: 30_000,
  });

export const useOverdueInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: ["invoices", "overdue"],
    queryFn: () => api("/api/invoices/overdue"),
    staleTime: 60_000,
  });

export const useUnbilled = () =>
  useQuery<UnbilledHours[]>({
    queryKey: ["invoices", "unbilled-hours"],
    queryFn: () => api("/api/invoices/unbilled-hours"),
  });

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api("/api/projects"),
  });

// Mutations
export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) =>
      api("/api/invoices", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", "unbilled-hours"] });
    },
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useSendInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invoices/${id}/send`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useMarkPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payment_date }: { id: string; payment_date: string }) =>
      api(`/api/invoices/${id}/payment`, {
        method: "PUT",
        body: JSON.stringify({ payment_date }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useCancelInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useCreateCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/invoices/${id}/credit`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};