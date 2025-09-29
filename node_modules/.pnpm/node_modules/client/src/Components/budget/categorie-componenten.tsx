// src/Components/budget/categorie-componenten.tsx
import React from "react";
import { Plus } from "lucide-react";
import { Modal } from "./basis-componenten";
import { useAddCategory } from "./hooks";
import type { BudgetCategory } from "./types";

const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E",
  "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6",
  "#6366F1", "#8B5CF6", "#A855F7", "#D946EF", "#EC4899"
];

const CATEGORY_ICONS = [
  "💰", "🛒", "🚗", "⚡", "🏠", "🍔", "🎬", "👕", 
  "🏥", "📚", "✈️", "📱", "☕", "🎵", "🏋️", "🎮"
];

export function CategoryFormModal({
  isOpen,
  onClose,
  category, // For editing existing categories
}: {
  isOpen: boolean;
  onClose: () => void;
  category?: BudgetCategory;
}) {
  const addCategory = useAddCategory();
  const isEditing = !!category;
  
  const [form, setForm] = React.useState({
    name: category?.name || "",
    type: (category?.type || "expense") as "income" | "expense" | "savings",
    color: category?.color || CATEGORY_COLORS[0],
    icon: category?.icon || CATEGORY_ICONS[0],
    description: category?.description || "",
    sort_order: category?.sort_order || 1,
    active: category?.active ?? true,
  });

  // Reset form when category changes
  React.useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon || CATEGORY_ICONS[0],
        description: category.description || "",
        sort_order: category.sort_order,
        active: category.active,
      });
    } else {
      setForm({
        name: "",
        type: "expense",
        color: CATEGORY_COLORS[0],
        icon: CATEGORY_ICONS[0],
        description: "",
        sort_order: 1,
        active: true,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      return;
    }

    const categoryData: Omit<BudgetCategory, "id" | "created_at" | "updated_at"> = {
      name: form.name.trim(),
      type: form.type,
      color: form.color,
      icon: form.icon,
      description: form.description.trim() || undefined,
      sort_order: form.sort_order,
      active: form.active,
    };

    addCategory.mutate(categoryData, {
      onSuccess: () => {
        onClose();
        if (!isEditing) {
          setForm({
            name: "",
            type: "expense",
            color: CATEGORY_COLORS[0],
            icon: CATEGORY_ICONS[0],
            description: "",
            sort_order: 1,
            active: true,
          });
        }
      },
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Categorie bewerken" : "Nieuwe Categorie"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Naam *
          </label>
          <input
            type="text"
            placeholder="Categorie naam..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschrijving (optioneel)
          </label>
          <textarea
            placeholder="Beschrijf wat deze categorie omvat..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <div className="flex gap-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="income"
                checked={form.type === "income"}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mr-2"
              />
              Inkomen
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="expense"
                checked={form.type === "expense"}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mr-2"
              />
              Uitgave
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="savings"
                checked={form.type === "savings"}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="mr-2"
              />
              Sparen
            </label>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kleur
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-8 h-8 rounded-full border-2 ${
                  form.color === color ? "border-gray-900" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icoon
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm({ ...form, icon })}
                className={`w-10 h-10 rounded-lg border-2 text-lg ${
                  form.icon === icon ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volgorde
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 1 })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Lager nummer = hoger in de lijst</p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="active" className="text-sm text-gray-700">
            Actieve categorie
          </label>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Preview:</div>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: form.color + "20",
              color: form.color,
              borderColor: form.color + "40",
              border: "1px solid",
            }}
          >
            <span>{form.icon}</span>
            <span>{form.type === "income" ? "+" : form.type === "expense" ? "-" : "="}</span>
            <span>{form.name || "Categorie naam"}</span>
          </span>
          {form.description && (
            <p className="text-xs text-gray-600 mt-1">{form.description}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={addCategory.isPending || !form.name.trim()}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {addCategory.isPending 
              ? (isEditing ? "Opslaan..." : "Toevoegen...") 
              : (isEditing ? "Opslaan" : "Toevoegen")
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}