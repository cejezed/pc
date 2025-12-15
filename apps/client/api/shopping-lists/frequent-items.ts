// api/shopping-lists/frequent-items.ts
// GET /api/shopping-lists/frequent-items - Get frequent items for suggestions
// POST /api/shopping-lists/frequent-items - Track item usage

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

    // GET - Fetch frequent items
    if (req.method === 'GET') {
        try {
            const url = new URL(req.url);
            const limit = parseInt(url.searchParams.get('limit') || '10');

            const { data, error } = await supabase
                .from('shopping_list_frequent_items')
                .select('*')
                .eq('user_id', user.id)
                .order('frequency', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return new Response(JSON.stringify({ frequentItems: data || [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error fetching frequent items:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // POST - Track item usage
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { itemName } = body;

            if (!itemName) {
                return new Response(JSON.stringify({ error: 'itemName required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Check if item exists
            const { data: existing, error: fetchError } = await supabase
                .from('shopping_list_frequent_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('item_name', itemName.toLowerCase())
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            let result;
            if (existing) {
                // Update frequency
                const { data, error } = await supabase
                    .from('shopping_list_frequent_items')
                    .update({
                        frequency: existing.frequency + 1,
                        last_used: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('shopping_list_frequent_items')
                    .insert({
                        user_id: user.id,
                        item_name: itemName.toLowerCase(),
                        frequency: 1,
                    })
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return new Response(JSON.stringify({ frequentItem: result }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error tracking frequent item:', error);
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
