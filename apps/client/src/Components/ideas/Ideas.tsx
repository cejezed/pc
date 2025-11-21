// src/components/ideas/Ideas.tsx
import React from "react";
import { Plus } from "lucide-react";
import type { Idea } from "./types";
import { useIdeas } from "./hooks";
import { IdeaCard, IdeaListItem } from "./idea-card-componenten";
import { IdeaFormModal } from "./idea-modal-componenten";
import { SearchBar, FilterBar, ViewToggle, SortSelect } from "./filter-componenten";

export default function Ideas() {
  const { data: ideas = [], isLoading } = useIdeas();

  const [showModal, setShowModal] = React.useState(false);
  const [editIdea, setEditIdea] = React.useState<Idea | undefined>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [view, setView] = React.useState<"grid" | "list">("grid");

  // Filter and sort ideas
  const filteredIdeas = React.useMemo(() => {
    let result = ideas.filter(idea => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(query);
        const matchesNote = idea.note?.toLowerCase().includes(query);
        const matchesTags = idea.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNote && !matchesTags) return false;
      }

      // Status filter
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;

      // Priority filter (nu een nummer)
      if (priorityFilter !== "all" && idea.priority.toString() !== priorityFilter) return false;

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
          return b.priority - a.priority; // Hogere nummer = hogere prioriteit
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [ideas, searchQuery, statusFilter, priorityFilter, sortBy]);

  const handleEdit = (idea: Idea) => {
    setEditIdea(idea);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditIdea(undefined);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zeus-bg flex items-center justify-center">
        <div className="text-zeus-text-secondary">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zeus-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Orbitron',sans-serif]">Ideeën</h1>
            <p className="text-zeus-text-secondary mt-1">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? "idee" : "ideeën"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditIdea(undefined);
              setShowModal(true);
            }}
            className="bg-zeus-accent hover:bg-zeus-accent-hover text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-zeus-accent/20 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuw idee
          </button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex gap-3">
            <SortSelect value={sortBy} onChange={setSortBy} />
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Filters */}
        <div className="zeus-card rounded-lg border border-zeus-border p-4 shadow-sm">
          <FilterBar
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onReset={resetFilters}
          />
        </div>

        {/* Ideas Grid/List */}
        {filteredIdeas.length === 0 ? (
          <div className="zeus-card rounded-lg border border-zeus-border p-12 shadow-sm text-center">
            {ideas.length === 0 ? (
              <div className="text-zeus-text-secondary">
                <div className="text-6xl mb-4">💡</div>
                <p className="text-xl font-semibold mb-2">Nog geen ideeën</p>
                <p className="text-sm mb-6">Klik op "Nieuw idee" om te beginnen!</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-zeus-accent hover:bg-zeus-accent-hover text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-zeus-accent/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Eerste idee toevoegen
                </button>
              </div>
            ) : (
              <div className="text-zeus-text-secondary">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-semibold mb-2">Geen ideeën gevonden</p>
                <p className="text-sm">Pas je filters aan om meer resultaten te zien</p>
              </div>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => (
              <IdeaListItem key={idea.id} idea={idea} onEdit={handleEdit} />
            ))}
          </div>
        )}

        {/* Modal */}
        <IdeaFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          idea={editIdea}
        />
      </div>
    </div>
  );
}