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
// Helper: Get auth token
// ==============================================

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not authenticated');
  return data.session.access_token;
}

// ==============================================
// Recipes Hooks
// ==============================================

export function useRecipes(filters?: RecipeFilters) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      const token = await getAuthToken();

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters?.favouritesOnly) params.append('favourites', 'true');
      if (filters?.maxPrepTime) params.append('maxPrepTime', filters.maxPrepTime.toString());

      const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recipes');
      }

      return response.json() as Promise<Recipe[]>;
    },
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      if (!id) throw new Error('Recipe ID is required');
      const token = await getAuthToken();

      const response = await fetch(`/api/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recipe');
      }

      return response.json() as Promise<RecipeWithIngredients>;
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      const token = await getAuthToken();

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create recipe');
      }

      return response.json() as Promise<RecipeWithIngredients>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRecipeInput) => {
      const token = await getAuthToken();

      const response = await fetch(`/api/recipes/${input.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update recipe');
      }

      return response.json() as Promise<RecipeWithIngredients>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();

      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recipe');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useImportRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ImportRecipeInput) => {
      const token = await getAuthToken();

      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import recipe');
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
    queryFn: async () => {
      const token = await getAuthToken();

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/meal-plans${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch meal plans');
      }

      return response.json() as Promise<MealPlanWithRecipe[]>;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMealPlanInput) => {
      const token = await getAuthToken();

      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meal plan');
      }

      return response.json() as Promise<MealPlanWithRecipe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMealPlanInput) => {
      const token = await getAuthToken();

      const response = await fetch(`/api/meal-plans/${input.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update meal plan');
      }

      return response.json() as Promise<MealPlanWithRecipe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();

      const response = await fetch(`/api/meal-plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete meal plan');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] });
    },
  });
}

// ==============================================
// Shopping List Hooks
// ==============================================

export function useGenerateShoppingList(input: GenerateShoppingListInput | null) {
  return useQuery({
    queryKey: ['shopping-list', input?.weekStart, input?.weekEnd],
    queryFn: async () => {
      if (!input) throw new Error('Input is required');

      // Fetch meal plans with recipes for the date range
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('*, recipe:recipes(id, title, default_servings)')
        .gte('date', input.weekStart)
        .lte('date', input.weekEnd);

      if (mealPlansError) throw mealPlansError;
      if (!mealPlans || mealPlans.length === 0) {
        return { items: [], grouped: {} };
      }

      // Get unique recipe IDs
      const recipeIds = [...new Set(
        mealPlans
          .filter(mp => mp.recipe_id)
          .map(mp => mp.recipe_id)
      )];

      if (recipeIds.length === 0) {
        return { items: [], grouped: {} };
      }

      // Fetch ingredients for these recipes
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .in('recipe_id', recipeIds);

      if (ingredientsError) throw ingredientsError;

      // Aggregate ingredients
      const aggregated = new Map();

      for (const mealPlan of mealPlans) {
        if (!mealPlan.recipe || !mealPlan.recipe_id) continue;

        const recipe = mealPlan.recipe as any;
        const scaleFactor = mealPlan.servings / (recipe.default_servings || 1);

        const recipeIngredients = ingredients?.filter(ing => ing.recipe_id === mealPlan.recipe_id) || [];

        for (const ingredient of recipeIngredients) {
          if (ingredient.is_optional) continue;

          const normalizedName = ingredient.name.toLowerCase().trim();
          const key = `${normalizedName}_${ingredient.unit || 'stuk'}_${ingredient.category}`;

          const scaledQuantity = (ingredient.quantity || 0) * scaleFactor;

          if (aggregated.has(key)) {
            const existing = aggregated.get(key);
            existing.quantity += scaledQuantity;
            if (!existing.recipe_ids.includes(mealPlan.recipe_id)) {
              existing.recipe_ids.push(mealPlan.recipe_id);
              existing.recipe_titles.push(recipe.title);
            }
          } else {
            aggregated.set(key, {
              name: ingredient.name,
              quantity: scaledQuantity,
              unit: ingredient.unit || 'stuk',
              category: ingredient.category,
              recipe_ids: [mealPlan.recipe_id],
              recipe_titles: [recipe.title],
              checked: false,
            });
          }
        }
      }

      // Convert to array and group by category
      const items = Array.from(aggregated.values());
      const grouped: any = {};

      for (const item of items) {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      }

      // Sort categories
      const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'spices', 'frozen', 'other'];
      const sortedGrouped: any = {};
      for (const category of categoryOrder) {
        if (grouped[category]) {
          sortedGrouped[category] = grouped[category];
        }
      }

      return { items, grouped: sortedGrouped } as GenerateShoppingListResponse;
    },
    enabled: !!input,
  });
}

// ==============================================
// Diet Settings Hooks
// ==============================================

export function useDietSettings() {
  return useQuery({
    queryKey: ['diet-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    mutationFn: async (settings: Partial<UserDietSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
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
