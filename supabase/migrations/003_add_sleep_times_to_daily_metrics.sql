-- Add sleep time columns to daily_metrics table
ALTER TABLE daily_metrics
ADD COLUMN IF NOT EXISTS bedtijd TIME,
ADD COLUMN IF NOT EXISTS wakker_tijd TIME;

-- Add comment to explain the columns
COMMENT ON COLUMN daily_metrics.bedtijd IS 'Tijd van naar bed gaan (HH:MM)';
COMMENT ON COLUMN daily_metrics.wakker_tijd IS 'Tijd van wakker worden (HH:MM)';
