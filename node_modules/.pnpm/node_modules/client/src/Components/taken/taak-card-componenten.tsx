import { Check, Circle, Clock, Edit2, Trash2, AlertCircle } from "lucide-react";
import type { Task } from "./types";
import { useUpdateTask, useDeleteTask } from "./hooks";
import { PriorityBadge, StatusBadge, ProjectBadge, formatDate, isOverdue, daysUntil } from "./basis-componenten";

export function TaskCard({ 
  task, 
  onEdit 
}: { 
  task: Task; 
  onEdit: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggleComplete = () => {
    const newStatus = task.status === "done" ? "todo" : "done";
    const completed_at = newStatus === "done" ? new Date().toISOString() : undefined;
    updateTask.mutate({ 
      id: task.id, 
      status: newStatus,
      completed_at 
    });
  };

  const handleDelete = () => {
    if (confirm("Taak verwijderen?")) {
      deleteTask.mutate(task.id);
    }
  };

  const overdue = isOverdue(task.due_date) && task.status !== "done";
  const days = daysUntil(task.due_date);

  // Extract project name as string
  const projectName = typeof task.project === 'string' 
    ? task.project 
    : task.project?.name || '';

  return (
    <div className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-shadow ${
      task.status === "done" ? "border-green-200 bg-green-50/50" : 
      overdue ? "border-red-200 bg-red-50/50" : "border-gray-200"
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.status === "done"
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-green-500"
          }`}
        >
          {task.status === "done" && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-medium ${
              task.status === "done" ? "text-gray-500 line-through" : "text-gray-900"
            }`}>
              {task.title}
            </h3>
            
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {projectName && <ProjectBadge project={projectName} />}
          </div>

          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs ${
              overdue ? "text-red-600 font-medium" : 
              days !== null && days <= 3 && days >= 0 ? "text-orange-600" : 
              "text-gray-500"
            }`}>
              {overdue ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Verlopen: {formatDate(task.due_date)}
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  {formatDate(task.due_date)}
                  {days !== null && days >= 0 && days <= 7 && (
                    <span className="ml-1">({days} {days === 1 ? "dag" : "dagen"})</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskListItem({ 
  task, 
  onEdit 
}: { 
  task: Task; 
  onEdit: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggleComplete = () => {
    const newStatus = task.status === "done" ? "todo" : "done";
    const completed_at = newStatus === "done" ? new Date().toISOString() : undefined;
    updateTask.mutate({ 
      id: task.id, 
      status: newStatus,
      completed_at 
    });
  };

  const handleDelete = () => {
    if (confirm("Taak verwijderen?")) {
      deleteTask.mutate(task.id);
    }
  };

  const overdue = isOverdue(task.due_date) && task.status !== "done";

  // Extract project name as string
  const projectName = typeof task.project === 'string' 
    ? task.project 
    : task.project?.name || '';

  return (
    <div className={`bg-white border-2 rounded-lg p-3 hover:shadow-sm transition-shadow flex items-center gap-3 ${
      task.status === "done" ? "border-green-200 bg-green-50/50" : 
      overdue ? "border-red-200 bg-red-50/50" : "border-gray-200"
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.status === "done"
            ? "bg-green-500 border-green-500"
            : "border-gray-300 hover:border-green-500"
        }`}
      >
        {task.status === "done" && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium flex-1 ${
            task.status === "done" ? "text-gray-500 line-through" : "text-gray-900"
          }`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.due_date && (
              <span className={`text-xs ${
                overdue ? "text-red-600 font-medium" : "text-gray-500"
              }`}>
                {formatDate(task.due_date)}
              </span>
            )}
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {projectName && <ProjectBadge project={projectName} />}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}