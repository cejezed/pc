import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Trash2, Edit2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../supabase";

// ============ Types ============
export type Task = {
  id: string;
  title: string;
  notes?: string | null;
  status: "todo" | "done";
  priority: 1 | 2 | 3; // 1=Low, 2=Med, 3=High
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  tags?: string[] | null;
  project_id?: string | null;
  type?: string | null;
};

// ============ API Functions ============
async function fetchTasks(): Promise<Task[]> {
  console.log('📥 Fetching tasks...');
  
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    console.log('📊 Supabase response:', { data, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const tasks = (data ?? []) as Task[];
    console.log(`✅ Successfully fetched ${tasks.length} tasks`);
    return tasks;
    
  } catch (err) {
    console.error('💥 Fetch tasks failed:', err);
    throw err;
  }
}

async function createTask(input: Partial<Task>): Promise<Task> {
  console.log('➕ Creating task:', input);
  
  const taskData = {
    title: input.title,
    notes: input.notes ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? 2,
    due_date: input.due_date ?? null,
    tags: input.tags ?? [],
    project_id: input.project_id ?? null,
    type: input.type ?? 'work',
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select("*")
    .single();

  if (error) {
    console.error('❌ Create task error:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log('✅ Task created successfully:', data);
  return data as Task;
}

async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  console.log('📝 Updating task:', id, patch);
  
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error('❌ Update task error:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  console.log('✅ Task updated successfully:', data);
  return data as Task;
}

async function deleteTask(id: string): Promise<void> {
  console.log('🗑️ Deleting task:', id);
  
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error('❌ Delete task error:', error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }

  console.log('✅ Task deleted successfully');
}

async function toggleTaskStatus(id: string, current: Task["status"]): Promise<Task> {
  const newStatus: Task["status"] = current === "done" ? "todo" : "done";
  const patch: Partial<Task> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    completed_at: newStatus === "done" ? new Date().toISOString() : null,
  };
  
  return updateTask(id, patch);
}

// ============ UI Helpers ============
function priorityLabel(p: Task["priority"]) {
  switch (p) {
    case 1: return "Low";
    case 2: return "Medium";  
    case 3: return "High";
    default: return "Medium";
  }
}

function priorityColor(p: Task["priority"]) {
  switch (p) {
    case 1: return "bg-green-100 text-green-800";
    case 2: return "bg-blue-100 text-blue-800";
    case 3: return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

// ============ Debug Component ============
function DebugInfo({ tasks, error }: { tasks?: Task[]; error?: any }) {
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Debug info tonen
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">Debug Informatie:</span>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 font-mono">
        <div><strong>Tasks loaded:</strong> {tasks?.length ?? 'none'}</div>
        <div><strong>Error:</strong> {error?.message ?? 'none'}</div>
        <div><strong>Table exists:</strong> {tasks !== undefined ? 'Yes' : 'Unknown'}</div>
        
        {tasks && tasks.length > 0 && (
          <div>
            <strong>Sample task:</strong>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(tasks[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Main Component ============
export default function Taken() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    due_date: "",
    priority: 2 as Task["priority"],
  });

  // Enhanced query with better error handling
  const { data: tasks, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount}, error:`, error);
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showModal) {
      if (editing) {
        setFormData({
          title: editing.title || "",
          notes: editing.notes || "",
          due_date: editing.due_date ? editing.due_date.substring(0, 10) : "",
          priority: editing.priority || 2,
        });
      } else {
        setFormData({
          title: "",
          notes: "",
          due_date: "",
          priority: 2,
        });
      }
    }
  }, [showModal, editing]);

  // ============ Mutations ============
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      console.log('🎉 Create mutation success:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditing(null);
    },
    onError: (err: any) => {
      console.error('💥 Create mutation error:', err);
      alert(`Aanmaken mislukt: ${err?.message ?? 'Onbekende fout'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      updateTask(id, patch),
    onSuccess: (data) => {
      console.log('🎉 Update mutation success:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditing(null);
    },
    onError: (err: any) => {
      console.error('💥 Update mutation error:', err);
      alert(`Bijwerken mislukt: ${err?.message ?? 'Onbekende fout'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      console.log('🎉 Delete mutation success');
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: any) => {
      console.error('💥 Delete mutation error:', err);
      alert(`Verwijderen mislukt: ${err?.message ?? 'Onbekende fout'}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      toggleTaskStatus(id, status),
    onSuccess: (data) => {
      console.log('🎉 Toggle mutation success:', data);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: any) => {
      console.error('💥 Toggle mutation error:', err);
      alert(`Status wijzigen mislukt: ${err?.message ?? 'Onbekende fout'}`);
    },
  });

  // Computed values
  const todos = useMemo(
    () => (tasks ?? []).filter((t) => t.status !== "done"),
    [tasks]
  );
  const dones = useMemo(
    () => (tasks ?? []).filter((t) => t.status === "done"),
    [tasks]
  );

  // ============ Handlers ============
  function onClickNew() {
    setEditing(null);
    setShowModal(true);
  }

  function onClickEdit(task: Task) {
    setEditing(task);
    setShowModal(true);
  }

  function onSubmitForm() {
    if (!formData.title.trim()) {
      alert("Geef een titel op");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      notes: formData.notes.trim() || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
    };

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        patch: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  }

  // ============ Render ============
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Taken</h1>
            <p className="text-gray-600 mt-1">Beheer je taken en to-do's</p>
          </div>
          <div className="flex items-center gap-3">
            {isError && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Opnieuw laden
              </button>
            )}
            <button
              onClick={onClickNew}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nieuwe taak
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Laden...
            </div>
          </div>
        )}
        
        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Fout bij laden van taken</h3>
            </div>
            <p className="text-red-700 mb-4">
              {error?.message ?? "Er is een onbekende fout opgetreden bij het ophalen van je taken."}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Opnieuw proberen
              </button>
              
              <DebugInfo error={error} />
            </div>
          </div>
        )}

        {/* Success State */}
        {!isLoading && !isError && tasks && (
          <>
            {tasks.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Todo Column */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    To do ({todos.length})
                  </h2>
                  <div className="space-y-3">
                    {todos.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        onToggle={() => toggleMutation.mutate({ id: t.id, status: t.status })}
                        onEdit={() => onClickEdit(t)}
                        onDelete={() => {
                          if (confirm("Taak verwijderen?")) deleteMutation.mutate(t.id);
                        }}
                      />
                    ))}
                    {todos.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        Geen open taken
                      </p>
                    )}
                  </div>
                </div>

                {/* Done Column */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-green-600">
                    Klaar ({dones.length})
                  </h2>
                  <div className="space-y-3">
                    {dones.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        onToggle={() => toggleMutation.mutate({ id: t.id, status: t.status })}
                        onEdit={() => onClickEdit(t)}
                        onDelete={() => {
                          if (confirm("Taak verwijderen?")) deleteMutation.mutate(t.id);
                        }}
                      />
                    ))}
                    {dones.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        Nog niets afgerond
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                <Circle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen taken gevonden</h3>
                <p className="text-gray-600 mb-6">Klik op "Nieuwe taak" om je eerste taak aan te maken.</p>
                <button
                  onClick={onClickNew}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Eerste taak maken
                </button>
              </div>
            )}

            <DebugInfo tasks={tasks} />
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                {editing ? "Taak bewerken" : "Nieuwe taak"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titel *
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bijv. Offerte sturen"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optionele beschrijving..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioriteit
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) as Task["priority"] })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={onSubmitForm}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                    {editing ? "Opslaan" : "Aanmaken"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Task Row Component ============
function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";
  const overdue = task.due_date && new Date(task.due_date) < new Date() && !done;
  
  return (
    <div className={`flex items-center justify-between border-2 rounded-lg p-3 transition-all hover:shadow-sm ${
      done ? 'border-green-200 bg-green-50' : 
      overdue ? 'border-red-200 bg-red-50' : 
      'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
            done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
          }`}
          title={done ? "Terug naar To do" : "Markeer als gedaan"}
        >
          {done && <CheckCircle2 className="w-4 h-4 text-white" />}
          {!done && <Circle className="w-4 h-4 text-gray-400" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span className={`px-2 py-0.5 rounded-full font-medium ${priorityColor(task.priority)}`}>
              {priorityLabel(task.priority)}
            </span>
            
            {task.due_date && (
              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(task.due_date).toLocaleDateString('nl-NL')}
              </span>
            )}
            
            {task.type && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {task.type}
              </span>
            )}
          </div>
          
          {task.notes && (
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">{task.notes}</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0 ml-3">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Bewerken"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          title="Verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
