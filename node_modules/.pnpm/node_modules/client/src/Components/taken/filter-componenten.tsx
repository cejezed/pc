import { Search, SlidersHorizontal, Grid, List } from "lucide-react";

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
        placeholder="Zoek taken..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  );
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  projectFilter,
  projects,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
  onReset,
}: {
  statusFilter: string;
  priorityFilter: string;
  projectFilter: string;
  projects: string[];
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onReset: () => void;
}) {
  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {hasFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-blue-600 hover:text-blue-700"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="all">Alle statussen</option>
            <option value="todo">Te doen</option>
            <option value="in_progress">Bezig</option>
            <option value="done">Klaar</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Prioriteit
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="all">Alle prioriteiten</option>
            <option value="urgent">Urgent</option>
            <option value="high">Hoog</option>
            <option value="medium">Gemiddeld</option>
            <option value="low">Laag</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Project
          </label>
          <select
            value={projectFilter}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="all">Alle projecten</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("grid")}
        className={`p-2 rounded ${
          view === "grid"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Grid weergave"
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-2 rounded ${
          view === "list"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
        title="Lijst weergave"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
    >
      <option value="duedate">Deadline</option>
      <option value="priority">Prioriteit</option>
      <option value="newest">Nieuwste eerst</option>
      <option value="oldest">Oudste eerst</option>
      <option value="title">Titel (A-Z)</option>
    </select>
  );
}

export function QuickFilters({
  onFilterClick,
}: {
  onFilterClick: (filter: "today" | "week" | "overdue" | "completed") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterClick("today")}
        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
      >
        Vandaag
      </button>
      <button
        onClick={() => onFilterClick("week")}
        className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
      >
        Deze week
      </button>
      <button
        onClick={() => onFilterClick("overdue")}
        className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
      >
        Verlopen
      </button>
      <button
        onClick={() => onFilterClick("completed")}
        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
      >
        Afgerond
      </button>
    </div>
  );
}
