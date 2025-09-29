// src/Components/abonnementen/helpers.ts

export type Subscription = {
  id: string;
  name: string;
  provider: string;
  cost_cents: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  category: 'software' | 'entertainment' | 'utilities' | 'business' | 'health' | 'other';
  start_date: string;
  end_date?: string;
  renewal_date: string;
  status: 'active' | 'cancelled' | 'expired';
  notes?: string;
  website_url?: string;
  cancellation_notice_days?: number;
  created_at: string;
  updated_at: string;
};

export type SubscriptionCategory = {
  key: string;
  name: string;
  icon: string;
  color: string;
};

export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  { key: 'software', name: 'Software & Tools', icon: '💻', color: 'blue' },
  { key: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'purple' },
  { key: 'utilities', name: 'Utilities', icon: '⚡', color: 'yellow' },
  { key: 'business', name: 'Business', icon: '💼', color: 'green' },
  { key: 'health', name: 'Health & Fitness', icon: '🏃', color: 'red' },
  { key: 'other', name: 'Overig', icon: '📦', color: 'gray' },
];

/** ──────────────────────────────
 * Currency helpers
 * ────────────────────────────── */
export const EUR = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});
export const toEUR = (amount: number): string => EUR.format(amount);
export const formatCurrency = (amount: number): string => EUR.format(amount);

/** ──────────────────────────────
 * Kosten berekeningen
 * ────────────────────────────── */
export const calculateMonthlyCost = (subscription: Subscription): number => {
  const { cost_cents, billing_cycle } = subscription;
  const costInEuros = cost_cents / 100;

  switch (billing_cycle) {
    case 'monthly':
      return costInEuros;
    case 'quarterly':
      return costInEuros / 3;
    case 'yearly':
      return costInEuros / 12;
    default:
      return costInEuros;
  }
};

