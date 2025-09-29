// src/components/te-kopen/helpers.ts

/* =======================
   Currency Formatter
======================= */
export const EUR = (cents: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);

/* =======================
   Categories
======================= */
export const CATEGORIES = [
  { value: "tech", label: "Technologie", color: "bg-blue-100 text-blue-800" },
  { value: "home", label: "Wonen", color: "bg-green-100 text-green-800" },
  { value: "clothing", label: "Kleding", color: "bg-purple-100 text-purple-800" },
  { value: "groceries", label: "Boodschappen", color: "bg-orange-100 text-orange-800" },
  { value: "other", label: "Anders", color: "bg-gray-100 text-gray-800" },
];

/* =======================
   Priorities
======================= */
export const PRIORITIES = [
  { value: "low", label: "Laag", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "Gemiddeld", color: "bg-blue-100 text-blue-700" },
  { value: "high", label: "Hoog", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700" },
];

/* =======================
   Helper Functions
======================= */
export function getCategoryLabel(value?: string) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getCategoryColor(value?: string) {
  return CATEGORIES.find((c) => c.value === value)?.color || "bg-gray-100 text-gray-800";
}

export function getPriorityLabel(value?: string) {
  return PRIORITIES.find((p) => p.value === value)?.label || value;
}

export function getPriorityColor(value?: string) {
  return PRIORITIES.find((p) => p.value === value)?.color || "bg-gray-100 text-gray-700";
}