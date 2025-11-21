import React from "react";
import { X } from "lucide-react";

/* Priority Badge */
export function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: "bg-gray-800 text-gray-300",
    medium: "bg-blue-900/50 text-blue-300",
    high: "bg-orange-900/50 text-orange-300",
    urgent: "bg-red-900/50 text-red-300",
  }[priority] || "bg-gray-800 text-gray-300";

  const labels = {
    low: "Laag",
    medium: "Gemiddeld",
    high: "Hoog",
    urgent: "Urgent",
  }[priority] || priority;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
      {labels}
    </span>
  );
}

/* Status Badge */
export function StatusBadge({ status }: { status: string }) {
  const colors = {
    idea: "bg-purple-900/50 text-purple-300",
    planning: "bg-blue-900/50 text-blue-300",
    in_progress: "bg-yellow-900/50 text-yellow-300",
    done: "bg-green-900/50 text-green-300",
    archived: "bg-gray-800 text-gray-400",
  }[status] || "bg-gray-800 text-gray-400";

  const labels = {
    idea: "Idee",
    planning: "Planning",
    in_progress: "Bezig",
    done: "Klaar",
    archived: "Archief",
  }[status] || status;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
      {labels}
    </span>
  );
}

/* Tag Badge */
export function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-white">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/* Modal Wrapper */
export function Modal({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="zeus-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zeus-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Format Date */
export function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}