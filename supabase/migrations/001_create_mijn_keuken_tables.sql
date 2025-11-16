-- Mijn Keuken Database Schema
-- Created: 2025-01-16

-- =============================================
-- Table: recipes
-- Stores user recipes from manual entry, URL import, or books
-- =============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT,

  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'url', 'book')),
  source_url TEXT,
  source_note TEXT,

  default_servings INTEGER NOT NULL DEFAULT 2,
  prep_time_min INTEGER,

  instructions TEXT,
  tags TEXT[] DEFAULT '{}',

  image_url TEXT,
  is_favourite BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_favourite ON recipes(user_id, is_favourite) WHERE is_favourite = true;

-- RLS Policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================
-- Table: recipe_ingredients
-- Stores ingredients per recipe
-- =============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  quantity DOUBLE PRECISION,
  unit TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('produce', 'meat', 'dairy', 'pantry', 'spices', 'frozen', 'other')),

  is_optional BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recipe lookups
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_category ON recipe_ingredients(category);

-- RLS Policies (inherit from recipe)
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ingredients of own recipes"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients for own recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of own recipes"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients of own recipes"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );


-- =============================================
-- Table: meal_plans
-- Stores planned meals per day and meal type
-- =============================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('ontbijt', 'lunch', 'avond', 'snack')),

  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  title_override TEXT,
  servings INTEGER NOT NULL DEFAULT 2,

  notes TEXT,
  is_leftover BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date, meal_type)
);

-- Indexes
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX idx_meal_plans_recipe ON meal_plans(recipe_id);

-- RLS Policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================
-- Table: user_diet_settings
-- Stores user's dietary preferences and restrictions
-- =============================================
CREATE TABLE IF NOT EXISTS user_diet_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  default_servings INTEGER DEFAULT 2,
  excluded_ingredients TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  diet_type TEXT DEFAULT 'geen' CHECK (diet_type IN ('geen', 'vega', 'vegan', 'glutenvrij', 'lactosevrij')),
  max_cooktime_weekdays INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_diet_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet settings"
  ON user_diet_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet settings"
  ON user_diet_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet settings"
  ON user_diet_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diet settings"
  ON user_diet_settings FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================
-- Functions and Triggers
-- =============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_diet_settings_updated_at
  BEFORE UPDATE ON user_diet_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
