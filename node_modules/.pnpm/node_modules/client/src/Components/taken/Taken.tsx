
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Trash2, Edit2 } from "lucide-react";
import { supabase } from "../../supabase";

// ============ Config / Debug ============
const DEBUG_IGNORE_USER_FILTER = false; // zet tijdelijk op true om alle taken te zien (zonder user-filter)

// ============ Types ============
export type Task = {
  id: string;
  user_id?: string | null;
  title: string;
  notes?: string | null;
  status: "todo" | "done";
  priority: 1 | 2 | 3; // 1=Low,2=Med,3=High
  due_date?: string | null; // ISO string (date)
  created_at?: string;
  updated_at?: string;
  tags?: string[] | null;
  project_id?: string | null;
};

type UpsertTaskInput = Omit<Task, "id" | "created_at" | "updated_at" | "status"> & {
  status?: Task["status"];
};

// ============ API ============
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

async function fetchTasks(): Promise<Task[]> {
  const user = await getCurrentUser();
  // Basisselectie
  let query = supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (!DEBUG_IGNORE_USER_FILTER) {
    if (!user) {
      // Als er geen user is, geef lege lijst terug
      return [];
    }
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Task[];
}

async function createTask(input: UpsertTaskInput): Promise<Task> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    title: input.title,
    notes: input.notes ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? 2,
    due_date: input.due_date ?? null,
    user_id: user.id,
    tags: input.tags ?? null,
    project_id: input.project_id ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

async function toggleTaskStatus(id: string, current: Task["status"]): Promise<Task> {
  const newStatus: Task["status"] = current === "done" ? "todo" : "done";
  const patch: Partial<Task> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "done") {
    // Als je een completed_at kolom hebt, kun je die hier ook zetten
    // @ts-ignore
    patch.completed_at = new Date().toISOString();
  } else {
    // @ts-ignore
    patch.completed_at = null;
  }
  return updateTask(id, patch);
}

// ============ UI Helpers ============
function priorityLabel(p: Task["priority"]) {
  switch (p) {
    case 1:
      return "Low";
    case 2:
      return "Medium";
    case 3:
      return "High";
    default:
      return "Medium";
  }
}

// ============ Component ============
export default function Taken() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError, error } = useQuery({
    queryKey: ["tasks", DEBUG_IGNORE_USER_FILTER],
    queryFn: fetchTasks,
  });

  // ============ Mutations ============
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditing(null);
    },
    onError: (err: any) => {
      alert(err?.message ?? "Aanmaken mislukt");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      updateTask(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowModal(false);
      setEditing(null);
    },
    onError: (err: any) => {
      alert(err?.message ?? "Bijwerken mislukt");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: any) => alert(err?.message ?? "Verwijderen mislukt"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      toggleTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: any) => alert(err?.message ?? "Status wijzigen mislukt"),
  });

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

  function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) {
      alert("Geef een titel op");
      return;
    }
    const notes = String(form.get("notes") || "");
    const due = String(form.get("due_date") || "") || null;
    const priority = Number(form.get("priority") || 2) as Task["priority"];

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        patch: { title, notes, due_date: due, priority },
      });
    } else {
      createMutation.mutate({
        title,
        notes,
        due_date: due,
        priority,
      });
    }
  }

  // ============ Render ============
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">📝 Taken</h1>
        <button
          onClick={onClickNew}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nieuwe taak
        </button>
      </div>

      {isLoading && <p>Bezig met laden…</p>}
      {isError && (
        <p className="text-red-600">
          Kon taken niet laden: {(error as any)?.message ?? "Onbekende fout"}
        </p>
      )}

      {!!tasks?.length && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-medium mb-2">To do</h2>
            <div className="space-y-2">
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
              {!todos.length && <p className="text-sm text-gray-500">Geen open taken.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-medium mb-2">Done</h2>
            <div className="space-y-2">
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
              {!dones.length && <p className="text-sm text-gray-500">Nog niets afgerond.</p>}
            </div>
          </div>
        </div>
      )}

      {!isLoading && (!tasks || tasks.length === 0) && (
        <p className="text-gray-600">Nog geen taken. Klik op “Nieuwe taak”.</p>
      )}

      {/* ======= Modal ======= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">
              {editing ? "Taak bewerken" : "Nieuwe taak"}
            </h3>

            <form onSubmit={onSubmitForm} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  name="title"
                  defaultValue={editing?.title ?? ""}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Bijv. Offerte sturen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notities</label>
                <textarea
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  className="w-full rounded-xl border px-3 py-2"
                  rows={3}
                  placeholder="Optioneel"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline</label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editing?.due_date ? editing.due_date.substring(0, 10) : ""}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Prioriteit</label>
                  <select
                    name="priority"
                    defaultValue={editing?.priority ?? 2}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                  }}
                  className="px-3 py-2 rounded-xl border"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editing ? "Opslaan" : "Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Row ============
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
  return (
    <div className="flex items-center justify-between rounded-xl border p-2">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-1 rounded-lg border hover:bg-gray-50"
          title={done ? "Terug naar To do" : "Markeer als gedaan"}
        >
          {done ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
        <div>
          <div className="font-medium">{task.title}</div>
          <div className="text-xs text-gray-500">
            Prio: {priorityLabel(task.priority)}
            {task.due_date ? ` • Due: ${task.due_date.substring(0, 10)}` : ""}
          </div>
          {task.notes && <div className="text-sm text-gray-600 mt-0.5">{task.notes}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-1 rounded-lg border hover:bg-gray-50"
          title="Bewerken"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-lg border hover:bg-gray-50"
          title="Verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
