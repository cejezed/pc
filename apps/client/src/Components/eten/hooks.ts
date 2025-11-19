// src/Components/eten/hooks.ts
// React Query hooks for Mijn Keuken

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Recipe,
  RecipeWithIngredients,
  RecipeFilters,
  CreateRecipeInput,
  UpdateRecipeInput,
  ImportRecipeInput,
  MealPlan,
  MealPlanWithRecipe,
  CreateMealPlanInput,
  UpdateMealPlanInput,
  GenerateShoppingListInput,
  GenerateShoppingListResponse,
  UserDietSettings,
} from './types';

// ==============================================
// Helper: Parse error responses
// ==============================================


export async function parseErrorResponse(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  // 1) Probeer JSON
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      if (body && typeof (body as any).error === 'string') {
        return (body as any).error;
      }
      if (body && typeof (body as any).message === 'string') {
        return (body as any).message;
      }
    } catch {
      // negeer JSON parse fouten en probeer tekst
    }
  }

  // 2) Probeer plain text / HTML (zoals “The page cannot be found”)
  try {
    const text = await response.text();
    if (text) {
      return text.slice(0, 200);
    }
  } catch {
    // negeer tekst lees fouten
  }

  // 3) Vallen terug op een generieke boodschap
  return fallbackMessage;
}

// ==============================================
// Recipes Hooks
// ==============================================

export function useRecipes(filters?: RecipeFilters) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async (): Promise<Recipe[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters?.favouritesOnly) {
        query = query.eq('is_favourite', true);
      }
      if (filters?.maxPrepTime) {
        query = query.lte('prep_time_min', filters.maxPrepTime);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Recipe[];
    },
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipe', id],
    enabled: !!id,
    queryFn: async (): Promise<RecipeWithIngredients> => {
      if (!id) throw new Error('Recipe id is required');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (recipeError) throw recipeError;

      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', id)
        .order('sort_order', { ascending: true });

      if (ingredientsError) throw ingredientsError;

      return { ...recipe, ingredients: ingredients || [] } as RecipeWithIngredients;
    },
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecipeInput): Promise<RecipeWithIngredients> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: input.title,
          source_type: input.source_type || 'manual',
          source_url: input.source_url,
          source_note: input.source_note,
          default_servings: input.default_servings || 2,
          prep_time_min: input.prep_time_min,
          instructions: input.instructions,
          tags: input.tags || [],
          image_url: input.image_url,
        })
        .select()
        .single();


      if (recipeError) throw recipeError;

      // Insert ingredients
      if (input.ingredients && input.ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(
            input.ingredients.map((ing, index) => ({
              recipe_id: recipe.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category || 'other',
              is_optional: ing.is_optional || false,
              sort_order: ing.sort_order ?? index,
            }))
          );

        if (ingredientsError) throw ingredientsError;
      }

      // Fetch complete recipe with ingredients
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('sort_order', { ascending: true });

      return { ...recipe, ingredients: ingredients || [] } as RecipeWithIngredients;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRecipeInput): Promise<RecipeWithIngredients> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          title: input.title,
          source_type: input.source_type,
          source_url: input.source_url,
          source_note: input.source_note,
          default_servings: input.default_servings,
          prep_time_min: input.prep_time_min,
          instructions: input.instructions,
          tags: input.tags,
          image_url: input.image_url,
        })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Delete existing ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', input.id);

      // Insert updated ingredients
      if (input.ingredients && input.ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(
            input.ingredients.map((ing, index) => ({
              recipe_id: input.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category || 'other',
              is_optional: ing.is_optional || false,
              sort_order: ing.sort_order ?? index,
            }))
          );

        if (ingredientsError) throw ingredientsError;
      }

      // Fetch complete recipe with ingredients
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', input.id)
        .order('sort_order', { ascending: true });

      return { ...recipe, ingredients: ingredients || [] } as RecipeWithIngredients;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['recipe', data.id] });
      }
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete ingredients first
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      // Delete recipe
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

export function useImportRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ImportRecipeInput): Promise<RecipeWithIngredients> => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Not authenticated');
      const token = data.session.access_token;

      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const message = await parseErrorResponse(response, 'Failed to import recipe');
        throw new Error(message);
      }

      return response.json() as Promise<RecipeWithIngredients>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// ==============================================
// Meal Plans Hooks
// ==============================================

