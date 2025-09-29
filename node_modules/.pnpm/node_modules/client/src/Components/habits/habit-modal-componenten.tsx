import React, { useState, useEffect } from "react";
import { Plus, Bell, X } from "lucide-react";
import { Modal } from "./basis-componenten";
import { useCreateHabit, useUpdateHabit } from "./hooks";
import type { Habit } from "./types";

export function HabitModal({
  open,
  onClose,
  initial
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Habit>;
}) {
  const isEdit = !!initial?.id;
  
  const [form, setForm] = useState<Partial<Habit>>({
    name: initial?.name || "",
    description: initial?.description || "",
    frequency: (initial?.frequency as Habit["frequency"]) || "daily",
    target_count: initial?.target_count ?? 1,
    icon: initial?.icon || "✅",
    color: initial?.color || "#16a34a",
    active: initial?.active ?? true,
    sort_order: initial?.sort_order ?? 0,
    unit: initial?.unit || "",
    reminder_times: initial?.reminder_times || [],
  });

  const create = useCreateHabit();
  const update = useUpdateHabit(initial?.id);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name || "",
        description: initial?.description || "",
        frequency: (initial?.frequency as Habit["frequency"]) || "daily",
        target_count: initial?.target_count ?? 1,
        icon: initial?.icon || "✅",
        color: initial?.color || "#16a34a",
        active: initial?.active ?? true,
        sort_order: initial?.sort_order ?? 0,
        unit: initial?.unit || "",
        reminder_times: initial?.reminder_times || [],
      });
    }
  }, [open, initial]);

  const onSubmit = async () => {
    if (!form.name?.trim()) return;
    
    if (isEdit) {
      await update.mutateAsync(form);
    } else {
      await create.mutateAsync(form);
    }
    
    onClose();
  };

  const onAddReminder = () => {
    setForm((f) => ({
      ...f,
      reminder_times: [...(f.reminder_times || []), "08:00"],
    }));
  };

  const onChangeReminder = (index: number, value: string) => {
    setForm((f) => ({
      ...f,
      reminder_times: (f.reminder_times || []).map((x, idx) =>
        idx === index ? value : x
      ),
    }));
  };

  const onRemoveReminder = (index: number) => {
    setForm((f) => ({
      ...f,
      reminder_times: (f.reminder_times || []).filter((_, idx) => idx !== index),
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Habit bewerken" : "Nieuwe habit"}
    >
      <div className="grid gap-3">
        {/* Naam */}
        <label className="grid gap-1">
          <span className="text-sm font-medium">Naam *</span>
          <input
            type="text"
            className="rounded-xl border px-3 py-2"
            placeholder="Bijv. Dagelijks 30 min sporten"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>

        {/* Beschrijving */}
        <label className="grid gap-1">
          <span className="text-sm font-medium">Beschrijving (optioneel)</span>
          <textarea
            className="rounded-xl border px-3 py-2 resize-none"
            rows={2}
            placeholder="Extra toelichting..."
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        {/* Frequentie, Target, Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Frequentie</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={form.frequency}
              onChange={(e) =>
                setForm({
                  ...form,
                  frequency: e.target.value as Habit["frequency"],
                })
              }
            >
              <option value="daily">Dagelijks</option>
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Doel aantal</span>
            <input
              type="number"
              min={1}
              className="rounded-xl border px-3 py-2"
              value={form.target_count ?? 1}
              onChange={(e) =>
                setForm({ ...form, target_count: Number(e.target.value) })
              }
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Eenheid (optioneel)</span>
            <input
              type="text"
              className="rounded-xl border px-3 py-2"
              placeholder="min / stappen"
              value={form.unit || ""}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </label>
        </div>

        {/* Icon & Kleur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Icon (emoji)</span>
            <input
              type="text"
              className="rounded-xl border px-3 py-2 text-center text-xl"
              placeholder="✅"
              value={form.icon || ""}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Kleur</span>
            <input
              type="color"
              className="rounded-xl border px-3 py-2 h-10"
              value={form.color || "#16a34a"}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="text-sm font-medium">Actief</span>
          </label>
        </div>

        {/* Herinneringen */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Herinneringen
            </div>
            <button
              type="button"
              className="text-sm px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              onClick={onAddReminder}
            >
              + Tijd toevoegen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(form.reminder_times || []).length === 0 && (
              <div className="text-xs text-muted-foreground">
                Geen herinneringen ingesteld
              </div>
            )}

            {(form.reminder_times || []).map((time, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 border rounded-xl px-2 py-1"
              >
                <input
                  type="time"
                  value={time}
                  onChange={(e) => onChangeReminder(idx, e.target.value)}
                  className="outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => onRemoveReminder(idx)}
                  className="text-red-600 hover:bg-red-50 rounded p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!form.name?.trim() || create.isPending || update.isPending}
          className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 flex items-center gap-2"
        >
          {isEdit ? "Opslaan" : <><Plus className="w-4 h-4" /> Aanmaken</>}
        </button>
      </div>
    </Modal>
  );
}