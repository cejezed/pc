import React from "react";
import { X } from "lucide-react";

/* Priority Badge */
export function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  }[priority] || "bg-gray-100 text-gray-700";

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
    todo: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  }[status] || "bg-gray-100 text-gray-700";

  const labels = {
    todo: "Te doen",
    in_progress: "Bezig",
    done: "Klaar",
  }[status] || status;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
      {labels}
    </span>
  );
}

/* Project Badge */
export function ProjectBadge({ project }: { project?: string }) {
  if (!project) return null;

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
      {project}
    </span>
  );
}

/* Tag Badge */
export function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      #{tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-gray-900">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

/* Is Overdue */
export function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

/* Days Until */
export function daysUntil(dueDate?: string) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return days;
}