import React from "react";

/* =======================
   Helpers
======================= */
export const EUR = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);

export const CATEGORIES = [
  { value: "tech", label: "Technologie", color: "bg-blue-100 text-blue-800" },
  { value: "home", label: "Wonen", color: "bg-green-100 text-green-800" },
  { value: "clothing", label: "Kleding", color: "bg-purple-100 text-purple-800" },
  { value: "groceries", label: "Boodschappen", color: "bg-orange-100 text-orange-800" },
  { value: "other", label: "Anders", color: "bg-gray-100 text-gray-800" },
];

export const PRIORITIES = [
  { value: "low", label: "Laag", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Gemiddeld", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "Hoog", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

/* =======================
   Badge Components
======================= */
export function CategoryBadge({ category }: { category?: string }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  if (!cat) return null;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color}`}>
      {cat.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority?: string }) {
  const pri = PRIORITIES.find((p) => p.value === priority);
  if (!pri) return null;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pri.color}`}>
      {pri.label}
    </span>
  );
}

/* =======================
   Empty State
======================= */
export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🛒</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nog geen items op je verlanglijst
      </h3>
      <p className="text-gray-500 mb-6">
        Voeg items toe die je wilt aanschaffen
      </p>
      <button
        onClick={onAddClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Voeg eerste item toe
      </button>
    </div>
  );
}