export const calculateYearlyCost = (subscription: Subscription): number => {
  return calculateMonthlyCost(subscription) * 12;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const todayISO = (): string => new Date().toISOString().split('T')[0];

/** ──────────────────────────────
 * Renewals & deadlines
 * ────────────────────────────── */
export const getDaysUntilRenewal = (renewalDate: string): number => {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getSubscriptionStatus = (subscription: Subscription): {
  status: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
  message: string;
  color: string;
} => {
  if (subscription.status === 'cancelled') {
    return { status: 'cancelled', message: 'Geannuleerd', color: 'gray' };
  }
  if (subscription.status === 'expired') {
    return { status: 'expired', message: 'Verlopen', color: 'red' };
  }

  const daysUntilRenewal = getDaysUntilRenewal(subscription.renewal_date);

  if (daysUntilRenewal <= 0) {
    return { status: 'expired', message: 'Verlopen', color: 'red' };
  }
  if (daysUntilRenewal <= 7) {
    return {
      status: 'expiring_soon',
      message: `Vernieuwt over ${daysUntilRenewal} dag${daysUntilRenewal === 1 ? '' : 'en'}`,
      color: 'orange',
    };
  }
  if (daysUntilRenewal <= 30) {
    return {
      status: 'expiring_soon',
      message: `Vernieuwt over ${daysUntilRenewal} dagen`,
      color: 'yellow',
    };
  }
  return { status: 'active', message: 'Actief', color: 'green' };
};

export const getCategoryInfo = (categoryKey: string): SubscriptionCategory => {
  return (
    SUBSCRIPTION_CATEGORIES.find((cat) => cat.key === categoryKey) ||
    SUBSCRIPTION_CATEGORIES.find((cat) => cat.key === 'other')!
  );
};

export const generateRenewalCalendar = (
  subscriptions: Subscription[],
): { date: string; subscriptions: Subscription[] }[] => {
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const renewalMap = new Map<string, Subscription[]>();

  activeSubscriptions.forEach((subscription) => {
    const renewalDate = subscription.renewal_date.split('T')[0];
    if (!renewalMap.has(renewalDate)) {
      renewalMap.set(renewalDate, []);
    }
    renewalMap.get(renewalDate)!.push(subscription);
  });

  return Array.from(renewalMap.entries())
    .map(([date, subs]) => ({ date, subscriptions: subs }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const calculateTotalsByCategory = (subscriptions: Subscription[]) => {
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const categoryTotals = new Map<string, { monthly: number; yearly: number; count: number }>();

  SUBSCRIPTION_CATEGORIES.forEach((category) => {
    categoryTotals.set(category.key, { monthly: 0, yearly: 0, count: 0 });
  });

  activeSubscriptions.forEach((subscription) => {
    const monthly = calculateMonthlyCost(subscription);
    const yearly = calculateYearlyCost(subscription);
    const current = categoryTotals.get(subscription.category)!;
    categoryTotals.set(subscription.category, {
      monthly: current.monthly + monthly,
      yearly: current.yearly + yearly,
      count: current.count + 1,
    });
  });

  return categoryTotals;
};

export const getCancellationDeadlines = (subscriptions: Subscription[]): Subscription[] => {
  const today = new Date();

  return subscriptions
    .filter((sub) => sub.status === 'active' && sub.cancellation_notice_days && sub.cancellation_notice_days > 0)
    .map((sub) => {
      const renewalDate = new Date(sub.renewal_date);
      const cancellationDeadline = new Date(renewalDate);
      cancellationDeadline.setDate(renewalDate.getDate() - sub.cancellation_notice_days!);

      return {
        ...sub,
        cancellation_deadline: cancellationDeadline.toISOString().split('T')[0],
        days_to_deadline: Math.ceil((cancellationDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      };
    })
    .filter((sub: any) => sub.days_to_deadline <= 30 && sub.days_to_deadline > 0)
    .sort((a: any, b: any) => a.days_to_deadline - b.days_to_deadline);
};

/** Enkelvoudige helper (voor abonnement-modal.tsx) */
export const getCancellationDeadline = (
  sub: Subscription,
): { date: string; days_to_deadline: number } | null => {
  if (!sub.cancellation_notice_days || sub.cancellation_notice_days <= 0 || sub.status !== 'active') {
    return null;
  }
  const renewalDate = new Date(sub.renewal_date);
  const cancellationDeadline = new Date(renewalDate);
  cancellationDeadline.setDate(renewalDate.getDate() - sub.cancellation_notice_days);

  const today = new Date();
  const days_to_deadline = Math.ceil((cancellationDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return { date: cancellationDeadline.toISOString().split('T')[0], days_to_deadline };
};

/** ──────────────────────────────
 * Volgende facturatie
 * ────────────────────────────── */

/** Berekent de eerstvolgende renewal op/na vandaag op basis van start + cycle. */
export const calculateNextRenewalDate = (
  startDate: string,
  billingCycle: 'monthly' | 'quarterly' | 'yearly',
): string => {
  const start = new Date(startDate);
  const today = new Date();
  let nextRenewal = new Date(start);

  while (nextRenewal <= today) {
    switch (billingCycle) {
      case 'monthly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        break;
      case 'quarterly':
        nextRenewal.setMonth(nextRenewal.getMonth() + 3);
        break;
      case 'yearly':
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        break;
    }
  }
  return nextRenewal.toISOString().split('T')[0];
};

/**
 * Geeft de te gebruiken volgende facturatiedatum (ISO YYYY-MM-DD).
 * - Als `renewal_date` in de toekomst ligt, gebruik die.
 * - Anders bereken op basis van `start_date` + `billing_cycle`.
 */
export const getNextBillingDate = (
  sub:
    | Subscription
    | {
        start_date: string;
        billing_cycle: 'monthly' | 'quarterly' | 'yearly';
        renewal_date?: string;
        status?: 'active' | 'cancelled' | 'expired';
      },
): string => {
  const today = new Date();
  const renewal = sub.renewal_date ? new Date(sub.renewal_date) : null;

  if (renewal && !isNaN(renewal.getTime()) && renewal > today) {
    return renewal.toISOString().split('T')[0];
  }
  return calculateNextRenewalDate(sub.start_date, sub.billing_cycle);
};

/** Handig info-object voor UI: datum + dagen tot. */
export const getNextBillingInfo = (
  sub: Subscription,
): { date: string; days_until: number } => {
  const date = getNextBillingDate(sub);
  const days_until = Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );
  return { date, days_until };
};
