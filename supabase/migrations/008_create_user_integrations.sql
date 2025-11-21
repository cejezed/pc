-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  google_calendar_ics TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own integrations" 
  ON user_integrations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" 
  ON user_integrations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" 
  ON user_integrations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" 
  ON user_integrations FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
