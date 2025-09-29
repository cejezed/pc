import React from "react";
import { Plus } from "lucide-react";
import type { Idea } from "./types";
import { useIdeas } from "./hooks";
import { IdeaCard, IdeaListItem } from "./idea-card-componenten";
import { IdeaFormModal } from "./idea-modal-componenten";  // ✅ Alleen IdeaFormModal
import { SearchBar, FilterBar, ViewToggle, SortSelect } from "./filter-componenten";

export default function Ideas() {
  const { data: ideas = [], isLoading } = useIdeas();

  const [showModal, setShowModal] = React.useState(false);
  const [editIdea, setEditIdea] = React.useState<Idea | undefined>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [view, setView] = React.useState<"grid" | "list">("grid");

  // Extract unique categories
  const categories = React.useMemo(() => {
    const cats = ideas
      .map(i => i.category)
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort();
  }, [ideas]);

  // Filter and sort ideas
  const filteredIdeas = React.useMemo(() => {
    let result = ideas.filter(idea => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(query);
        const matchesDescription = idea.description?.toLowerCase().includes(query);
        const matchesTags = idea.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }

      // Status filter
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && idea.priority !== priorityFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && idea.category !== categoryFilter) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "priority": {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        }
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [ideas, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

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
    setCategoryFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Ideeën</h1>
            <p className="text-gray-600 mt-1">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? "idee" : "ideeën"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditIdea(undefined);
              setShowModal(true);
            }}
            className="btn-brikx-primary inline-flex items-center gap-2"
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
        <div className="card-brikx">
          <FilterBar
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            categoryFilter={categoryFilter}
            categories={categories}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onCategoryChange={setCategoryFilter}
            onReset={resetFilters}
          />
        </div>

        {/* Ideas Grid/List */}
        {filteredIdeas.length === 0 ? (
          <div className="card-brikx text-center py-12">
            {ideas.length === 0 ? (
              <div className="text-gray-500">
                <div className="text-4xl mb-3">💡</div>
                <p className="text-lg mb-2">Nog geen ideeën</p>
                <p className="text-sm mb-4">Klik op "Nieuw idee" om te beginnen!</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-brikx-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Eerste idee toevoegen
                </button>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-lg mb-2">Geen ideeën gevonden</p>
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
        {/* ✅ Changed from editIdea prop to idea */}
        <IdeaFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          idea={editIdea}
        />
      </div>
    </div>
  );
}
