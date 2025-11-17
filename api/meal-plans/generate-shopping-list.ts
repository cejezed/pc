// api/meal-plans/generate-shopping-list.ts
// POST /api/meal-plans/generate-shopping-list
// Generates aggregated shopping list from meal plans in a date range

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const config = {
  runtime: 'edge',
};

interface AggregatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  recipe_ids: string[];
  recipe_titles: string[];
}

function normalizeUnit(unit: string | null): string {
  if (!unit) return 'stuk';

  const unitMap: { [key: string]: string } = {
    'gram': 'g',
    'g': 'g',
    'kilogram': 'kg',
    'kg': 'kg',
    'liter': 'l',
    'l': 'l',
    'ml': 'ml',
    'milliliter': 'ml',
    'eetlepel': 'el',
    'el': 'el',
    'theelepel': 'tl',
    'tl': 'tl',
    'stuks': 'stuk',
    'stuk': 'stuk',
    'st': 'stuk',
  };

  const normalized = unitMap[unit.toLowerCase()];
  return normalized || unit;
}

function canCombine(unit1: string, unit2: string): boolean {
  const u1 = normalizeUnit(unit1);
  const u2 = normalizeUnit(unit2);

  // Same unit can be combined
  if (u1 === u2) return true;

  // Weight conversions
  if ((u1 === 'g' && u2 === 'kg') || (u1 === 'kg' && u2 === 'g')) return true;

  // Volume conversions
  if ((u1 === 'ml' && u2 === 'l') || (u1 === 'l' && u2 === 'ml')) return true;

  return false;
}

function convertToBaseUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  const normalized = normalizeUnit(unit);

  // Convert to grams
  if (normalized === 'kg') {
    return { quantity: quantity * 1000, unit: 'g' };
  }

  // Convert to ml
  if (normalized === 'l') {
    return { quantity: quantity * 1000, unit: 'ml' };
  }

  return { quantity, unit: normalized };
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user from auth header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { weekStart, weekEnd } = await req.json();

    if (!weekStart || !weekEnd) {
      return new Response(JSON.stringify({ error: 'weekStart and weekEnd are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all meal plans in the date range
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select('*, recipe:recipes(id, title, default_servings)')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd);

    if (mealPlansError) throw mealPlansError;

    if (!mealPlans || mealPlans.length === 0) {
      return new Response(JSON.stringify({
        items: [],
        grouped: {},
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all unique recipe IDs
    const recipeIds = [...new Set(
      mealPlans
        .filter(mp => mp.recipe_id)
        .map(mp => mp.recipe_id)
    )];

    if (recipeIds.length === 0) {
      return new Response(JSON.stringify({
        items: [],
        grouped: {},
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all ingredients for these recipes
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .in('recipe_id', recipeIds);

    if (ingredientsError) throw ingredientsError;

    // Aggregate ingredients
    const aggregated = new Map<string, AggregatedIngredient>();

    for (const mealPlan of mealPlans) {
      if (!mealPlan.recipe || !mealPlan.recipe_id) continue;

      const recipe = mealPlan.recipe as any;
      const scaleFactor = mealPlan.servings / (recipe.default_servings || 1);

      const recipeIngredients = ingredients?.filter(ing => ing.recipe_id === mealPlan.recipe_id) || [];

      for (const ingredient of recipeIngredients) {
        if (ingredient.is_optional) continue;

        const normalizedName = normalizeIngredientName(ingredient.name);
        const key = `${normalizedName}_${normalizeUnit(ingredient.unit || 'stuk')}_${ingredient.category}`;

        const scaledQuantity = (ingredient.quantity || 0) * scaleFactor;
        const { quantity, unit } = convertToBaseUnit(scaledQuantity, ingredient.unit || 'stuk');

        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          existing.quantity += quantity;
          if (!existing.recipe_ids.includes(mealPlan.recipe_id!)) {
            existing.recipe_ids.push(mealPlan.recipe_id!);
            existing.recipe_titles.push(recipe.title);
          }
        } else {
          aggregated.set(key, {
            name: ingredient.name, // Keep original capitalization
            quantity,
            unit,
            category: ingredient.category,
            recipe_ids: [mealPlan.recipe_id!],
            recipe_titles: [recipe.title],
          });
        }
      }
    }

    // Convert to array and group by category
    const items = Array.from(aggregated.values()).map(item => ({
      ...item,
      checked: false,
    }));

    const grouped: { [category: string]: typeof items } = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    // Sort categories
    const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'spices', 'frozen', 'other'];
    const sortedGrouped: typeof grouped = {};
    for (const category of categoryOrder) {
      if (grouped[category]) {
        sortedGrouped[category] = grouped[category];
      }
    }

    return new Response(JSON.stringify({
      items,
      grouped: sortedGrouped,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Shopping list generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
