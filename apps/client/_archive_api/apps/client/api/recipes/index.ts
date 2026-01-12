// api/recipes/index.ts
// GET /api/recipes - List recipes with filters
// POST /api/recipes - Create new recipe

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
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

  // GET - List recipes
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const tags = url.searchParams.get('tags')?.split(',').filter(Boolean);
      const favouritesOnly = url.searchParams.get('favourites') === 'true';
      const search = url.searchParams.get('search');
      const maxPrepTime = url.searchParams.get('maxPrepTime');

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      if (favouritesOnly) {
        query = query.eq('is_favourite', true);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (maxPrepTime) {
        query = query.lte('prep_time_min', parseInt(maxPrepTime));
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST - Create recipe
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { ingredients, ...recipeData } = body;

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          ...recipeData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Create ingredients if provided
      if (ingredients && ingredients.length > 0) {
        const ingredientsData = ingredients.map((ing: any, index: number) => ({
          ...ing,
          recipe_id: recipe.id,
          sort_order: ing.sort_order ?? index,
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
      }

      // Fetch complete recipe with ingredients
      const { data: completeRecipe, error: fetchError } = await supabase
        .from('recipes')
        .select('*, ingredients:recipe_ingredients(*)')
        .eq('id', recipe.id)
        .single();

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(completeRecipe), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
