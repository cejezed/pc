export type Project = {
  id: string;
  name: string;
  default_rate_cents: number;
  billing_type?: "hourly" | "fixed";
  city?: string;
  client_name?: string;
  phase_budgets?: Record<string, number>;
  phase_rates_cents?: Record<string, number>;
  invoiced_phases?: string[];
  archived?: boolean;
  created_at?: string;
};

export type Phase = {
  code: string;
  name: string;
  sort_order: number;
};

export type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string;
  minutes?: number;
  hours?: number;
  notes?: string | null;
  invoiced_at?: string | null;
  invoice_number?: string | null;
  projects?: Project;
  project?: Project;
  phases?: Phase;
  phase?: Phase;
};

export const FALLBACK_PHASES: Phase[] = [
  { code: "schetsontwerp", name: "Schetsontwerp", sort_order: 1 },
  { code: "voorlopig-ontwerp", name: "Voorlopig ontwerp", sort_order: 2 },
  { code: "vo-tekeningen", name: "VO tekeningen", sort_order: 3 },
  { code: "definitief-ontwerp", name: "Definitief ontwerp", sort_order: 4 },
  { code: "do-tekeningen", name: "DO tekeningen", sort_order: 5 },
  { code: "bouwvoorbereiding", name: "Bouwvoorbereiding", sort_order: 6 },
];

export const phaseShortcodes: Record<string, string> = {
  "schetsontwerp": "SO",
  "voorlopig-ontwerp": "VO",
  "vo-tekeningen": "VO-T",
  "definitief-ontwerp": "DO",
  "do-tekeningen": "DO-T",
  "bouwvoorbereiding": "BV",
};