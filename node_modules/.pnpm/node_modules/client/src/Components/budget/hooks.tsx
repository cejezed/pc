// src/Components/budget/hooks.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction, BudgetCategory } from "./types";

// Categories hooks
export const useBudgetCategories = () => {
  return useQuery({
    queryKey: ["budget-categories"],
    queryFn: async (): Promise<BudgetCategory[]> => {
      // Mock implementation - replace with your actual API call
      return [
        { 
          id: "1", 
          name: "Boodschappen", 
          color: "#84CC16", 
          icon: "🛒", 
          type: "expense",
          sort_order: 1,
          active: true,
          created_at: new Date().toISOString()
        },
        { 
          id: "2", 
          name: "Transport", 
          color: "#F59E0B", 
          icon: "🚗", 
          type: "expense",
          sort_order: 2,
          active: true,
          created_at: new Date().toISOString()
        },
        { 
          id: "3", 
          name: "Salaris", 
          color: "#10B981", 
          icon: "💰", 
          type: "income",
          sort_order: 3,
          active: true,
          created_at: new Date().toISOString()
        },
        { 
          id: "4", 
          name: "Utilities", 
          color: "#06B6D4", 
          icon: "⚡", 
          type: "expense",
          sort_order: 4,
          active: true,
          created_at: new Date().toISOString()
        },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Transactions hooks
export const useBudgetTransactions = () => {
  return useQuery({
    queryKey: ["budget-transactions"],
    queryFn: async (): Promise<Transaction[]> => {
      // Mock implementation - replace with your actual API call
      const today = new Date().toISOString().split('T')[0];
      return [
        {
          id: "1",
          amount_cents: -2500,
          description: "Albert Heijn",
          category_id: "1",
          transaction_date: today,
          type: "expense",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          amount_cents: 250000,
          description: "Maandsalaris",
          category_id: "3",
          transaction_date: today,
          type: "income",
          created_at: new Date().toISOString(),
        },
      ];
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "created_at">) => {
      // Mock implementation - replace with your actual API call
      console.log("Adding transaction:", transaction);
      return { id: Date.now().toString(), ...transaction, created_at: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - replace with your actual API call
      console.log("Deleting transaction:", id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-transactions"] });
    },
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<BudgetCategory, "id" | "created_at" | "updated_at">) => {
      // Mock implementation
      console.log("Adding category:", category);
      return { 
        id: Date.now().toString(), 
        ...category,
        created_at: new Date().toISOString()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });
};