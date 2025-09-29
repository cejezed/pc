import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Calendar, Flag, Search, Filter, Edit2, Trash2, X, Briefcase, Home } from "lucide-react";
import { supabase } from "../../supabase";

// Types
type Task = {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  priority: number;
  due_date?: string | null;
  type: string;
  tags: string[];
  project_id?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
};

// Supabase queries
async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createTask(task: Partial<Task>): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...task,
      user_id: user?.id,
      status: "todo",
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

async function toggleTaskStatus(id: string, currentStatus: string): Promise<Task> {
  const newStatus = currentStatus === "done" ? "todo" : "done";
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;
  
  const { data, error } = await supabase
    .from("tasks")
    .update({ 
      status: newStatus,
      completed_at,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Helper functions
const getTaskBorderColor = (type: string, isCompleted: boolean) => {
  if (isCompleted) return "border-l-gray-300";
  return type === "work" ? "border-l-blue-500" : "border-l-purple-500";
};

const getTaskBackgroundColor = (type: string, isCompleted: boolean) => {
  if (isCompleted) return "bg-gray-50";
  return type === "work" ? "bg-blue-50/30" : "bg-purple-50/30";
};

export default function Taken() {
  const queryClient = useQueryClient();

  // State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "done">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "1" | "2" | "3">("all");
  const [filterType, setFilterType] = useState<"all" | "work" | "personal">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditingTask(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus !== "all" && task.status !== filterStatus) return false;
      if (filterPriority !== "all" && task.priority !== parseInt(filterPriority)) return false;
      if (filterType !== "all" && task.type !== filterType) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterType, searchQuery]);

  // Group tasks
  const { pending, completed } = useMemo(() => {
    return {
      pending: filteredTasks.filter((task) => task.status !== "done"),
      completed: filteredTasks.filter((task) => task.status === "done"),
    };
  }, [filteredTasks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<Task> = {
      title: formData.get("title") as string,
      notes: formData.get("notes") as string || null,
      priority: parseInt(formData.get("priority") as string),
      due_date: formData.get("due_date") as string || null,
      type: formData.get("type") as string,
      tags: [],
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Weet je zeker dat je deze taak wilt verwijderen?")) {
      deleteMutation.mutate(id);
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Hoog";
      case 2: return "Gemiddeld";
      case 3: return "Laag";
      default: return "Gemiddeld";
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "badge-danger";
      case 2: return "badge-warning";
      case 3: return "badge-success";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="spinner-brikx"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Taken</h1>
            <p className="text-gray-600 mt-1">
              {pending.length} openstaand • {completed.length} voltooid
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowModal(true);
            }}
            className="btn-brikx-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe taak
          </button>
        </div>

        {/* Filters */}
        <div className="card-brikx">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Zoek taken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-brikx"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="select-brikx"
              >
                <option value="all">Alle taken</option>
                <option value="todo">Openstaand</option>
                <option value="done">Voltooid</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-gray-500" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="select-brikx"
              >
                <option value="all">Alle prioriteiten</option>
                <option value="1">Hoog</option>
                <option value="2">Gemiddeld</option>
                <option value="3">Laag</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="select-brikx"
              >
                <option value="all">Alle types</option>
                <option value="work">Werk</option>
                <option value="personal">Privé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pending.length > 0 && (
            <div className="card-brikx p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Openstaande taken ({pending.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {pending.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    getPriorityLabel={getPriorityLabel}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completed.length > 0 && (
            <div className="card-brikx p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Voltooide taken ({completed.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {completed.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleMutation.mutate({ id: task.id, status: task.status })}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    getPriorityLabel={getPriorityLabel}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="card-brikx text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen taken gevonden</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterType !== "all"
                  ? "Pas je filters aan om taken te zien"
                  : "Maak je eerste taak aan om te beginnen"}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-brikx-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Eerste taak aanmaken
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-brikx-dark">
                  {editingTask ? "Taak bewerken" : "Nieuwe taak"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask?.title}
                    placeholder="Wat moet er gedaan worden?"
                    className="input-brikx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notities
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingTask?.notes || ""}
                    placeholder="Optionele details..."
                    className="textarea-brikx"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editingTask?.type || "work"}
                      className="select-brikx"
                    >
                      <option value="work">💼 Werk</option>
                      <option value="personal">🏠 Privé</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioriteit
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingTask?.priority || 2}
                      className="select-brikx"
                    >
                      <option value="1">Hoog</option>
                      <option value="2">Gemiddeld</option>
                      <option value="3">Laag</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editingTask?.due_date || ""}
                    className="input-brikx"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTask(null);
                    }}
                    className="flex-1 btn-brikx-secondary"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 btn-brikx-primary"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Bezig..."
                      : editingTask
                      ? "Opslaan"
                      : "Aanmaken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  getPriorityLabel,
  getPriorityColor,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getPriorityLabel: (p: number) => string;
  getPriorityColor: (p: number) => string;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
  const isCompleted = task.status === "done";

  return (
    <div className={`px-6 py-4 hover:bg-gray-50 transition-all border-l-4 ${getTaskBorderColor(task.type, isCompleted)} ${getTaskBackgroundColor(task.type, isCompleted)}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className={`w-5 h-5 hover:text-brikx-teal ${
              task.type === "work" ? "text-blue-500" : "text-purple-500"
            }`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.title}
                </h3>
                {task.type === "work" ? (
                  <Briefcase className="w-4 h-4 text-blue-500" />
                ) : (
                  <Home className="w-4 h-4 text-purple-500" />
                )}
              </div>
              {task.notes && (
                <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge-brikx ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>

              {task.due_date && (
                <div className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                }`}>
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(task.due_date).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              )}

              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-brikx-teal transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}