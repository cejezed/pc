import React from "react";
import { Plus, Filter } from "lucide-react";
import type { useShoppingItems, ShoppingItem } from "./hooks";
import { EmptyState, CATEGORIES, PRIORITIES } from "./basis-componenten";
import { ShoppingItemCard } from "./shopping-item-card";
import { ShoppingModal } from "./shopping-modal";
import { PurchaseModal } from "./gekocht-modal";
import { BudgetOverzicht } from "./budget-overzicht";

export default function TeKopen() {
  const {
    items,
    isLoading,
    isError,
    addItem,
    updateItem,
    markPurchased,
    deleteItem,
  } = useShoppingItems();

  /* ---- State ---- */
  const [showModal, setShowModal] = React.useState(false);
  const [editItem, setEditItem] = React.useState<ShoppingItem | null>(null);
  const [purchaseItem, setPurchaseItem] = React.useState<ShoppingItem | null>(null);
  const [filterCategory, setFilterCategory] = React.useState<string>("");
  const [filterPriority, setFilterPriority] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<"date" | "price" | "priority">("date");

  /* ---- Filters & Sorting ---- */
  const filteredItems = React.useMemo(() => {
    let result = items.filter((item) => !item.purchased_at);

    if (filterCategory) {
      result = result.filter((item) => item.category === filterCategory);
    }

    if (filterPriority) {
      result = result.filter((item) => item.priority === filterPriority);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "price") {
        const priceA = a.estimated_cost_cents || 0;
        const priceB = b.estimated_cost_cents || 0;
        return priceB - priceA;
      }
      if (sortBy === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const orderA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
        const orderB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
        return orderA - orderB;
      }
      return 0;
    });

    return result;
  }, [items, filterCategory, filterPriority, sortBy]);

  /* ---- Handlers ---- */
  const handleAddClick = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleEditClick = (item: ShoppingItem) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleModalSubmit = (data: any) => {
    if (editItem) {
      updateItem.mutate(
        { id: editItem.id, data },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditItem(null);
          },
        }
      );
    } else {
      addItem.mutate(data, {
        onSuccess: () => {
          setShowModal(false);
        },
      });
    }
  };

  const handleMarkPurchased = (item: ShoppingItem) => {
    setPurchaseItem(item);
  };

  const handlePurchaseConfirm = (data: any) => {
    if (!purchaseItem) return;
    markPurchased.mutate(
      { id: purchaseItem.id, data },
      {
        onSuccess: () => {
          setPurchaseItem(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
  };

  /* ---- UI ---- */
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          ⚠️ Kan shopping items niet laden. Controleer je backend connectie.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Te Kopen</h1>
        <button
          onClick={handleAddClick}
          className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-2.5 rounded-brikx flex items-center gap-2 font-semibold shadow-lg hover:shadow-brikx transition-all"
        >
          <Plus className="w-4 h-4" />
          Nieuw item
        </button>
      </div>

      {/* Budget Overview */}
      {items.length > 0 && <BudgetOverzicht items={items} />}

      {/* Filters & Sort */}
      {filteredItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-brikx p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-brikx-teal" />
            <span className="font-semibold text-gray-700">Filters & Sortering</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Alle categorieën</option>
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
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Alle prioriteiten</option>
                {PRIORITIES.map((pri) => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sorteer op
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="date">Datum (nieuwste eerst)</option>
                <option value="price">Prijs (hoogste eerst)</option>
                <option value="priority">Prioriteit (hoogste eerst)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Laden...</div>
      ) : filteredItems.length === 0 ? (
        items.filter((i) => !i.purchased_at).length === 0 ? (
          <EmptyState onAddClick={handleAddClick} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Geen items gevonden met deze filters
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ShoppingItemCard
              key={item.id}
              item={item}
              onEdit={handleEditClick}
              onMarkPurchased={handleMarkPurchased}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ShoppingModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        onSubmit={handleModalSubmit}
        editItem={editItem}
        isPending={addItem.isPending || updateItem.isPending}
      />

      <PurchaseModal
        isOpen={!!purchaseItem}
        onClose={() => setPurchaseItem(null)}
        onConfirm={handlePurchaseConfirm}
        item={purchaseItem}
        isPending={markPurchased.isPending}
      />
    </div>
  );
}