import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* =======================
   Types
======================= */
export type ShoppingItem = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  estimated_cost_cents?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  product_url?: string;
  store?: string;
  notes?: string;
  created_at: string;
  purchased_at?: string;
  actual_cost_cents?: number;
};

export type ShoppingItemCreate = {
  name: string;
  description?: string;
  category?: string;
  estimated_cost_cents?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  product_url?: string;
  store?: string;
  notes?: string;
};

export type ShoppingItemUpdate = Partial<ShoppingItemCreate>;

export type PurchaseData = {
  actual_cost_cents: number;
  purchased_at: string;
};

/* =======================
   Hooks
======================= */
export function useShoppingItems() {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    isError,
    refetch
  } = useQuery<ShoppingItem[]>({
    queryKey: ["shopping-items"],
    queryFn: () => api<ShoppingItem[]>("/api/shopping-items"),
    staleTime: 60 * 1000,
  });

  const addItem = useMutation({
    mutationFn: (payload: ShoppingItemCreate) =>
      api<ShoppingItem>("/api/shopping-items", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShoppingItemUpdate }) =>
      api<ShoppingItem>(`/api/shopping-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const markPurchased = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseData }) =>
      api<ShoppingItem>(`/api/shopping-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) =>
      api(`/api/shopping-items/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  return {
    items,
    isLoading,
    isError,
    addItem,
    updateItem,
    markPurchased,
    deleteItem,
    refetch,
  };
}