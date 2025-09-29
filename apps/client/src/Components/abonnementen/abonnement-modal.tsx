// src/components/abonnementen/abonnement-modal.tsx
import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import type { Subscription, BillingCycle, SubscriptionCategory } from "./types";
import { EUR, todayISO, getNextBillingDate, getCancellationDeadline } from "./helpers";

type FormData = {
  name: string;
  description: string;
  category: SubscriptionCategory;
  cost_euros: string;
  billing_cycle: BillingCycle;
  start_date: string;
  cancellation_period_days: string;
  remind_days_before: string;
  payment_method: string;
  auto_renew: boolean;
  notes: string;
};

export function SubscriptionModal({
  open,
  onClose,
  onSubmit,
  initial,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Subscription>) => void;
  initial?: Subscription;
  isLoading: boolean;
}) {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    category: "other",
    cost_euros: "",
    billing_cycle: "monthly",
    start_date: todayISO(),
    cancellation_period_days: "30",
    remind_days_before: "30",
    payment_method: "",
    auto_renew: true,
    notes: "",
  });

  useEffect(() => {
    if (open && initial) {
      setForm({
        name: initial.name,
        description: initial.description || "",
        category: (initial.category as SubscriptionCategory) || "other",
        cost_euros: (initial.cost_cents / 100).toFixed(2),
        billing_cycle: initial.billing_cycle,
        start_date: initial.start_date,
        cancellation_period_days: String(initial.cancellation_period_days || 30),
        remind_days_before: String(initial.remind_days_before),
        payment_method: initial.payment_method || "",
        auto_renew: initial.auto_renew,
        notes: initial.notes || "",
      });
    } else if (open) {
      setForm({
        name: "",
        description: "",
        category: "other",
        cost_euros: "",
        billing_cycle: "monthly",
        start_date: todayISO(),
        cancellation_period_days: "30",
        remind_days_before: "30",
        payment_method: "",
        auto_renew: true,
        notes: "",
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.name.trim() || !form.cost_euros) return;

    const costCents = Math.round(parseFloat(form.cost_euros) * 100);
  const nextBillingDate = formData.next_billing_date || 
  getNextBillingDate(todayISO(), formData.billing_cycle);

    const payload: Partial<Subscription> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      cost_cents: costCents,
      billing_cycle: form.billing_cycle,
      start_date: form.start_date,
      cancellation_period_days: parseInt(form.cancellation_period_days) || 30,
      remind_days_before: parseInt(form.remind_days_before) || 30,
      payment_method: form.payment_method.trim() || undefined,
      auto_renew: form.auto_renew,
      next_billing_date: nextBilling,
      status: "active",
      notes: form.notes.trim() || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? "Abonnement bewerken" : "Nieuw abonnement"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Naam *
            </label>
            <input
              type="text"
              placeholder="Netflix, Spotify, Adobe..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Beschrijving
            </label>
            <input
              type="text"
              placeholder="Premium plan, Family account..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Categorie
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as SubscriptionCategory,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="streaming">🎬 Streaming</option>
                <option value="software">💻 Software</option>
                <option value="fitness">💪 Fitness</option>
                <option value="utilities">⚡ Utilities</option>
                <option value="other">📦 Anders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Betaalmethode
              </label>
              <input
                type="text"
                placeholder="Creditcard, iDEAL..."
                value={form.payment_method}
                onChange={(e) =>
                  setForm({ ...form, payment_method: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Kosten (€) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="9.99"
                value={form.cost_euros}
                onChange={(e) =>
                  setForm({ ...form, cost_euros: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Factuurfrequentie
              </label>
              <select
                value={form.billing_cycle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billing_cycle: e.target.value as BillingCycle,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="weekly">Wekelijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="quarterly">Per kwartaal</option>
                <option value="yearly">Jaarlijks</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Startdatum
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              ⏰ Opzegtermijn instelling
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Opzegtermijn (dagen)
                </label>
                <input
                  type="number"
                  value={form.cancellation_period_days}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cancellation_period_days: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Herinner me (dagen van tevoren)
                </label>
                <input
                  type="number"
                  value={form.remind_days_before}
                  onChange={(e) =>
                    setForm({ ...form, remind_days_before: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Je krijgt een waarschuwing {form.remind_days_before} dagen voor de
              uiterste opzegdatum
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.auto_renew}
              onChange={(e) =>
                setForm({ ...form, auto_renew: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Automatisch verlengen</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notities
            </label>
            <textarea
              placeholder="Extra informatie over dit abonnement..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.cost_euros || isLoading}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              "Bezig..."
            ) : (
              <>
                {isEdit ? "💾 Opslaan" : <><Plus className="w-4 h-4" /> Toevoegen</>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}