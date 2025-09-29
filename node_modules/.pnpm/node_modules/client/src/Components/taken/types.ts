// src/Components/taken/types.ts

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'personal' | 'work' | 'health' | 'finance' | 'other';
  due_date?: string;
  completed_at?: string;
  estimated_minutes?: number;
  tags?: string[];
  project?: {
    id: string;
    name: string;
    color: string;
  };
  recurring?: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface TaskStats {
  total_tasks: number;
  completed_today: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  avg_completion_time: number;
}

// Form types
export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  due_date: string;
  estimated_minutes: string;
  tags: string[];
  notes: string;
  recurring: boolean;
  recurring_interval: 'daily' | 'weekly' | 'monthly';
}

// Constants
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Laag', icon: '🟢', color: '#10B981' },
  { value: 'medium', label: 'Gemiddeld', icon: '🟡', color: '#F59E0B' },
  { value: 'high', label: 'Hoog', icon: '🟠', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', icon: '🔴', color: '#EF4444' },
];

export const TASK_STATUSES = [
  { value: 'todo', label: 'Te doen', icon: '⭕', color: '#6B7280' },
  { value: 'in_progress', label: 'Bezig', icon: '🔄', color: '#3B82F6' },
  { value: 'done', label: 'Klaar', icon: '✅', color: '#10B981' },
  { value: 'cancelled', label: 'Geannuleerd', icon: '❌', color: '#EF4444' },
];

export const TASK_CATEGORIES = [
  { value: 'personal', label: 'Persoonlijk', icon: '👤', color: '#3B82F6' },
  { value: 'work', label: 'Werk', icon: '💼', color: '#8B5CF6' },
  { value: 'health', label: 'Gezondheid', icon: '🏥', color: '#10B981' },
  { value: 'finance', label: 'Financiën', icon: '💰', color: '#F59E0B' },
  { value: 'other', label: 'Overig', icon: '📝', color: '#6B7280' },
];

export const RECURRING_INTERVALS = [
  { value: 'daily', label: 'Dagelijks' },
  { value: 'weekly', label: 'Wekelijks' },
  { value: 'monthly', label: 'Maandelijks' },
];

// Helper types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskCategoryType = 'personal' | 'work' | 'health' | 'finance' | 'other';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly';