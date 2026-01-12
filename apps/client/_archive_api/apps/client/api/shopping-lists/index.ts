// api/shopping-lists/index.ts
// GET /api/shopping-lists?weekStart=YYYY-MM-DD - Get shopping list for a week
// POST /api/shopping-lists - Create/update shopping list

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

    // GET - Fetch shopping list for a week
    if (req.method === 'GET') {
        try {
            const url = new URL(req.url);
            const weekStart = url.searchParams.get('weekStart');

            if (!weekStart) {
                return new Response(JSON.stringify({ error: 'weekStart parameter required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Get or create shopping list
            let { data: shoppingList, error: listError } = await supabase
                .from('shopping_lists')
                .select('*')
                .eq('user_id', user.id)
                .eq('week_start', weekStart)
                .single();

            if (listError && listError.code !== 'PGRST116') { // PGRST116 = not found
                throw listError;
            }

            // Create if doesn't exist
            if (!shoppingList) {
                const { data: newList, error: createError } = await supabase
                    .from('shopping_lists')
                    .insert({
                        user_id: user.id,
                        week_start: weekStart,
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                shoppingList = newList;
            }

            // Fetch checked items
            const { data: checkedItems, error: checkedError } = await supabase
                .from('shopping_list_checked_items')
                .select('item_key')
                .eq('shopping_list_id', shoppingList.id);

            if (checkedError) throw checkedError;

            // Fetch manual items
            const { data: manualItems, error: manualError } = await supabase
                .from('shopping_list_manual_items')
                .select('*')
                .eq('shopping_list_id', shoppingList.id)
                .order('created_at', { ascending: true });

            if (manualError) throw manualError;

            return new Response(JSON.stringify({
                shoppingList,
                checkedItems: checkedItems?.map(item => item.item_key) || [],
                manualItems: manualItems || [],
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error fetching shopping list:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // POST - Create/update shopping list
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { weekStart } = body;

            if (!weekStart) {
                return new Response(JSON.stringify({ error: 'weekStart required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Upsert shopping list
            const { data: shoppingList, error: upsertError } = await supabase
                .from('shopping_lists')
                .upsert({
                    user_id: user.id,
                    week_start: weekStart,
                }, {
                    onConflict: 'user_id,week_start',
                })
                .select()
                .single();

            if (upsertError) throw upsertError;

            return new Response(JSON.stringify({ shoppingList }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error creating shopping list:', error);
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
