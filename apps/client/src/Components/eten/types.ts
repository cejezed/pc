// src/Components/eten/types.ts
// Type definitions for Mijn Keuken module

export type SourceType = 'manual' | 'url' | 'book' | 'scan';
export type MealType = 'ontbijt' | 'lunch' | 'avond' | 'snack';
export const MEAL_TYPES: MealType[] = ['ontbijt', 'lunch', 'avond', 'snack'];
export type IngredientCategory = 'produce' | 'meat' | 'dairy' | 'pantry' | 'spices' | 'frozen' | 'other';
export type DietType = 'geen' | 'vega' | 'vegan' | 'glutenvrij' | 'lactosevrij';

// =============================================
// Recipe Types
// =============================================

export interface Recipe {
  id: string;
  user_id: string;

  title: string;
  slug: string | null;

  source_type: SourceType;
  source_url: string | null;
  source_note: string | null;

  default_servings: number;
  prep_time_min: number | null;

  instructions: string | null;
  tags: string[];

  image_url: string | null;
  is_favourite: boolean;

  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;

  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory;

  is_optional: boolean;
  sort_order: number;

  created_at: string;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

// =============================================
// Meal Plan Types
// =============================================

export interface MealPlan {
  id: string;
  user_id: string;

  date: string; // ISO date
  meal_type: MealType;

  recipe_id: string | null;
  title_override: string | null;
  servings: number;

  notes: string | null;
  is_leftover: boolean;

  created_at: string;
  updated_at: string;
}

export interface MealPlanWithRecipe extends MealPlan {
  recipe: Recipe | null;
}

// =============================================
// Diet Settings Types
// =============================================

export interface UserDietSettings {
  user_id: string;

  default_servings: number;
  excluded_ingredients: string[];
  allergies: string[];
  diet_type: DietType;
  max_cooktime_weekdays: number | null;

  created_at: string;
  updated_at: string;
}

// =============================================
// Shopping List Types
// =============================================

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipe_ids: string[];
  recipe_titles: string[];
  checked: boolean;
}

export interface GroupedShoppingList {
  [category: string]: ShoppingListItem[];
}

// =============================================
// API Request/Response Types
// =============================================

export interface CreateRecipeInput {
  title: string;
  source_type: SourceType;
  source_url?: string;
  source_note?: string;
  default_servings: number;
  prep_time_min?: number;
  instructions?: string;
  tags?: string[];
  image_url?: string;
  ingredients: CreateIngredientInput[];
}

export interface CreateIngredientInput {
  name: string;
  quantity?: number;
  unit?: string;
  category?: IngredientCategory;
  is_optional?: boolean;
  sort_order?: number;
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
  is_favourite?: boolean;
}

export interface ImportRecipeInput {
  url: string;
}

export interface ImportRecipeResponse {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  success: boolean;
  error?: string;
}

export interface CreateMealPlanInput {
  date: string;
  meal_type: MealType;
  recipe_id?: string;
  title_override?: string;
  servings: number;
  notes?: string;
  is_leftover?: boolean;
}

export interface UpdateMealPlanInput extends Partial<CreateMealPlanInput> {
  id: string;
}

export interface GenerateShoppingListInput {
  weekStart: string;
  weekEnd: string;
}

export interface GenerateShoppingListResponse {
  items: ShoppingListItem[];
  grouped: GroupedShoppingList;
}

// =============================================
// UI Helper Types
// =============================================

export interface WeekView {
  weekStart: Date;
  weekEnd: Date;
  days: DayView[];
}

export interface DayView {
  date: Date;
  dateString: string;
  dayName: string;
  meals: {
    ontbijt: MealPlanWithRecipe | null;
    lunch: MealPlanWithRecipe | null;
    avond: MealPlanWithRecipe | null;
    snack: MealPlanWithRecipe | null;
  };
}

export interface RecipeFilters {
  search?: string;
  tags?: string[];
  favouritesOnly?: boolean;
  maxPrepTime?: number;
  dietType?: DietType;
}

// =============================================
// Coach/Nutrition Types
// =============================================

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface RecipeWarning {
  type: 'allergy' | 'excluded' | 'diet';
  message: string;
  ingredients: string[];
}

export interface DayNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  warnings: RecipeWarning[];
}

// =============================================
// Recipe Scan Types
// =============================================

export interface ScannedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategory | null;
  is_optional: boolean;
}

export interface ScannedRecipeDraft {
  title: string;
  default_servings: number;
  prep_time_min: number | null;
  tags: string[];
  ingredients: ScannedIngredient[];
  instructions: string[]; // Each step as a separate line
  notes: string;
  image_url: string; // Public URL after upload to Supabase Storage
}

export interface ScanRecipeResponse {
  recipeDraft: ScannedRecipeDraft;
}

export interface CreateRecipeFromScanInput {
  recipe: {
    title: string;
    default_servings: number;
    prep_time_min: number | null;
    tags: string[];
    instructions: string[];
    notes: string;
    image_url: string;
    source_type: 'scan';
  };
  ingredients: ScannedIngredient[];
}
