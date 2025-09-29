// src/Components/ideas/types.ts

export interface Idea {
  id: string;
  title: string;
  description?: string;
  category: 'business' | 'product' | 'feature' | 'improvement' | 'other';
  status: 'new' | 'in_progress' | 'implemented' | 'archived' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  estimated_effort?: 'small' | 'medium' | 'large' | 'extra_large';
  estimated_value?: 'low' | 'medium' | 'high';
  notes?: string;
  source?: string; // Where the idea came from
  created_at: string;
  updated_at?: string;
  implemented_at?: string;
  archived_at?: string;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface IdeaStats {
  total_ideas: number;
  new_ideas: number;
  in_progress: number;
  implemented: number;
  archived: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

// Form types
export interface IdeaFormData {
  title: string;
  description: string;
  category: 'business' | 'product' | 'feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  estimated_effort: 'small' | 'medium' | 'large' | 'extra_large';
  estimated_value: 'low' | 'medium' | 'high';
  notes: string;
  source: string;
}

// Constants
export const IDEA_CATEGORIES = [
  { value: 'business', label: 'Business Idee', icon: '💼', color: '#3B82F6' },
  { value: 'product', label: 'Product Idee', icon: '📦', color: '#10B981' },
  { value: 'feature', label: 'Feature Idee', icon: '⚡', color: '#F59E0B' },
  { value: 'improvement', label: 'Verbetering', icon: '🔧', color: '#8B5CF6' },
  { value: 'other', label: 'Overig', icon: '💡', color: '#6B7280' },
];

export const IDEA_STATUSES = [
  { value: 'new', label: 'Nieuw', icon: '🆕', color: '#3B82F6' },
  { value: 'in_progress', label: 'In Progress', icon: '🔄', color: '#F59E0B' },
  { value: 'implemented', label: 'Geïmplementeerd', icon: '✅', color: '#10B981' },
  { value: 'archived', label: 'Gearchiveerd', icon: '📁', color: '#6B7280' },
  { value: 'rejected', label: 'Afgewezen', icon: '❌', color: '#EF4444' },
];

export const IDEA_PRIORITIES = [
  { value: 'low', label: 'Laag', icon: '🟢', color: '#10B981' },
  { value: 'medium', label: 'Gemiddeld', icon: '🟡', color: '#F59E0B' },
  { value: 'high', label: 'Hoog', icon: '🟠', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', icon: '🔴', color: '#EF4444' },
];

export const EFFORT_ESTIMATES = [
  { value: 'small', label: 'Klein (1-2 dagen)', icon: '🟢', color: '#10B981' },
  { value: 'medium', label: 'Gemiddeld (1 week)', icon: '🟡', color: '#F59E0B' },
  { value: 'large', label: 'Groot (1 maand)', icon: '🟠', color: '#F97316' },
  { value: 'extra_large', label: 'Extra Groot (3+ maanden)', icon: '🔴', color: '#EF4444' },
];

export const VALUE_ESTIMATES = [
  { value: 'low', label: 'Lage waarde', icon: '💰', color: '#6B7280' },
  { value: 'medium', label: 'Gemiddelde waarde', icon: '💰💰', color: '#F59E0B' },
  { value: 'high', label: 'Hoge waarde', icon: '💰💰💰', color: '#10B981' },
];

// Helper types
export type IdeaCategory = 'business' | 'product' | 'feature' | 'improvement' | 'other';
export type IdeaStatus = 'new' | 'in_progress' | 'implemented' | 'archived' | 'rejected';
export type IdeaPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EffortEstimate = 'small' | 'medium' | 'large' | 'extra_large';
export type ValueEstimate = 'low' | 'medium' | 'high';