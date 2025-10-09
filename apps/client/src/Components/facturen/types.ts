export type Invoice = {
  id: string;
  invoice_number: string;
  project_id: string;
  invoice_date: string;
  due_date: string;
  amount_cents: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  time_entry_ids?: string[];
  payment_date?: string;
  vat_percent: number;
  payment_terms: string;
  sent_at?: string;
  created_at?: string;
  project?: {
    name: string;
    client_name: string;
  };
  items?: InvoiceItem[];
};

export type InvoiceItem = {
  id?: string;
  factuur_id?: string;
  description: string;
  quantity: number;
  rate_cents: number;
  amount_cents: number;
};

export type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string;
  minutes?: number | null;
  notes?: string | null;
  invoiced_at?: string | null;
  invoice_number?: string | null;
  projects?: { 
    id?: string;
    name?: string | null; 
    client_name?: string | null;
    default_rate_cents?: number | null;
  } | null;
};

export type UnbilledHours = {
  project_id: string;
  project_name: string;
  client_name: string;
  total_hours: number;
  total_amount_cents: number;
  entries: TimeEntry[];
};

export type Project = {
  id: string;
  name: string;
  client_name?: string | null;
  default_rate_cents?: number | null;
  city?: string | null;
  billing_type?: "hourly" | "fixed";
};

export type InvoiceKPIs = {
  teOntvangen: number;
  ontvangenDezeMaand: number;
  openstaand: number;
};