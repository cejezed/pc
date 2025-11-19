// src/Components/eten/hooks/useShoppingListData.tsx
// React Query hooks for shopping list data (following Uren pattern)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../supabase';
import type { IngredientCategory } from '../types';

interface ManualItem {
    id: string;
    name: string;
    category: IngredientCategory;
    checked: boolean;
}

interface ShoppingListData {
    id: string;
    user_id: string;
    week_start: string;
    created_at: string;
    updated_at: string;
}

// Get or create shopping list for a week
export function useShoppingList(weekStart: string) {
    return useQuery({
        queryKey: ['shopping-list', weekStart],
        queryFn: async (): Promise<ShoppingListData> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Try to get existing
            let { data: existing, error: fetchError } = await supabase
                .from('shopping_lists')
                .select('*')
                .eq('user_id', user.id)
                .eq('week_start', weekStart)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existing) {
                return existing as ShoppingListData;
            }

            // Create new
            const { data: newList, error: createError } = await supabase
                .from('shopping_lists')
                .insert({
                    user_id: user.id,
                    week_start: weekStart,
                })
                .select()
                .single();

            if (createError) throw createError;
            return newList as ShoppingListData;
        },
    });
}

// Get checked items for a shopping list
export function useCheckedItems(shoppingListId: string | undefined) {
    return useQuery({
        queryKey: ['checked-items', shoppingListId],
        enabled: !!shoppingListId,
        queryFn: async (): Promise<string[]> => {
            if (!shoppingListId) return [];

            const { data, error } = await supabase
                .from('shopping_list_checked_items')
                .select('item_key')
                .eq('shopping_list_id', shoppingListId);

            if (error) throw error;
            return (data || []).map(item => item.item_key);
        },
    });
}

// Toggle checked item
export function useToggleCheckedItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shoppingListId, itemKey, isChecked }: {
            shoppingListId: string;
            itemKey: string;
            isChecked: boolean;
        }) => {
            if (isChecked) {
                // Remove
                const { error } = await supabase
                    .from('shopping_list_checked_items')
                    .delete()
                    .eq('shopping_list_id', shoppingListId)
                    .eq('item_key', itemKey);

                if (error) throw error;
            } else {
                // Add
                const { error } = await supabase
                    .from('shopping_list_checked_items')
                    .insert({
                        shopping_list_id: shoppingListId,
                        item_key: itemKey,
                    });

                if (error) throw error;
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['checked-items', variables.shoppingListId] });
        },
    });
}

// Get manual items for a shopping list
export function useManualItems(shoppingListId: string | undefined) {
    return useQuery({
        queryKey: ['manual-items', shoppingListId],
        enabled: !!shoppingListId,
        queryFn: async (): Promise<ManualItem[]> => {
            if (!shoppingListId) return [];

            const { data, error } = await supabase
                .from('shopping_list_manual_items')
                .select('*')
                .eq('shopping_list_id', shoppingListId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data || []) as ManualItem[];
        },
    });
}

// Add manual item
export function useAddManualItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shoppingListId, name, category }: {
            shoppingListId: string;
            name: string;
            category: IngredientCategory;
        }) => {
            const { error } = await supabase
                .from('shopping_list_manual_items')
                .insert({
                    shopping_list_id: shoppingListId,
                    name,
                    category,
                    checked: false,
                });

            if (error) throw error;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['manual-items', variables.shoppingListId] });
        },
    });
}

// Toggle manual item checked
export function useToggleManualItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, checked, shoppingListId }: {
            id: string;
            checked: boolean;
            shoppingListId: string;
        }) => {
            const { error } = await supabase
                .from('shopping_list_manual_items')
                .update({ checked })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['manual-items', variables.shoppingListId] });
        },
    });
}

// Remove manual item
export function useRemoveManualItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, shoppingListId }: {
            id: string;
            shoppingListId: string;
        }) => {
            const { error } = await supabase
                .from('shopping_list_manual_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['manual-items', variables.shoppingListId] });
        },
    });
}

// Get frequent items
export function useFrequentItems(limit: number = 10) {
    return useQuery({
        queryKey: ['frequent-items', limit],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('shopping_list_frequent_items')
                .select('*')
                .eq('user_id', user.id)
                .order('frequency', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        },
    });
}

// Track frequent item
export function useTrackFrequentItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (itemName: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if exists
            const { data: existing } = await supabase
                .from('shopping_list_frequent_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('item_name', itemName.toLowerCase())
                .maybeSingle();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('shopping_list_frequent_items')
                    .update({
                        frequency: existing.frequency + 1,
                        last_used: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('shopping_list_frequent_items')
                    .insert({
                        user_id: user.id,
                        item_name: itemName.toLowerCase(),
                        frequency: 1,
                    });

                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['frequent-items'] });
        },
    });
}

// Clear all checked items
export function useClearCheckedItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shoppingListId, checkedItemKeys, checkedManualItemIds }: {
            shoppingListId: string;
            checkedItemKeys: string[];
            checkedManualItemIds: string[];
        }) => {
            // Delete checked items from generated list
            if (checkedItemKeys.length > 0) {
                const { error } = await supabase
                    .from('shopping_list_checked_items')
                    .delete()
                    .eq('shopping_list_id', shoppingListId)
                    .in('item_key', checkedItemKeys);

                if (error) throw error;
            }

            // Delete checked manual items
            if (checkedManualItemIds.length > 0) {
                const { error } = await supabase
                    .from('shopping_list_manual_items')
                    .delete()
                    .in('id', checkedManualItemIds);

                if (error) throw error;
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['checked-items', variables.shoppingListId] });
            queryClient.invalidateQueries({ queryKey: ['manual-items', variables.shoppingListId] });
        },
    });
}
