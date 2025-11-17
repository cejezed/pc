// src/features/eten/utils.ts
// Utility functions for Mijn Keuken

import type { MealType, IngredientCategory } from './types';

// ==============================================
// Date helpers
// ==============================================

export function getWeekDates(date: Date = new Date()): Date[] {
  const week = [];
  const startOfWeek = new Date(date);
  // Start from Monday
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + i);
    week.push(currentDay);
  }

  return week;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateNL(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ==============================================
// Meal type helpers
// ==============================================

export const MEAL_TYPES: MealType[] = ['ontbijt', 'lunch', 'avond', 'snack'];

export function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    ontbijt: 'Ontbijt',
    lunch: 'Lunch',
    avond: 'Avondeten',
    snack: 'Snack',
  };
  return labels[mealType];
}

export function getMealTypeEmoji(mealType: MealType): string {
  const emojis: Record<MealType, string> = {
    ontbijt: '🌅',
    lunch: '🥗',
    avond: '🍽️',
    snack: '🍪',
  };
  return emojis[mealType];
}

// ==============================================
// Category helpers
// ==============================================

export function getCategoryLabel(category: IngredientCategory): string {
  const labels: Record<IngredientCategory, string> = {
    produce: 'Groente & Fruit',
    meat: 'Vlees & Vis',
    dairy: 'Zuivel',
    pantry: 'Voorraadkast',
    spices: 'Kruiden & Specerijen',
    frozen: 'Diepvries',
    other: 'Overig',
  };
  return labels[category];
}

export function getCategoryColor(category: IngredientCategory): string {
  const colors: Record<IngredientCategory, string> = {
    produce: 'bg-green-100 text-green-800',
    meat: 'bg-red-100 text-red-800',
    dairy: 'bg-blue-100 text-blue-800',
    pantry: 'bg-yellow-100 text-yellow-800',
    spices: 'bg-purple-100 text-purple-800',
    frozen: 'bg-cyan-100 text-cyan-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category];
}

// ==============================================
// Unit helpers
// ==============================================

export function formatQuantity(quantity: number | null, unit: string | null): string {
  if (!quantity) return '';

  const formatted = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

// ==============================================
// Tag helpers
// ==============================================

export const COMMON_TAGS = [
  'Snel',
  'Vegetarisch',
  'Vegan',
  'Glutenvrij',
  'Lactosevrij',
  'Kidsproof',
  'High-protein',
  'Low-carb',
  'Comfort food',
  'Healthy',
  'Batch cooking',
  'Slowcooker',
  'One-pot',
  'Pasta',
  'Rijst',
  'Soep',
  'Salade',
  'Ontbijt',
  'Lunch',
  'Diner',
  'Snack',
  'Dessert',
];

export function getTagColor(tag: string): string {
  const tagColors: { [key: string]: string } = {
    'Snel': 'bg-orange-100 text-orange-800',
    'Vegetarisch': 'bg-green-100 text-green-800',
    'Vegan': 'bg-emerald-100 text-emerald-800',
    'Glutenvrij': 'bg-yellow-100 text-yellow-800',
    'High-protein': 'bg-red-100 text-red-800',
    'Low-carb': 'bg-blue-100 text-blue-800',
    'Healthy': 'bg-teal-100 text-teal-800',
    'Comfort food': 'bg-pink-100 text-pink-800',
  };

  return tagColors[tag] || 'bg-gray-100 text-gray-800';
}

// ==============================================
// Time helpers
// ==============================================

export function formatPrepTime(minutes: number | null): string {
  if (!minutes) return '';

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} uur`;
  }

  return `${hours}u ${mins}min`;
}

// ==============================================
// Slug helpers
// ==============================================

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
