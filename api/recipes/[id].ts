// api/recipes/[id].ts
// GET /api/recipes/:id - Get recipe by ID with ingredients
// PUT /api/recipes/:id - Update recipe
// DELETE /api/recipes/:id - Delete recipe

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request, context: { params: { id: string } }) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = context.params;

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

  // GET - Get recipe by ID
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, ingredients:recipe_ingredients(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!data) {
        return new Response(JSON.stringify({ error: 'Recipe not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

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

  // PUT - Update recipe
  if (req.method === 'PUT') {
    try {
      const body = await req.json();
      const { ingredients, ...recipeData } = body;

      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Update ingredients if provided
      if (ingredients) {
        // Delete existing ingredients
        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', id);

        // Insert new ingredients
        if (ingredients.length > 0) {
          const ingredientsData = ingredients.map((ing: any, index: number) => ({
            ...ing,
            recipe_id: id,
            sort_order: ing.sort_order ?? index,
          }));

          const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsData);

          if (ingredientsError) throw ingredientsError;
        }
      }

      // Fetch complete recipe with ingredients
      const { data: completeRecipe, error: fetchError } = await supabase
        .from('recipes')
        .select('*, ingredients:recipe_ingredients(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(completeRecipe), {
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

  // DELETE - Delete recipe
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
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

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
