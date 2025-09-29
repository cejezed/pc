import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  purchased_location?: string;
};

/* =======================
   Mock Data Store
======================= */
const mockStore = {
  items: [
    {
      id: "1",
      user_id: "user1",
      name: "Nieuwe laptop",
      description: "Voor werk, minimaal 16GB RAM",
      category: "tech",
      estimated_cost_cents: 120000,
      priority: "high" as const,
      store: "Coolblue",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      user_id: "user1",
      name: "Bureau stoel",
      description: "Ergonomisch, goede ondersteuning",
      category: "home",
      estimated_cost_cents: 35000,
      priority: "medium" as const,
      store: "IKEA",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      user_id: "user1",
      name: "Noise cancelling koptelefoon",
      category: "tech",
      estimated_cost_cents: 25000,
      priority: "low" as const,
      product_url: "https://www.bol.com/...",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ] as ShoppingItem[],
};

/* =======================
   Hooks with Mock Implementation
======================= */
export function useShoppingItems() {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ShoppingItem[]>({
    queryKey: ["shopping-items"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Return mock data
      return [...mockStore.items];
    },
    staleTime: 60 * 1000,
  });

  const addItem = useMutation({
    mutationFn: async (payload: ShoppingItemCreate) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        user_id: "user1",
        ...payload,
        created_at: new Date().toISOString(),
      };
      
      mockStore.items.push(newItem);
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShoppingItemUpdate }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = mockStore.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        mockStore.items[index] = {
          ...mockStore.items[index],
          ...data,
        };
        return mockStore.items[index];
      }
      throw new Error("Item not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const markPurchased = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PurchaseData }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = mockStore.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        mockStore.items[index] = {
          ...mockStore.items[index],
          ...data,
        };
        return mockStore.items[index];
      }
      throw new Error("Item not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      refetch();
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const index = mockStore.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        mockStore.items.splice(index, 1);
      }
      return true;
    },
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

/* =======================
   Real API Implementation (Commented Out)
   Uncomment this when backend is ready
======================= */
/*
import { api } from "@/lib/api";

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
*/