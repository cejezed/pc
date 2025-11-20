-- Extend daily_metrics to serve as the full 'health_data' table
alter table public.daily_metrics
add column if not exists breakfast_taken boolean,
add column if not exists lunch_taken boolean,
add column if not exists dinner_taken boolean,
add column if not exists notes text;

-- Add comments for clarity
comment on column public.daily_metrics.breakfast_taken is 'Did the user have breakfast?';
comment on column public.daily_metrics.lunch_taken is 'Did the user have lunch?';
comment on column public.daily_metrics.dinner_taken is 'Did the user have dinner?';
comment on column public.daily_metrics.notes is 'Optional daily notes or observations';
