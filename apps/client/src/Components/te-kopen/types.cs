// src/Components/te-kopen/types.ts
export type ShoppingItem = {
  id: string;
  title: string;
  quantity: number;
  unit?: string;
  notes?: string;
  purchased: boolean;
  category?: string;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
};
