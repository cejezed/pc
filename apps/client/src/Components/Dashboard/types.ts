// src/Components/Dashboard/types.ts
export type DailyMetric = {
  id: string;
  user_id: string;
  date: string;
  
  // Bestaande velden
  energie_score: number;
  slaap_score: number;
  workout_done: boolean;
  
  // Nieuwe slaap velden
  lang_wakker: boolean;
  kort_wakker: boolean;
  nap: boolean;

  // Nieuwe activiteit velden
  ochtend_workout: boolean;
  golf_oefenen: boolean;
  golfen: boolean;
  mtb: boolean;

  // Gezondheid velden
  ogen_schoonmaken: boolean;
  oogdruppels: boolean;
  allergie_medicatie: boolean;

  // Nieuwe score velden
  schouder_pijn: number;
  stress_niveau: number;
  
  created_at: string;
  updated_at?: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  status: string;
  priority: number;
  due_date?: string;
  completed_at?: string;
  created_at: string;
};

export type Idea = {
  id: string;
  user_id: string;
  title: string;
  note?: string;
  status: string;
  priority: number;
  tags?: string[];
  created_at: string;
};