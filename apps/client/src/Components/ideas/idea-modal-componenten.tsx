// src/components/ideas/idea-modal-componenten.tsx
import React from "react";
import { Plus, X, Save, Lightbulb, Trash2, Archive } from "lucide-react";
import type { Idea, IdeaFormData } from "./types";
import { useAddIdea, useUpdateIdea, useDeleteIdea, useUpdateIdeaStatus } from "./hooks";
import { IDEA_PRIORITIES, IDEA_STATUSES } from "./types";

/* Idea Form Modal */
export function IdeaFormModal({
  isOpen,
  onClose,
  idea,
}: {
  isOpen: boolean;
  onClose: () => void;
  idea?: Idea;
}) {
  const addIdea = useAddIdea();
  const updateIdea = useUpdateIdea();
  const isEditing = !!idea;

  const [form, setForm] = React.useState<IdeaFormData>({
    title: "",
    note: "",
    status: "new",
    priority: 2,
    tags: [],
  });

  const [tagInput, setTagInput] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      if (idea) {
        setForm({
          title: idea.title,
          note: idea.note || "",
          status: idea.status || "new",
          priority: idea.priority || 2,
          tags: idea.tags || [],
        });
      } else {
        setForm({
          title: "",
          note: "",
          status: "new",
          priority: 2,
          tags: [],
        });
      }
      setTagInput("");
    }
  }, [idea, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    const ideaData = {
      title: form.title.trim(),
      note: form.note.trim() || undefined,
      status: form.status,
      priority: form.priority,
      tags: form.tags.length > 0 ? form.tags : undefined,
    };

    if (isEditing && idea) {
      updateIdea.mutate({ id: idea.id, ...ideaData }, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      addIdea.mutate(ideaData as any, {
        onSuccess: () => {
          onClose();
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="zeus-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zeus-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-zeus-accent" />
            {isEditing ? "Idee bewerken" : "Nieuw idee toevoegen"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Titel *
            </label>
            <input
              type="text"
              placeholder="Wat is je idee?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all text-white placeholder-gray-600"
              required
            />
          </div>

          {/* Note (Description) */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notities
            </label>
            <textarea
              placeholder="Beschrijf je idee in detail..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all text-white placeholder-gray-600"
              rows={4}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[#0B0C10] border border-zeus-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all text-white"
              >
                {IDEA_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Prioriteit
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="w-full bg-[#0B0C10] border border-zeus-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all text-white"
              >
                {IDEA_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.icon} {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Voeg tag toe..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-[#0B0C10] border border-zeus-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all text-white placeholder-gray-600"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-zeus-accent/10 text-zeus-accent px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-zeus-accent hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zeus-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-zeus-border text-gray-400 rounded-lg hover:bg-[#2d3436] hover:text-white transition-colors font-semibold"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={
                !form.title.trim() ||
                (isEditing ? updateIdea.isPending : addIdea.isPending)
              }
              className="flex-1 px-6 py-2.5 bg-zeus-accent text-white rounded-lg hover:bg-zeus-accent-hover disabled:bg-gray-700 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-zeus-accent/20 flex items-center justify-center gap-2"
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

/* Idea Detail Modal - Met Archive én Delete */
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

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: idea.id, status: newStatus });
  };

  const handleArchive = () => {
    if (window.confirm("Dit idee archiveren?")) {
      updateStatus.mutate({ id: idea.id, status: "archived" }, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Weet je zeker dat je dit idee definitief wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.")) {
      deleteIdea.mutate(idea.id, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Delete error:", error);
          alert("Kon idee niet verwijderen. Check de console voor details.");
        },
      });
    }
  };

  const getStatusInfo = () => {
    return IDEA_STATUSES.find(s => s.value === idea.status);
  };

  const getPriorityInfo = () => {
    return IDEA_PRIORITIES.find(p => p.value === idea.priority);
  };

  if (!isOpen) return null;

  const statusInfo = getStatusInfo();
  const priorityInfo = getPriorityInfo();
  const isArchived = idea.status === "archived";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="zeus-card rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zeus-border">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white mb-3">{idea.title}</h3>
            <div className="flex flex-wrap gap-2">
              {statusInfo && (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: statusInfo.color + "20", color: statusInfo.color }}
                >
                  <span>{statusInfo.icon}</span> {statusInfo.label}
                </span>
              )}
              {priorityInfo && (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: priorityInfo.color + "20", color: priorityInfo.color }}
                >
                  <span>{priorityInfo.icon}</span> {priorityInfo.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Note */}
        {idea.note && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Notities</h4>
            <p className="text-gray-400 leading-relaxed">{idea.note}</p>
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Status wijzigen</h4>
          <div className="flex flex-wrap gap-2">
            {IDEA_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                disabled={idea.status === status.value}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${idea.status === status.value
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'hover:shadow-md border border-gray-700'
                  }`}
                style={{
                  backgroundColor: idea.status === status.value ? undefined : status.color + "20",
                  color: idea.status === status.value ? undefined : status.color,
                  borderColor: idea.status === status.value ? undefined : status.color + "40",
                }}
              >
                <span>{status.icon}</span> {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-zeus-border">
          <button
            onClick={onEdit}
            className="flex-1 px-6 py-2.5 bg-zeus-accent text-white rounded-lg hover:bg-zeus-accent-hover transition-all font-semibold shadow-lg hover:shadow-zeus-accent/20"
          >
            Bewerken
          </button>

          {!isArchived && (
            <button
              onClick={handleArchive}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold flex items-center gap-2"
              title="Archiveer dit idee (kan later weer geactiveerd worden)"
            >
              <Archive className="w-4 h-4" />
              Archiveer
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleteIdea.isPending}
            className="px-6 py-2.5 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white disabled:bg-gray-800 transition-all font-semibold flex items-center gap-2"
            title="Definitief verwijderen (kan niet ongedaan gemaakt worden)"
          >
            <Trash2 className="w-4 h-4" />
            {deleteIdea.isPending ? "Verwijderen..." : "Verwijder"}
          </button>
        </div>
      </div>
    </div>
  );
}