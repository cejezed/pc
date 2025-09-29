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
  project?: {
    name: string;
    client_name: string;
  };
  items?: InvoiceItem[];
};

export type InvoiceItem = {
  id?: string;
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
  projects?: { 
    name?: string | null; 
    client_name?: string | null;
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
};

export type InvoiceKPIs = {
  teOntvangen: number;
  ontvangenDezeMaand: number;
  openstaand: number;
};