import React, { useMemo, useState } from "react";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import { useTasks } from "./hooks";
import type { Task } from "./types";
import { TaskCard, TaskListItem } from "./taak-card-componenten";
import { TaskFormModal } from "./taak-modal-componenten";
import { SearchBar, FilterBar, ViewToggle, SortSelect, QuickFilters } from "./filter-componenten";

export default function Taken() {
  const { data: tasks = [], isLoading, isError, error, refetch } = useTasks();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Extract unique projects
  const projects = useMemo(() => {
    const projs = new Set<string>();
    tasks.forEach(t => {
      if (typeof t.project === 'string' && t.project) projs.add(t.project);
      else if (t.project?.name) projs.add(t.project.name);
    });
    return Array.from(projs).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Project filter
      if (projectFilter !== "all") {
        const projName = typeof task.project === 'string' ? task.project : task.project?.name;
        if (projName !== projectFilter) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "priority":
          const pMap = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (pMap[b.priority as keyof typeof pMap] || 0) - (pMap[a.priority as keyof typeof pMap] || 0);
        case "duedate":
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter, sortBy]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(undefined);
  };

  const handleQuickFilter = (filter: "today" | "week" | "overdue" | "completed") => {
    // Reset other filters
    setSearchQuery("");
    setPriorityFilter("all");
    setProjectFilter("all");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "today":
        // Logic would be complex to implement via state only, 
        // better to set a specific "quickFilter" state if we want to support this fully.
        // For now, let's just set status to todo and sort by due date
        setStatusFilter("todo");
        setSortBy("duedate");
        break;
      case "week":
        setStatusFilter("todo");
        setSortBy("duedate");
        break;
      case "overdue":
        setStatusFilter("todo");
        setSortBy("duedate");
        break;
      case "completed":
        setStatusFilter("done");
        break;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zeus-bg flex items-center justify-center">
        <div className="text-zeus-text-secondary flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Taken laden...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zeus-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Orbitron',sans-serif]">Taken</h1>
            <p className="text-zeus-text-secondary mt-1">
              {filteredTasks.length} {filteredTasks.length === 1 ? "taak" : "taken"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isError && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Opnieuw
              </button>
            )}
            <button
              onClick={() => {
                setEditingTask(undefined);
                setShowModal(true);
              }}
              className="bg-zeus-accent hover:bg-zeus-accent-hover text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-zeus-accent/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nieuwe taak
            </button>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="bg-red-900/10 border border-red-900/50 rounded-lg p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error instanceof Error ? error.message : "Er is een fout opgetreden bij het laden van de taken."}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex gap-3">
              <SortSelect value={sortBy} onChange={setSortBy} />
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <FilterBar
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                projectFilter={projectFilter}
                projects={projects}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
                onProjectChange={setProjectFilter}
                onReset={resetFilters}
              />
            </div>
            <div className="lg:w-auto">
              <div className="zeus-card border border-zeus-border rounded-lg p-4 h-full flex items-center">
                <QuickFilters onFilterClick={handleQuickFilter} />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Grid/List */}
        {filteredTasks.length === 0 ? (
          <div className="zeus-card rounded-lg border border-zeus-border p-12 shadow-sm text-center">
            {tasks.length === 0 ? (
              <div className="text-zeus-text-secondary">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl font-semibold mb-2">Nog geen taken</p>
                <p className="text-sm mb-6">Maak je eerste taak aan om te beginnen!</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-zeus-accent hover:bg-zeus-accent-hover text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-zeus-accent/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Eerste taak maken
                </button>
              </div>
            ) : (
              <div className="text-zeus-text-secondary">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-semibold mb-2">Geen taken gevonden</p>
                <p className="text-sm">Pas je filters aan om meer resultaten te zien</p>
              </div>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskListItem key={task.id} task={task} onEdit={handleEdit} />
            ))}
          </div>
        )}

        {/* Modal */}
        <TaskFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          editTask={editingTask}
        />
      </div>
    </div>
  );
}
