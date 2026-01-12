// api/shopping-lists/checked-items.ts
// POST /api/shopping-lists/checked-items - Toggle checked item
// DELETE /api/shopping-lists/checked-items - Remove checked item

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

    // POST - Add checked item
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { shoppingListId, itemKey } = body;

            if (!shoppingListId || !itemKey) {
                return new Response(JSON.stringify({ error: 'shoppingListId and itemKey required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { data, error } = await supabase
                .from('shopping_list_checked_items')
                .insert({
                    shopping_list_id: shoppingListId,
                    item_key: itemKey,
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify({ checkedItem: data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error adding checked item:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // DELETE - Remove checked item
    if (req.method === 'DELETE') {
        try {
            const body = await req.json();
            const { shoppingListId, itemKey } = body;

            if (!shoppingListId || !itemKey) {
                return new Response(JSON.stringify({ error: 'shoppingListId and itemKey required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { error } = await supabase
                .from('shopping_list_checked_items')
                .delete()
                .eq('shopping_list_id', shoppingListId)
                .eq('item_key', itemKey);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error removing checked item:', error);
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
