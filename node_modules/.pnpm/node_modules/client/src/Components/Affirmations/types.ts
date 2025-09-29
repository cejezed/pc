// src/components/affirmations/types.ts

export type AffirmationCategory = 'financial' | 'health' | 'learning' | 'personal' | 'business';

export interface Affirmation {
  id: string;
  user_id: string;
  statement: string;
  category: AffirmationCategory;
  times_per_day: number;
  reminder_times: string[]; // ['07:00', '12:00', '22:00']
  active: boolean;
  audio_url?: string;
  linked_goal_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface AffirmationLog {
  id: string;
  user_id: string;
  affirmation_id: string;
  completed_at: string;
  emotional_intensity: number; // 1-5
  notes?: string;
  felt_authentic: boolean;
}

export interface AffirmationStats {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  avg_intensity: number;
  completed_today: number;
}

export interface AffirmationFormData {
  statement: string;
  category: AffirmationCategory;
  times_per_day: number;
  reminder_times: string[];
  linked_goal_id: string;
}

// Category Icons & Colors
export const CATEGORY_ICONS: Record<AffirmationCategory, string> = {
  financial: '💰',
  health: '🏋️',
  learning: '📚',
  personal: '🎨',
  business: '💼',
};

export const CATEGORY_COLORS: Record<AffirmationCategory, string> = {
  financial: 'bg-green-100 text-green-800 border-green-200',
  health: 'bg-blue-100 text-blue-800 border-blue-200',
  learning: 'bg-purple-100 text-purple-800 border-purple-200',
  personal: 'bg-pink-100 text-pink-800 border-pink-200',
  business: 'bg-orange-100 text-orange-800 border-orange-200',
};

// Template Affirmations
export const TEMPLATES = [
  {
    id: '1',
    text: 'Ik verdien €[X] door uitzonderlijke waarde te leveren',
    category: 'financial' as AffirmationCategory,
  },
  {
    id: '2',
    text: 'Ik ben gezond en energiek met [TARGET]',
    category: 'health' as AffirmationCategory,
  },
  {
    id: '3',
    text: 'Ik lees dagelijks [X] minuten om te groeien',
    category: 'learning' as AffirmationCategory,
  },
  {
    id: '4',
    text: 'Ik lever uitzonderlijke waarde aan mijn klanten',
    category: 'business' as AffirmationCategory,
  },
  {
    id: '5',
    text: 'Ik ben kalm, gefocust en productief in alles wat ik doe',
    category: 'personal' as AffirmationCategory,
  },
  {
    id: '6',
    text: 'Ik trek ideale klanten aan die mijn waarde herkennen',
    category: 'business' as AffirmationCategory,
  },
];