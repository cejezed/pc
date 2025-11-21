// src/components/ideas/filter-componenten.tsx
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
        className="w-full pl-10 pr-4 py-2 bg-[#1F2833] border border-zeus-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zeus-accent text-white placeholder-gray-500"
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
        className="bg-[#1F2833] border border-zeus-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zeus-accent text-white"
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
        className="bg-[#1F2833] border border-zeus-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zeus-accent text-white"
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
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors"
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
    <div className="flex border border-zeus-border rounded-lg overflow-hidden">
      <button
        onClick={() => onChange("grid")}
        className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${view === "grid"
            ? "bg-zeus-accent text-white"
            : "bg-[#1F2833] text-gray-400 hover:bg-[#2d3436] hover:text-white"
          }`}
        title="Grid weergave"
      >
        <Grid3X3 className="w-4 h-4" />
        Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors border-l ${view === "list"
            ? "bg-zeus-accent text-white border-zeus-accent"
            : "bg-[#1F2833] text-gray-400 hover:bg-[#2d3436] hover:text-white border-zeus-border"
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
      className="bg-[#1F2833] border border-zeus-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zeus-accent text-white"
    >
      <option value="newest">Nieuwste eerst</option>
      <option value="oldest">Oudste eerst</option>
      <option value="priority">Op prioriteit</option>
      <option value="title">Op titel</option>
    </select>
  );
}
