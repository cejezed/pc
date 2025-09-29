// invoices/types.ts

export type Invoice = {
  id: string;
  user_id: string;
  project_id: string;
  number: string | null;
  issue_date: string;
  due_date: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  project?: {
    id: string;
    name: string;
    client_name: string | null;
    city: string | null;
    default_rate_cents: number;
  };
  items?: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  project_id: string;
  phase_code: string;
  description: string | null;
  quantity_minutes: number;
  unit_rate_cents: number;
  amount_cents: number;
};

export type Project = {
  id: string;
  name: string;
  client_name: string | null;
  city: string | null;
  default_rate_cents: number;
  billing_type?: 'hourly' | 'fixed';
  phase_budgets?: Record<string, number>;
};

export type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string;
  minutes: number;
  notes: string | null;
  invoiced_at: string | null;
  invoice_number: string | null;
};

export type Phase = {
  code: string;
  name: string;
  sort_order: number;
};

export type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';