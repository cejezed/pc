import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase";
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facturen')
        .select('*, project:projects(name, client_name), items:factuur_items(*)')
        .order('invoice_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

export const useOverdueInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: ["invoices", "overdue"],
    queryFn: async () => {
      const today = ymd(new Date());
      const { data, error } = await supabase
        .from('facturen')
        .select('*, project:projects(name, client_name)')
        .eq('status', 'sent')
        .lt('due_date', today);
      
      if (error) throw error;
      
      // Update status to overdue
      if (data && data.length > 0) {
        const ids = data.map(inv => inv.id);
        await supabase
          .from('facturen')
          .update({ status: 'overdue' })
          .in('id', ids);
      }
      
      return data || [];
    },
    staleTime: 60_000,
  });

export const useUnbilled = () =>
  useQuery<UnbilledHours[]>({
    queryKey: ["invoices", "unbilled-hours"],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('*, projects(id, name, client_name, default_rate_cents)')
        .is('invoiced_at', null)
        .order('occurred_on', { ascending: false });
      
      if (error) throw error;

      // Group by project
      const grouped = (entries || []).reduce((acc, entry) => {
        const pid = entry.project_id;
        if (!acc[pid]) {
          acc[pid] = {
            project_id: pid,
            project_name: entry.projects?.name || 'Unknown',
            client_name: entry.projects?.client_name || '',
            total_hours: 0,
            total_amount_cents: 0,
            entries: [],
          };
        }
        
        const hours = (entry.minutes || 0) / 60;
        const rate = entry.projects?.default_rate_cents || 0;
        
        acc[pid].entries.push(entry);
        acc[pid].total_hours += hours;
        acc[pid].total_amount_cents += Math.round(hours * rate);
        
        return acc;
      }, {} as Record<string, UnbilledHours>);

      return Object.values(grouped);
    },
  });

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

// Mutations
export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      // Calculate total amount
      const totalAmount = payload.items.reduce(
        (sum: number, item: any) => sum + (item.amount_cents || 0), 
        0
      );

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('facturen')
        .insert({
          invoice_number: payload.invoice_number,
          project_id: payload.project_id,
          invoice_date: payload.invoice_date,
          due_date: payload.due_date,
          amount_cents: totalAmount,
          status: payload.status || 'draft',
          notes: payload.notes,
          vat_percent: payload.vat_percent || 21,
          payment_terms: payload.payment_terms || '30',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      if (payload.items && payload.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('factuur_items')
          .insert(
            payload.items.map((item: any) => ({
              factuur_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              rate_cents: item.rate_cents,
              amount_cents: item.amount_cents,
            }))
          );
        
        if (itemsError) throw itemsError;
      }

      // Mark time entries as invoiced
      if (payload.time_entry_ids && payload.time_entry_ids.length > 0) {
        const { error: timeError } = await supabase
          .from('time_entries')
          .update({ 
            invoiced_at: payload.invoice_date,
            invoice_number: payload.invoice_number,
          })
          .in('id', payload.time_entry_ids);
        
        if (timeError) throw timeError;
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoices", "unbilled-hours"] });
    },
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete related items
      await supabase.from('factuur_items').delete().eq('factuur_id', id);
      
      // Then delete invoice
      const { error } = await supabase
        .from('facturen')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useSendInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facturen')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useMarkPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_date }: { id: string; payment_date: string }) => {
      const { error } = await supabase
        .from('facturen')
        .update({ 
          status: 'paid',
          payment_date,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useCancelInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facturen')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};

export const useCreateCreditNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (originalId: string) => {
      // Get original invoice
      const { data: original, error: fetchError } = await supabase
        .from('facturen')
        .select('*, items:factuur_items(*)')
        .eq('id', originalId)
        .single();
      
      if (fetchError) throw fetchError;

      // Create credit note
      const { data: creditNote, error: insertError } = await supabase
        .from('facturen')
        .insert({
          invoice_number: `CN-${original.invoice_number}`,
          project_id: original.project_id,
          invoice_date: ymd(new Date()),
          due_date: ymd(new Date()),
          amount_cents: -original.amount_cents,
          status: 'draft',
          notes: `Creditnota voor ${original.invoice_number}`,
          vat_percent: original.vat_percent,
          payment_terms: original.payment_terms,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      // Copy items with negative amounts
      if (original.items && original.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('factuur_items')
          .insert(
            original.items.map((item: any) => ({
              factuur_id: creditNote.id,
              description: item.description,
              quantity: -item.quantity,
              rate_cents: item.rate_cents,
              amount_cents: -item.amount_cents,
            }))
          );
        
        if (itemsError) throw itemsError;
      }

      return creditNote;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
};