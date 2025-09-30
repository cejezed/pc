import type { Subscription, SubscriptionCategory } from './types';

export function EUR(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatCurrency(cents: number): string {
  return EUR(cents);
}

export function formatBillingCycle(cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly'): string {
  const cycles = {
    monthly: 'Maandelijks',
    yearly: 'Jaarlijks',
    quarterly: 'Kwartaal',
    weekly: 'Wekelijks',
  };
  return cycles[cycle];
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCancellationDeadline(nextBillingDate: string, noticeDays: number): string {
  const date = new Date(nextBillingDate);
  date.setDate(date.getDate() - noticeDays);
  return date.toISOString().split('T')[0];
}

interface CategoryInfo {
  icon: string;
  color: string;
  bgColor: string;
}

export function getCategoryInfo(category: SubscriptionCategory): CategoryInfo {
  const categories: Record<SubscriptionCategory, CategoryInfo> = {
    streaming: { icon: '📺', color: 'text-purple-700', bgColor: 'bg-purple-50' },
    software: { icon: '💻', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    fitness: { icon: '🏋️', color: 'text-green-700', bgColor: 'bg-green-50' },
    music: { icon: '🎵', color: 'text-pink-700', bgColor: 'bg-pink-50' },
    cloud: { icon: '☁️', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
    education: { icon: '📚', color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
    other: { icon: '📦', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  };
  return categories[category] || categories.other;
}

export function getCategoryIcon(category: SubscriptionCategory): string {
  return getCategoryInfo(category).icon;
}

export function getCategoryColor(category: SubscriptionCategory): string {
  return getCategoryInfo(category).color;
}

export function calculateYearlyAmount(amountCents: number, billingCycle: Subscription['billing_cycle']): number {
  switch (billingCycle) {
    case 'monthly': return amountCents * 12;
    case 'yearly': return amountCents;
    case 'quarterly': return amountCents * 4;
    case 'weekly': return amountCents * 52;
    default: return amountCents;
  }
}