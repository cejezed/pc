import { ExternalLink, Edit2, Check, Trash2 } from "lucide-react";
import type { ShoppingItem } from "./hooks";
import { EUR, CategoryBadge, PriorityBadge } from "./basis-componenten";

type ShoppingItemCardProps = {
  item: ShoppingItem;
  onEdit: (item: ShoppingItem) => void;
  onMarkPurchased: (item: ShoppingItem) => void;
  onDelete: (id: string) => void;
};

export function ShoppingItemCard({
  item,
  onEdit,
  onMarkPurchased,
  onDelete,
}: ShoppingItemCardProps) {
  const handleDelete = () => {
    if (confirm(`Weet je zeker dat je "${item.name}" wilt verwijderen?`)) {
      onDelete(item.id);
    }
  };

  return (
    <div className="zeus-card p-4 hover:shadow-[0_0_15px_var(--zeus-primary-glow)] hover:border-[var(--zeus-primary)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--zeus-text)] mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-[var(--zeus-text-secondary)] mb-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.category && <CategoryBadge category={item.category} />}
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-primary)] hover:bg-blue-500/10 rounded transition-colors"
            title="Bewerken"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-[var(--zeus-text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {item.estimated_cost_cents !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[var(--zeus-text-secondary)]">Geschat:</span>
            <span className="font-medium text-[var(--zeus-text)]">
              {EUR(item.estimated_cost_cents)}
            </span>
          </div>
        )}

        {item.store && (
          <div className="flex items-center justify-between">
            <span className="text-[var(--zeus-text-secondary)]">Winkel:</span>
            <span className="text-[var(--zeus-text)]">{item.store}</span>
          </div>
        )}

        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[var(--zeus-primary)] hover:text-[var(--zeus-primary-dark)] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Bekijk product
          </a>
        )}

        {item.notes && (
          <p className="text-[var(--zeus-text-secondary)] italic pt-2 border-t border-[var(--zeus-border)]">{item.notes}</p>
        )}
      </div>

      <button
        onClick={() => onMarkPurchased(item)}
        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
      >
        <Check className="w-4 h-4" />
        Markeer als gekocht
      </button>
    </div>
  );
}