// src/components/ideas/filter-componenten.tsx
import React from "react";
import { Search, Grid3X3, List, RotateCcw } from "lucide-react";

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
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brikx-teal"
      />
    </div>
  );
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
  onReset,
}: {
  statusFilter: string;
  priorityFilter: string;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onReset: () => void;
}) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
      >
        <option value="all">Alle statussen</option>
        <option value="new">Nieuw</option>
        <option value="idea">Idee</option>
        <option value="planning">Planning</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Klaar</option>
        <option value="implemented">Geïmplementeerd</option>
        <option value="archived">Gearchiveerd</option>
        <option value="rejected">Afgewezen</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
      >
        <option value="all">Alle prioriteiten</option>
        <option value="1">Laag</option>
        <option value="2">Gemiddeld</option>
        <option value="3">Hoog</option>
        <option value="4">Urgent</option>
        <option value="5">Kritiek</option>
      </select>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
          title="Filters resetten"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      )}
    </div>
  );
}

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
            ? "bg-brikx-teal text-white"
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
            ? "bg-brikx-teal text-white border-brikx-teal"
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
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
    >
      <option value="newest">Nieuwste eerst</option>
      <option value="oldest">Oudste eerst</option>
      <option value="priority">Op prioriteit</option>
      <option value="title">Op titel</option>
    </select>
  );
}