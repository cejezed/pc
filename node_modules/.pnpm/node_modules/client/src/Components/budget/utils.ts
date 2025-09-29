// src/Components/budget/utils.ts

/**
 * Format currency in EUR
 */
export const formatEUR = (cents: number): string =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);

/**
 * Convert euros to cents
 */
export const eurosToCents = (euros: number): number => Math.round(euros * 100);

/**
 * Convert cents to euros
 */
export const centsToEuros = (cents: number): number => cents / 100;

/**
 * Calculate percentage
 */
export const percentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

/**
 * Get status color for budget usage
 */
export const getBudgetStatusColor = (percentage: number): string => {
  if (percentage >= 100) return "text-red-600 bg-red-50 border-red-200";
  if (percentage >= 80) return "text-orange-600 bg-orange-50 border-orange-200";
  if (percentage >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
};

/**
 * Get transaction type color
 */
export const getTransactionTypeColor = (type: 'income' | 'expense' | 'transfer'): string => {
  switch (type) {
    case 'income':
      return "text-green-600 bg-green-50";
    case 'expense':
      return "text-red-600 bg-red-50";
    case 'transfer':
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

/**
 * Format transaction amount with color
 */
export const formatTransactionAmount = (cents: number, type: 'income' | 'expense' | 'transfer'): string => {
  const amount = formatEUR(Math.abs(cents));
  switch (type) {
    case 'income':
      return `+${amount}`;
    case 'expense':
      return `-${amount}`;
    default:
      return amount;
  }
};

/**
 * Get today's date in ISO format
 */
export const todayISO = (): string => new Date().toISOString().split("T")[0];

/**
 * Get first day of current month
 */
export const firstDayOfMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
};

/**
 * Get last day of current month
 */
export const lastDayOfMonth = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
};

/**
 * Get date range for period
 */
export const getDateRange = (period: 'week' | 'month' | 'quarter' | 'year'): { from: string; to: string } => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  
  switch (period) {
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      return {
        from: startOfWeek.toISOString().split("T")[0],
        to: endOfWeek.toISOString().split("T")[0]
      };
    }
    case 'month':
      return {
        from: firstDayOfMonth(),
        to: lastDayOfMonth()
      };
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startMonth = quarter * 3;
      const from = new Date(now.getFullYear(), startMonth, 1).toISOString().split("T")[0];
      const to = new Date(now.getFullYear(), startMonth + 3, 0).toISOString().split("T")[0];
      return { from, to };
    }
    case 'year':
      return {
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`
      };
    default:
      return { from: today, to: today };
  }
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format date relative (today, yesterday, etc.)
 */
export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Vandaag";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Gisteren";
  } else {
    return formatDate(dateString);
  }
};

/**
 * Get month name in Dutch
 */
export const getMonthName = (month: number): string => {
  const months = [
    "Januari", "Februari", "Maart", "April", "Mei", "Juni",
    "Juli", "Augustus", "September", "Oktober", "November", "December"
  ];
  return months[month - 1] || "";
};

/**
 * Calculate budget remaining days
 */
export const getBudgetRemainingDays = (endDate: string): number => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if budget is over threshold
 */
export const isBudgetOverThreshold = (spent: number, budget: number, threshold: number = 80): boolean => {
  const usedPercentage = percentage(spent, budget);
  return usedPercentage >= threshold;
};

/**
 * Get next occurrence for recurring transaction
 */
export const getNextOccurrence = (
  lastDate: string, 
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly',
  count: number = 1
): string => {
  const date = new Date(lastDate);
  
  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + count);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (count * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + count);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + count);
      break;
  }
  
  return date.toISOString().split("T")[0];
};

/**
 * Validate transaction amount
 */
export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * Parse amount string to cents
 */
export const parseAmountToCents = (amount: string): number => {
  const cleaned = amount.replace(/[€\s,]/g, '').replace(',', '.');
  const euros = parseFloat(cleaned);
  return isNaN(euros) ? 0 : eurosToCents(euros);
};

/**
 * Generate color for category
 */
export const generateCategoryColor = (index: number): string => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
  ];
  return colors[index % colors.length];
};

/**
 * Group transactions by date
 */
export const groupTransactionsByDate = (transactions: any[]): Record<string, any[]> => {