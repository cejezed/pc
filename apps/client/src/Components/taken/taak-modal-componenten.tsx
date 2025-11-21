import React from "react";
import { Plus, Save } from "lucide-react";
import { Modal, TagBadge } from "./basis-componenten";
import type { Task } from "./types";
import { useAddTask, useUpdateTask } from "./hooks";

export function TaskFormModal({
  isOpen,
  onClose,
  editTask,
}: {
  isOpen: boolean;
  onClose: () => void;
  editTask?: Task;
}) {
  const addTask = useAddTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    due_date: "",
    project: "",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = React.useState("");

  // Load edit data
  React.useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description || "",
        status: editTask.status,
        priority: editTask.priority,
        due_date: editTask.due_date || "",
        project: typeof editTask.project === 'string' ? editTask.project : editTask.project?.id || "",
        tags: editTask.tags || [],
      });
    } else {
      setForm({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: "",
        project: "",
        tags: [],
      });
    }
  }, [editTask, isOpen]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const payload: Partial<Task> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || undefined,
      project: form.project.trim() ? { id: form.project.trim(), name: form.project.trim(), color: 'gray' } : undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    };

    if (editTask) {
      updateTask.mutate({ id: editTask.id, ...payload }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      addTask.mutate(payload, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTask ? "Taak bewerken" : "Nieuwe taak"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Titel *
          </label>
          <input
            type="text"
            placeholder="Wat moet er gebeuren?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Omschrijving
          </label>
          <textarea
            placeholder="Extra details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            >
              <option value="todo">Te doen</option>
              <option value="in_progress">Bezig</option>
              <option value="done">Klaar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Prioriteit
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            >
              <option value="low">Laag</option>
              <option value="medium">Gemiddeld</option>
              <option value="high">Hoog</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Project
            </label>
            <input
              type="text"
              placeholder="Bijv. Website, App"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              className="w-full bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Voeg tag toe..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 bg-[#0B0C10] border border-zeus-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zeus-accent"
            />
            <button
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              Toevoegen
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6 pt-4 border-t border-zeus-border">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-zeus-border text-gray-400 rounded hover:bg-[#2d3436] hover:text-white transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.title.trim() || addTask.isPending || updateTask.isPending}
          className="flex-1 px-4 py-2 bg-zeus-accent text-white rounded hover:bg-zeus-accent-hover disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-zeus-accent/20 transition-all"
        >
          {editTask ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editTask ? "Bijwerken" : "Toevoegen"}
        </button>
      </div>
    </Modal>
  );
}