// src/components/abonnementen/types.ts
export type BillingCycle = "monthly" | "yearly" | "quarterly" | "weekly";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";
export type SubscriptionCategory = "streaming" | "software" | "fitness" | "music" | "cloud" | "education" | "other";

export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: SubscriptionCategory;
  cost_cents: number;
  billing_cycle: BillingCycle;
  start_date: string; // YYYY-MM-DD
  end_date?: string;
  cancellation_period_days?: number;
  remind_days_before: number;
  status: SubscriptionStatus;
  payment_method?: string;
  auto_renew: boolean;
  next_billing_date?: string;
  cancellation_deadline?: string; // computed
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export type UpcomingDeadline = {
  subscription: Subscription;
  days_until_deadline: number;
};