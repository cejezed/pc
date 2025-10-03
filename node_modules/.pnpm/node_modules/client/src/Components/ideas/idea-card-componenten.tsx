// src/components/ideas/idea-card-componenten.tsx
import { Edit, Clock, Tag, Trash2 } from "lucide-react";
import type { Idea } from "./types";
import { IDEA_PRIORITIES, IDEA_STATUSES } from "./types";
import { useDeleteIdea } from "./hooks";

const getPriorityInfo = (priority: number) => {
  return IDEA_PRIORITIES.find(p => p.value === priority);
};

const getStatusInfo = (status: string) => {
  return IDEA_STATUSES.find(s => s.value === status);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export function IdeaCard({ idea, onEdit }: { idea: Idea; onEdit: (idea: Idea) => void }) {
  const deleteIdea = useDeleteIdea();
  const priorityInfo = getPriorityInfo(idea.priority);
  const statusInfo = getStatusInfo(idea.status);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Weet je zeker dat je "${idea.title}" wilt verwijderen?`)) {
      deleteIdea.mutate(idea.id, {
        onError: (error) => {
          console.error("Delete error:", error);
          alert("Kon idee niet verwijderen. Check de console voor details.");
        },
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-brikx-teal transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-brikx-teal transition-colors">
            {idea.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {priorityInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: priorityInfo.color + "20",
                  color: priorityInfo.color,
                }}
              >
                <span>{priorityInfo.icon}</span> {priorityInfo.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(idea)}
            className="text-gray-400 hover:text-brikx-teal p-1 transition-colors"
            title="Bewerken"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteIdea.isPending}
            className="text-gray-400 hover:text-red-600 p-1 transition-colors disabled:opacity-50"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note (Description) */}
      {idea.note && (
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {idea.note}
        </p>
      )}

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {idea.tags.length > 3 && (
            <span className="text-gray-500 text-xs">
              +{idea.tags.length - 3} meer
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {statusInfo && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: statusInfo.color + "20",
                color: statusInfo.color,
              }}
            >
              <span>{statusInfo.icon}</span> {statusInfo.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          {formatDate(idea.created_at)}
        </div>
      </div>
    </div>
  );
}

export function IdeaListItem({ idea, onEdit }: { idea: Idea; onEdit: (idea: Idea) => void }) {
  const deleteIdea = useDeleteIdea();
  const priorityInfo = getPriorityInfo(idea.priority);
  const statusInfo = getStatusInfo(idea.status);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Weet je zeker dat je "${idea.title}" wilt verwijderen?`)) {
      deleteIdea.mutate(idea.id, {
        onError: (error) => {
          console.error("Delete error:", error);
          alert("Kon idee niet verwijderen. Check de console voor details.");
        },
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm hover:border-brikx-teal transition-all">
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 hover:text-brikx-teal transition-colors">
              {idea.title}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit(idea)}
                className="text-gray-400 hover:text-brikx-teal p-1 transition-colors"
                title="Bewerken"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteIdea.isPending}
                className="text-gray-400 hover:text-red-600 p-1 transition-colors disabled:opacity-50"
                title="Verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {idea.note && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {idea.note}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority */}
            {priorityInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: priorityInfo.color + "20",
                  color: priorityInfo.color,
                }}
              >
                <span>{priorityInfo.icon}</span> {priorityInfo.label}
              </span>
            )}

            {/* Status */}
            {statusInfo && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: statusInfo.color + "20",
                  color: statusInfo.color,
                }}
              >
                <span>{statusInfo.icon}</span> {statusInfo.label}
              </span>
            )}

            {/* Tags */}
            {idea.tags && idea.tags.length > 0 && (
              <div className="flex gap-1">
                {idea.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {idea.tags.length > 2 && (
                  <span className="text-gray-500 text-xs self-center">
                    +{idea.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1 text-gray-500 text-xs ml-auto">
              <Clock className="w-3 h-3" />
              {formatDate(idea.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}