export function useMealPlans(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['meal-plans', startDate, endDate],
    queryFn: async (): Promise<MealPlanWithRecipe[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('meal_plans')
        .select('*, recipe:recipes(id, title, default_servings)')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as MealPlanWithRecipe[];
    },
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMealPlanInput): Promise<MealPlanWithRecipe> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          recipe_id: input.recipe_id,
          date: input.date,
          meal_type: input.meal_type,
          servings: input.servings,
        })
        .select('*, recipe:recipes(id, title, default_servings)')
        .single();

      if (error) throw error;
      return data as MealPlanWithRecipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMealPlanInput): Promise<MealPlanWithRecipe> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meal_plans')
        .update({
          recipe_id: input.recipe_id,
          date: input.date,
          meal_type: input.meal_type,
          servings: input.servings,
        })
        .eq('id', input.id)
        .eq('user_id', user.id)
        .select('*, recipe:recipes(id, title, default_servings)')
        .single();

      if (error) throw error;
      return data as MealPlanWithRecipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

// ==============================================
// Shopping List Hook
// ==============================================

export function useGenerateShoppingList(input: GenerateShoppingListInput | null) {
  return useQuery({
    queryKey: ['shopping-list', input?.weekStart, input?.weekEnd],
    enabled: !!input,
    queryFn: async (): Promise<GenerateShoppingListResponse> => {
      if (!input) throw new Error('Input is required');

      // 1. Alle maaltijdplannen met receptdetails voor de week
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('*, recipe:recipes(id, title, default_servings)')
        .gte('date', input.weekStart)
        .lte('date', input.weekEnd);

      if (mealPlansError) throw mealPlansError;
      if (!mealPlans || mealPlans.length === 0) {
        return { items: [], grouped: {} };
      }

      // 2. Unieke recept-ID's
      const recipeIds = [
        ...new Set(
          mealPlans
            .filter((mp: any) => mp.recipe_id)
            .map((mp: any) => mp.recipe_id as string)
        ),
      ];

      if (recipeIds.length === 0) {
        return { items: [], grouped: {} };
      }

      // 3. Alle ingrediënten per recept
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .in('recipe_id', recipeIds);

      if (ingredientsError) throw ingredientsError;

      // 4. Aggregeren + schalen
      type AggregatedItem = {
        name: string;
        quantity: number;
        unit: string;
        category: string;
        recipe_ids: string[];
        recipe_titles: string[];
        checked: boolean;
      };

      const aggregated = new Map<string, AggregatedItem>();

      for (const mealPlan of mealPlans as any[]) {
        if (!mealPlan.recipe || !mealPlan.recipe_id) continue;

        const recipe = mealPlan.recipe as any;
        const baseServings = recipe.default_servings || 1;
        const scaleFactor =
          baseServings > 0 ? mealPlan.servings / baseServings : mealPlan.servings;

        const recipeIngredients =
          ingredients?.filter((ing: any) => ing.recipe_id === mealPlan.recipe_id) || [];

        for (const ingredient of recipeIngredients) {
          if (ingredient.is_optional) continue;

          const normalizedName = (ingredient.name as string).toLowerCase().trim();
          const unit = ingredient.unit || 'stuk';
          const category = ingredient.category || 'other';

          const key = `${normalizedName}_${unit}_${category}`;
          const scaledQuantity = (ingredient.quantity || 0) * scaleFactor;

          if (aggregated.has(key)) {
            const existing = aggregated.get(key)!;
            existing.quantity += scaledQuantity;
            if (!existing.recipe_ids.includes(mealPlan.recipe_id)) {
              existing.recipe_ids.push(mealPlan.recipe_id);
              existing.recipe_titles.push(recipe.title);
            }
          } else {
            aggregated.set(key, {
              name: ingredient.name,
              quantity: scaledQuantity,
              unit,
              category,
              recipe_ids: [mealPlan.recipe_id],
              recipe_titles: [recipe.title],
              checked: false,
            });
          }
        }
      }

      const items = Array.from(aggregated.values());

      const grouped: Record<string, AggregatedItem[]> = {};
      for (const item of items) {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      }

      const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'spices', 'frozen', 'other'];
      const sortedGrouped: Record<string, AggregatedItem[]> = {};
      for (const category of categoryOrder) {
        if (grouped[category]) {
          sortedGrouped[category] = grouped[category];
        }
      }

      return { items, grouped: sortedGrouped } as GenerateShoppingListResponse;
    },
  });
}

// ==============================================
// Diet Settings Hooks
// ==============================================

export function useDietSettings() {
  return useQuery({
    queryKey: ['diet-settings'],
    queryFn: async (): Promise<UserDietSettings | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_diet_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return data as UserDietSettings | null;
    },
  });
}

export function useSaveDietSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: Partial<UserDietSettings>
    ): Promise<UserDietSettings> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_diet_settings')
        .upsert({
          ...settings,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data as UserDietSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-settings'] });
    },
  });
}
