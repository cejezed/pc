// src/Components/ideas/filter-componenten.tsx
import React from "react";
import { Search, Grid3X3, List, RotateCcw } from "lucide-react";

// Search Bar Component
export function SearchBar({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Zoek ideeën..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

// Filter Bar Component
export function FilterBar({
  statusFilter,
  priorityFilter,
  categoryFilter,
  categories,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onReset,
}: {
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  categories: string[];
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Alle statussen</option>
        <option value="new">Nieuw</option>
        <option value="in_progress">In Progress</option>
        <option value="implemented">Geïmplementeerd</option>
        <option value="archived">Gearchiveerd</option>
        <option value="rejected">Afgewezen</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Alle prioriteiten</option>
        <option value="urgent">Urgent</option>
        <option value="high">Hoog</option>
        <option value="medium">Gemiddeld</option>
        <option value="low">Laag</option>
      </select>

      {/* Category Filter */}
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Alle categorieën</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === 'business' && '💼 Business'}
            {category === 'product' && '📦 Product'}
            {category === 'feature' && '⚡ Feature'}
            {category === 'improvement' && '🔧 Verbetering'}
            {category === 'other' && '💡 Overig'}
          </option>
        ))}
      </select>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
          title="Filters resetten"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      )}
    </div>
  );
}

// View Toggle Component
export function ViewToggle({ 
  view, 
  onChange 
}: { 
  view: "grid" | "list"; 
  onChange: (view: "grid" | "list") => void; 
}) {
  return (
    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => onChange("grid")}
        className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
          view === "grid"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        title="Grid weergave"
      >
        <Grid3X3 className="w-4 h-4" />
        Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors border-l ${
          view === "list"
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
        }`}
        title="Lijst weergave"
      >
        <List className="w-4 h-4" />
        Lijst
      </button>
    </div>
  );
}

// Sort Select Component
export function SortSelect({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="newest">Nieuwste eerst</option>
      <option value="oldest">Oudste eerst</option>
      <option value="priority">Op prioriteit</option>
      <option value="title">Op titel</option>
    </select>
  );
}