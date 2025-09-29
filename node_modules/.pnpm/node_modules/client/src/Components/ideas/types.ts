// src/components/ideas/types.ts - Voor bestaande database schema

export interface Idea {
  id: string;
  owner_id: string;
  title: string;
  note?: string; // Was "description" in mijn code
  status: string; // Vrij tekstveld in jouw database
  tags?: string[];
  priority: number; // Integer in jouw database (was enum in mijn code)
  created_at: string;
  updated_at?: string;
}

// Comments worden NIET ondersteund (tabel bestaat niet)
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

// Form types - aangepast voor jouw schema
export interface IdeaFormData {
  title: string;
  note: string; // Was "description"
  status: string;
  priority: number; // Integer
  tags: string[];
}

// Status opties - aanpasbaar aan jouw gebruik
export const IDEA_STATUSES = [
  { value: 'new', label: 'Nieuw', icon: '🆕', color: '#3B82F6' },
  { value: 'idea', label: 'Idee', icon: '💡', color: '#8B5CF6' },
  { value: 'planning', label: 'Planning', icon: '📋', color: '#F59E0B' },
  { value: 'in_progress', label: 'In Progress', icon: '🔄', color: '#F59E0B' },
  { value: 'done', label: 'Klaar', icon: '✅', color: '#10B981' },
  { value: 'implemented', label: 'Geïmplementeerd', icon: '✅', color: '#10B981' },
  { value: 'archived', label: 'Gearchiveerd', icon: '📁', color: '#6B7280' },
  { value: 'rejected', label: 'Afgewezen', icon: '❌', color: '#EF4444' },
];

// Priority als nummer (1-5)
export const IDEA_PRIORITIES = [
  { value: 1, label: 'Laag', icon: '🟢', color: '#10B981' },
  { value: 2, label: 'Gemiddeld', icon: '🟡', color: '#F59E0B' },
  { value: 3, label: 'Hoog', icon: '🟠', color: '#F97316' },
  { value: 4, label: 'Urgent', icon: '🔴', color: '#EF4444' },
  { value: 5, label: 'Kritiek', icon: '🔴🔴', color: '#DC2626' },
];

// Geen categories in jouw database, dus verwijderd
// Geen effort/value estimates, dus verwijderd

export type IdeaStatus = string; // Vrij tekstveld
export type IdeaPriority = number; // Integer 1-5