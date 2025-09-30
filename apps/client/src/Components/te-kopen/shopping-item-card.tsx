import { ExternalLink, Edit2, Check, Trash2, Tag } from "lucide-react";
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-brikx-teal transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.category && <CategoryBadge category={item.category} />}
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-gray-400 hover:text-brikx-teal hover:bg-blue-50 rounded transition-colors"
            title="Bewerken"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {item.estimated_cost_cents !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Geschat:</span>
            <span className="font-medium text-gray-900">
              {EUR(item.estimated_cost_cents)}
            </span>
          </div>
        )}

        {item.store && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Winkel:</span>
            <span className="text-gray-900">{item.store}</span>
          </div>
        )}

        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brikx-teal hover:text-brikx-teal-dark transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Bekijk product
          </a>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-brikx-teal/10 text-brikx-teal px-2 py-1 rounded text-xs font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.notes && (
          <p className="text-gray-600 italic pt-2 border-t">{item.notes}</p>
        )}
      </div>

      <button
        onClick={() => onMarkPurchased(item)}
        className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
      >
        <Check className="w-4 h-4" />
        Markeer als gekocht
      </button>
    </div>
  );
}
