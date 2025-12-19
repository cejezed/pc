// api/meal-plans/index.ts
// GET /api/meal-plans - List meal plans for a date range
// POST /api/meal-plans - Create new meal plan

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

  // GET - List meal plans
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      let query = supabase
        .from('meal_plans')
        .select('*, recipe:recipes(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
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

  // POST - Create meal plan
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      const { data, error } = await supabase
        .from('meal_plans')
        .insert([{
          ...body,
          user_id: user.id,
        }])
        .select('*, recipe:recipes(*)')
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
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
