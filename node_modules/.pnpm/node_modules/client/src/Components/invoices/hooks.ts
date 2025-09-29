// invoices/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import type { Invoice, Project, Phase, TimeEntry } from './types';

/** INVOICES */
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects(id, name, client_name, city, default_rate_cents),
          items:invoice_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      number?: string | null;
      issue_date: string;
      due_date: string;
      status: 'draft' | 'sent';
      items: Array<{
        project_id: string;
        phase_code: string;
        description: string;
        quantity_minutes: number;
        unit_rate_cents: number;
        amount_cents: number;
      }>;
      time_entry_ids: string[];
    }) => {
      // 1. Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          project_id: payload.project_id,
          number: payload.number,
          issue_date: payload.issue_date,
          due_date: payload.due_date,
          status: payload.status,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 2. Create invoice items
      const itemsWithInvoiceId = payload.items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) throw itemsError;

      // 3. Mark time entries as invoiced
      if (payload.time_entry_ids.length > 0) {
        // Update existing entries one by one to preserve their data
        for (const entryId of payload.time_entry_ids) {
          const { error: entriesError } = await supabase
            .from('time_entries')
            .update({
              invoiced_at: payload.issue_date,
              invoice_number: payload.number,
            })
            .eq('id', entryId);

          if (entriesError) throw entriesError;
        }
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['unbilled-entries'] });
      qc.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice['status'] }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/** PROJECTS */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    },
  });
}

/** PHASES */
export function usePhases() {
  return useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Phase[];
    },
  });
}

/** UNBILLED TIME ENTRIES */
export function useUnbilledEntries() {
  return useQuery({
    queryKey: ['unbilled-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .is('invoiced_at', null)
        .order('occurred_on', { ascending: true });

      if (error) throw error;
      return (data || []) as TimeEntry[];
    },
  });
}