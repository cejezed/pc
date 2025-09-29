export type Habit = {
  id: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  target_count: number;
  icon: string;
  color: string;
  active: boolean;
  sort_order: number;
  reminder_times?: string[];
  unit?: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  value?: number | null;
  notes?: string;
};

export type HabitStats = {
  current_streak: number;
  longest_streak: number;
  completion_rate: number; // 0..1
  total_completions: number;
  this_week: number;
  this_month: number;
};

export type HeatmapDay = {
  day: number;
  count: number;
  total: number;
  ratio: number;
};