// src/Components/budget/types.ts

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  type: 'income' | 'expense' | 'savings';
  parent_id?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  amount_cents: number;
  description: string;
  category_id: string;
  transaction_date: string;
  type: 'income' | 'expense' | 'transfer';
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other';
  reference?: string;
  notes?: string;
  recurring?: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags?: string[];
  created_at: string;
  updated_at?: string;
  // Relations
  category?: BudgetCategory;
}

export interface Budget {
  id: string;
  name: string;
  category_id: string;
  amount_cents: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  alert_threshold?: number; // percentage (80 = 80%)
  active: boolean;
  created_at: string;
  updated_at?: string;
  // Relations
  category?: BudgetCategory;
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
}

export interface BudgetSummary {
  total_income: number;
  total_expenses: number;
  net_amount: number;
  budgets_count: number;
  over_budget_count: number;
  categories_count: number;
}

export interface TransactionSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  net_amount: number;
  transaction_count: number;
  top_categories: Array<{
    category_id: string;
    category_name: string;
    amount: number;
    percentage: number;
  }>;
}

export interface RecurringTransaction {
  id: string;
  template_name: string;
  amount_cents: number;
  description: string;
  category_id: string;
  type: 'income' | 'expense';
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_count: number; // every X days/weeks/months
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  active: boolean;
  auto_create: boolean;
  created_at: string;
  // Relations
  category?: BudgetCategory;
}

// Form types
export interface TransactionFormData {
  amount: string;
  description: string;
  category_id: string;
  transaction_date: string;
  type: 'income' | 'expense' | 'transfer';
  payment_method: string;
  notes: string;
  tags: string[];
}

export interface CategoryFormData {
  name: string;
  color: string;
  icon: string;
  description: string;
  type: 'income' | 'expense' | 'savings';
  parent_id: string;
}

export interface BudgetFormData {
  name: string;
  category_id: string;
  amount: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  alert_threshold: string;
}

// Constants
export const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'id' | 'created_at'>[] = [
  // Income categories
  { name: 'Salaris', color: '#10B981', icon: '💰', type: 'income', sort_order: 1, active: true },
  { name: 'Freelance', color: '#3B82F6', icon: '💼', type: 'income', sort_order: 2, active: true },
  { name: 'Investeringen', color: '#8B5CF6', icon: '📈', type: 'income', sort_order: 3, active: true },
  
  // Expense categories
  { name: 'Wonen', color: '#EF4444', icon: '🏠', type: 'expense', sort_order: 10, active: true },
  { name: 'Transport', color: '#F59E0B', icon: '🚗', type: 'expense', sort_order: 11, active: true },
  { name: 'Boodschappen', color: '#84CC16', icon: '🛒', type: 'expense', sort_order: 12, active: true },
  { name: 'Utilities', color: '#06B6D4', icon: '⚡', type: 'expense', sort_order: 13, active: true },
  { name: 'Entertainment', color: '#EC4899', icon: '🎬', type: 'expense', sort_order: 14, active: true },
  { name: 'Kleding', color: '#6366F1', icon: '👕', type: 'expense', sort_order: 15, active: true },
  { name: 'Gezondheid', color: '#14B8A6', icon: '🏥', type: 'expense', sort_order: 16, active: true },
  { name: 'Educatie', color: '#F97316', icon: '📚', type: 'expense', sort_order: 17, active: true },
  
  // Savings categories  
  { name: 'Noodfonds', color: '#059669', icon: '🛡️', type: 'savings', sort_order: 20, active: true },
  { name: 'Vakantie', color: '#0EA5E9', icon: '✈️', type: 'savings', sort_order: 21, active: true },
  { name: 'Pensioen', color: '#7C3AED', icon: '🏦', type: 'savings', sort_order: 22, active: true },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Contant', icon: '💵' },
  { value: 'card', label: 'Pinpas', icon: '💳' },
  { value: 'bank_transfer', label: 'Overschrijving', icon: '🏦' },
  { value: 'other', label: 'Anders', icon: '📝' },
];

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Wekelijks' },
  { value: 'monthly', label: 'Maandelijks' },
  { value: 'quarterly', label: 'Per kwartaal' },
  { value: 'yearly', label: 'Jaarlijks' },
];

export const CATEGORY_ICONS = [
  '💰', '💼', '📈', '🏠', '🚗', '🛒', '⚡', '🎬', 
  '👕', '🏥', '📚', '🛡️', '✈️', '🏦', '🍔', '☕',
  '📱', '🎵', '🏋️', '🎮', '🌳', '🎨', '🔧', '📊'
];

export const CATEGORY_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#64748B', '#6B7280', '#374151', '#111827'
];

// Helper types
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'savings';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';