-- Shopping Lists Migration
-- Created: 2025-01-19
-- Adds shopping list functionality with Supabase storage

-- =============================================
-- Table: shopping_lists
-- Stores shopping lists per user per week
-- =============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- =============================================
-- Table: shopping_list_checked_items
-- Stores checked items from generated shopping list
-- =============================================
CREATE TABLE IF NOT EXISTS shopping_list_checked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shopping_list_id, item_key)
);

-- =============================================
-- Table: shopping_list_manual_items
-- Stores manually added items
-- =============================================
CREATE TABLE IF NOT EXISTS shopping_list_manual_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Table: shopping_list_frequent_items
-- Tracks frequently used items for suggestions
-- =============================================
CREATE TABLE IF NOT EXISTS shopping_list_frequent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_name)
);

-- =============================================
-- RLS Policies
-- =============================================

-- Shopping lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Checked items
ALTER TABLE shopping_list_checked_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checked items"
  ON shopping_list_checked_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_checked_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own checked items"
  ON shopping_list_checked_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_checked_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  ));

-- Manual items
ALTER TABLE shopping_list_manual_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manual items"
  ON shopping_list_manual_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_manual_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own manual items"
  ON shopping_list_manual_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shopping_lists
    WHERE shopping_lists.id = shopping_list_manual_items.shopping_list_id
    AND shopping_lists.user_id = auth.uid()
  ));

-- Frequent items
ALTER TABLE shopping_list_frequent_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own frequent items"
  ON shopping_list_frequent_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own frequent items"
  ON shopping_list_frequent_items FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_shopping_lists_user_week ON shopping_lists(user_id, week_start);
CREATE INDEX idx_checked_items_list ON shopping_list_checked_items(shopping_list_id);
CREATE INDEX idx_manual_items_list ON shopping_list_manual_items(shopping_list_id);
CREATE INDEX idx_frequent_items_user ON shopping_list_frequent_items(user_id, frequency DESC);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
