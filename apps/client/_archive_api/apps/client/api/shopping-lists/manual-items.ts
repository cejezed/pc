// api/shopping-lists/manual-items.ts
// POST /api/shopping-lists/manual-items - Add manual item
// PATCH /api/shopping-lists/manual-items - Update manual item (toggle checked)
// DELETE /api/shopping-lists/manual-items - Remove manual item

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

    // POST - Add manual item
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { shoppingListId, name, category } = body;

            if (!shoppingListId || !name || !category) {
                return new Response(JSON.stringify({ error: 'shoppingListId, name, and category required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { data, error } = await supabase
                .from('shopping_list_manual_items')
                .insert({
                    shopping_list_id: shoppingListId,
                    name,
                    category,
                    checked: false,
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify({ manualItem: data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error adding manual item:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // PATCH - Update manual item
    if (req.method === 'PATCH') {
        try {
            const body = await req.json();
            const { id, checked } = body;

            if (!id || checked === undefined) {
                return new Response(JSON.stringify({ error: 'id and checked required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { data, error } = await supabase
                .from('shopping_list_manual_items')
                .update({ checked })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify({ manualItem: data }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error updating manual item:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // DELETE - Remove manual item
    if (req.method === 'DELETE') {
        try {
            const body = await req.json();
            const { id } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: 'id required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const { error } = await supabase
                .from('shopping_list_manual_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error removing manual item:', error);
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
