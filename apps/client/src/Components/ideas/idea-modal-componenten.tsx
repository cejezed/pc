// src/Components/ideas/idea-modal-componenten.tsx
import React from "react";
import { Plus, X, Save, Lightbulb } from "lucide-react";
// ✅ FIXED: Import types from types file, hooks from hooks file
import type { Idea, IdeaFormData } from "./types";
import { 
  useAddIdea, 
  useUpdateIdea, 
  useDeleteIdea,
  useUpdateIdeaStatus,
  useIdeaComments,
  useAddComment 
} from "./hooks";
import { 
  IDEA_CATEGORIES, 
  IDEA_PRIORITIES, 
  IDEA_STATUSES,
  EFFORT_ESTIMATES, 
  VALUE_ESTIMATES 
} from "./types";

// Helper function to get today's date
const todayISO = () => new Date().toISOString().split("T")[0];

/* Idea Form Modal */
export function IdeaFormModal({
  isOpen,
  onClose,
  idea, // For editing existing ideas
}: {
  isOpen: boolean;
  onClose: () => void;
  idea?: Idea;
}) {
  const addIdea = useAddIdea();
  const updateIdea = useUpdateIdea();
  const isEditing = !!idea;
  
  const [form, setForm] = React.useState<IdeaFormData>({
    title: idea?.title || "",
    description: idea?.description || "",
    category: idea?.category || "other",
    priority: idea?.priority || "medium",
    tags: idea?.tags || [],
    estimated_effort: idea?.estimated_effort || "medium",
    estimated_value: idea?.estimated_value || "medium",
    notes: idea?.notes || "",
    source: idea?.source || "",
  });

  const [tagInput, setTagInput] = React.useState("");

  // Reset form when idea changes
  React.useEffect(() => {
    if (idea) {
      setForm({
        title: idea.title,
        description: idea.description || "",
        category: idea.category,
        priority: idea.priority,
        tags: idea.tags || [],
        estimated_effort: idea.estimated_effort || "medium",
        estimated_value: idea.estimated_value || "medium",
        notes: idea.notes || "",
        source: idea.source || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        tags: [],
        estimated_effort: "medium",
        estimated_value: "medium",
        notes: "",
        source: "",
      });
    }
  }, [idea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      return;
    }

    const ideaData: Omit<Idea, "id" | "created_at" | "updated_at"> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      status: idea?.status || "new",
      priority: form.priority,
      tags: form.tags.length > 0 ? form.tags : undefined,
      estimated_effort: form.estimated_effort,
      estimated_value: form.estimated_value,
      notes: form.notes.trim() || undefined,
      source: form.source.trim() || undefined,
    };

    if (isEditing && idea) {
      updateIdea.mutate({ id: idea.id, ...ideaData }, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      addIdea.mutate(ideaData, {
        onSuccess: () => {
          onClose();
          setForm({
            title: "",
            description: "",
            category: "other",
            priority: "medium",
            tags: [],
            estimated_effort: "medium",
            estimated_value: "medium",
            notes: "",
            source: "",
          });
        },
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {isEditing ? "Idee bewerken" : "Nieuw idee toevoegen"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              placeholder="Wat is je idee?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              placeholder="Beschrijf je idee in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioriteit
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {IDEA_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.icon} {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Effort and Value Estimates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschatte inspanning
              </label>
              <select
                value={form.estimated_effort}
                onChange={(e) => setForm({ ...form, estimated_effort: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EFFORT_ESTIMATES.map((effort) => (
                  <option key={effort.value} value={effort.value}>
                    {effort.icon} {effort.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschatte waarde
              </label>
              <select
                value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VALUE_ESTIMATES.map((value) => (
                  <option key={value.value} value={value.value}>
                    {value.icon} {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Voeg tag toe..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bron (optioneel)
            </label>
            <input
              type="text"
              placeholder="Waar komt dit idee vandaan?"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra notities
            </label>
            <textarea
              placeholder="Aanvullende opmerkingen..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={
                !form.title.trim() ||
                (isEditing ? updateIdea.isPending : addIdea.isPending)
              }
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing
                ? updateIdea.isPending
                  ? "Opslaan..."
                  : "Wijzigingen opslaan"
                : addIdea.isPending
                ? "Toevoegen..."
                : "Idee toevoegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Idea Detail Modal */
export function IdeaDetailModal({
  isOpen,
  onClose,
  idea,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea;
  onEdit: () => void;
}) {
  const deleteIdea = useDeleteIdea();
  const updateStatus = useUpdateIdeaStatus();
  const { data: comments = [] } = useIdeaComments(idea.id);
  const addComment = useAddComment();
  
  const [commentText, setCommentText] = React.useState("");

  const handleStatusChange = (newStatus: Idea['status']) => {
    updateStatus.mutate({ id: idea.id, status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm("Weet je zeker dat je dit idee wilt verwijderen?")) {
      deleteIdea.mutate(idea.id, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    addComment.mutate({
      idea_id: idea.id,
      comment: commentText.trim(),
    }, {
      onSuccess: () => {
        setCommentText("");
      },
    });
  };

  const getCategoryInfo = () => {
    return IDEA_CATEGORIES.find(cat => cat.value === idea.category);
  };

  const getPriorityInfo = () => {
    return IDEA_PRIORITIES.find(p => p.value === idea.priority);
  };

  const getEffortInfo = () => {
    return EFFORT_ESTIMATES.find(e => e.value === idea.estimated_effort);
  };

  const getValueInfo = () => {
    return VALUE_ESTIMATES.find(v => v.value === idea.estimated_value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{idea.title}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: getCategoryInfo()?.color + "20", color: getCategoryInfo()?.color }}
              >
                {getCategoryInfo()?.icon} {getCategoryInfo()?.label}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: getPriorityInfo()?.color + "20", color: getPriorityInfo()?.color }}
              >
                {getPriorityInfo()?.icon} {getPriorityInfo()?.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        {idea.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Beschrijving</h4>
            <p className="text-gray-600">{idea.description}</p>
          </div>
        )}

        {/* Estimates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Inspanning</h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: getEffortInfo()?.color + "20", color: getEffortInfo()?.color }}
            >
              {getEffortInfo()?.icon} {getEffortInfo()?.label}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Waarde</h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: getValueInfo()?.color + "20", color: getValueInfo()?.color }}
            >
              {getValueInfo()?.icon} {getValueInfo()?.label}
            </span>
          </div>
        </div>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        {idea.source && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Bron</h4>
            <p className="text-gray-600 text-sm">{idea.source}</p>
          </div>
        )}

        {/* Notes */}
        {idea.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notities</h4>
            <p className="text-gray-600">{idea.notes}</p>
          </div>
        )}

        {/* Status Actions */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Status wijzigen</h4>
          <div className="flex flex-wrap gap-2">
            {IDEA_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value as Idea['status'])}
                disabled={idea.status === status.value}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  idea.status === status.value
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'hover:bg-gray-100 border border-gray-300'
                }`}
                style={{
                  backgroundColor: idea.status === status.value ? undefined : status.color + "20",
                  color: idea.status === status.value ? undefined : status.color,
                }}
              >
                {status.icon} {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Opmerkingen ({comments.length})</h4>
          
          {/* Add Comment */}
          <div className="mb-4">
            <textarea
              placeholder="Voeg een opmerking toe..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || addComment.isPending}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm"
            >
              {addComment.isPending ? "Toevoegen..." : "Opmerking toevoegen"}
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-700 text-sm">{comment.comment}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(comment.created_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-gray-500 text-sm italic">Nog geen opmerkingen</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Bewerken
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteIdea.isPending}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
          >
            {deleteIdea.isPending ? "Verwijderen..." : "Verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
