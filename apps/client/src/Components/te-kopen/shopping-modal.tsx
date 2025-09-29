import React from "react";
import { X, Plus } from "lucide-react";
import type { ShoppingItem, ShoppingItemCreate } from "./hooks";
import { CATEGORIES, PRIORITIES } from "./basis-componenten";

type ShoppingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShoppingItemCreate) => void;
  editItem?: ShoppingItem | null;
  isPending?: boolean;
};

export function ShoppingModal({
  isOpen,
  onClose,
  onSubmit,
  editItem,
  isPending,
}: ShoppingModalProps) {
  const [form, setForm] = React.useState<{
    name: string;
    description: string;
    category: string;
    estimated_cost_euros: string;
    priority: string;
    product_url: string;
    store: string;
    notes: string;
  }>({
    name: "",
    description: "",
    category: "",
    estimated_cost_euros: "",
    priority: "medium",
    product_url: "",
    store: "",
    notes: "",
  });

  React.useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name,
        description: editItem.description || "",
        category: editItem.category || "",
        estimated_cost_euros: editItem.estimated_cost_cents
          ? (editItem.estimated_cost_cents / 100).toString()
          : "",
        priority: editItem.priority || "medium",
        product_url: editItem.product_url || "",
        store: editItem.store || "",
        notes: editItem.notes || "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "",
        estimated_cost_euros: "",
        priority: "medium",
        product_url: "",
        store: "",
        notes: "",
      });
    }
  }, [editItem, isOpen]);

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const payload: ShoppingItemCreate = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category || undefined,
      estimated_cost_cents: form.estimated_cost_euros
        ? Math.round(parseFloat(form.estimated_cost_euros) * 100)
        : undefined,
      priority: (form.priority as any) || undefined,
      product_url: form.product_url.trim() || undefined,
      store: form.store.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editItem ? "Item bewerken" : "Nieuw item toevoegen"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam *
            </label>
            <input
              type="text"
              placeholder="Wat wil je kopen?"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Omschrijving
            </label>
            <textarea
              placeholder="Optionele details..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Selecteer...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioriteit
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {PRIORITIES.map((pri) => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geschatte prijs (€)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.estimated_cost_euros}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimated_cost_euros: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Winkel
              </label>
              <input
                type="text"
                placeholder="Bijv. Bol.com"
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product link
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.product_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, product_url: e.target.value }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              placeholder="Extra opmerkingen..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || isPending}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isPending ? "Opslaan..." : editItem ? "Bijwerken" : "Toevoegen"}
          </button>
        </div>
      </div>
    </div>
  );
}