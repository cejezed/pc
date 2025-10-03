// src/Components/uren/ProjectModal.tsx
import React from "react";
import { X, Plus, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../supabase"; // Was: "../../supabase" (dit klopt al waarschijnlijk)

// Import types and utilities
import type { Phase, Project } from "./types";
import { phaseShortcodes } from "./types";
import { EUR } from "./utils";

type Props = {
  phases: Phase[];
  onClose: () => void;
  project?: Project | null;
};

export default function ProjectModal({ phases, onClose, project }: Props) {
  const isEdit = !!project;

  // UPDATE (Supabase)
  const updateProject = useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      if (!project) return;
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => onClose(),
  });

  // INSERT (Supabase)
  const addProject = useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      const { error } = await supabase.from("projects").insert(payload).single();
      if (error) throw error;
      return true;
    },
    onSuccess: () => onClose(),
  });

  // Prefill vanuit bestaand project
  const existingRateCents = project?.default_rate_cents ?? 0;
  const existingBillingType = project?.billing_type ?? "hourly";
  const existingPhaseBudgetsCents = project?.phase_budgets ?? {};
  const existingPhaseRatesCents = project?.phase_rates_cents ?? {};
  const existingInvoiced = project?.invoiced_phases ?? [];

  const [form, setForm] = React.useState({
    name: project?.name ?? "",
    city: project?.city ?? "",
    client_name: project?.client_name ?? "",
    default_rate_euros: (existingRateCents / 100).toString() || "75",
    billing_type: existingBillingType as "hourly" | "fixed",
    phase_budgets: Object.fromEntries(
      Object.entries(existingPhaseBudgetsCents).map(([k, v]) => [
        k,
        (v / 100).toString(),
      ])
    ) as Record<string, string>,
    phase_rates: Object.fromEntries(
      Object.entries(existingPhaseRatesCents).map(([k, v]) => [
        k,
        (v / 100).toString(),
      ])
    ) as Record<string, string>,
    invoiced_phases: new Set(existingInvoiced) as Set<string>,
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const rateInCents = Math.round(parseFloat(form.default_rate_euros || "0") * 100);

    const phaseBudgets: Record<string, number> = {};
    if (form.billing_type === "fixed") {
      Object.entries(form.phase_budgets).forEach(([phase, amount]) => {
        const euros = parseFloat(amount || "0");
        if (isFinite(euros) && euros > 0) {
          phaseBudgets[phase] = Math.round(euros * 100);
        }
      });
    }

    const phaseRates: Record<string, number> = {};
    Object.entries(form.phase_rates).forEach(([code, eurosStr]) => {
      const euros = parseFloat(eurosStr || "0");
      if (isFinite(euros) && euros > 0) {
        phaseRates[code] = Math.round(euros * 100);
      }
    });

    const payload: Partial<Project> = {
      name: form.name.trim(),
      city: form.city.trim() || undefined,
      client_name: form.client_name.trim() || undefined,
      default_rate_cents: rateInCents,
      billing_type: form.billing_type,
      phase_budgets: Object.keys(phaseBudgets).length ? phaseBudgets : undefined,
      phase_rates_cents: Object.keys(phaseRates).length ? phaseRates : undefined,
      invoiced_phases: Array.from(form.invoiced_phases),
    };

    if (isEdit) {
      updateProject.mutate(payload);
    } else {
      addProject.mutate(payload);
    }
  };

  const totalBudget = React.useMemo(() => {
    return Object.values(form.phase_budgets)
      .map((v) => parseFloat(v || "0"))
      .filter((n) => isFinite(n) && n > 0)
      .reduce((a, b) => a + b, 0);
  }, [form.phase_budgets]);

  const toggleInvoiced = (code: string) => {
    setForm((prev) => {
      const next = new Set(prev.invoiced_phases);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, invoiced_phases: next };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? "Project bewerken" : "Nieuw project toevoegen"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Basisgegevens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Projectnaam *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Opdrachtgever"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Plaats"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Facturatie methode */}
          <div>
            <label className="block text-sm font-medium mb-1">Facturatie methode</label>
            <div className="flex gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="hourly"
                  checked={form.billing_type === "hourly"}
                  onChange={(e) =>
                    setForm({ ...form, billing_type: e.target.value as "hourly" | "fixed" })
                  }
                />
                <span className="ml-1">Op uurbasis</span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="fixed"
                  checked={form.billing_type === "fixed"}
                  onChange={(e) =>
                    setForm({ ...form, billing_type: e.target.value as "hourly" | "fixed" })
                  }
                />
                <span className="ml-1">Vast bedrag per fase</span>
              </label>
            </div>
          </div>

          {/* Uurtarief */}
          <div>
            <label className="block text-sm mb-1">Standaard uurtarief (€)</label>
            <input
              type="number"
              step="0.01"
              value={form.default_rate_euros}
              onChange={(e) => setForm({ ...form, default_rate_euros: e.target.value })}
              className="border rounded px-3 py-2 text-sm w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Je kunt per fase een afwijkend tarief instellen.
            </p>
          </div>

          {/* Fase instellingen */}
          <div>
            <label className="block text-sm mb-2">
              Fase instellingen (tarief, budget, gefactureerd)
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phases
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((phase) => (
                    <div key={phase.code} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20 shrink-0">
                        {phaseShortcodes[phase.code] || phase.code}:
                      </span>

                      {/* Per-fase tarief */}
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Tarief (€)"
                        value={form.phase_rates[phase.code] || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phase_rates: {
                              ...prev.phase_rates,
                              [phase.code]: e.target.value,
                            },
                          }))
                        }
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                        title="Afwijkend uurtarief voor deze fase"
                      />

                      {/* Per-fase budget (alleen bij 'fixed') */}
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Budget (€)"
                        value={form.phase_budgets[phase.code] || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phase_budgets: {
                              ...prev.phase_budgets,
                              [phase.code]: e.target.value,
                            },
                          }))
                        }
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                        title="Vast honorarium voor deze fase"
                      />

                      {/* Gefactureerd vlag */}
                      <label className="flex items-center gap-1 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={form.invoiced_phases.has(phase.code)}
                          onChange={() => toggleInvoiced(phase.code)}
                        />
                        Gefactureerd
                      </label>
                    </div>
                  ))}
              </div>

              <div className="mt-2 text-xs text-gray-600">
                • <strong>Tarief</strong> (optioneel) overschrijft het standaard uurtarief. <br />
                • <strong>Budget</strong> (optioneel) voor vaste honoraria. Lege velden worden overgeslagen.
              </div>
            </div>
          </div>

          {/* Totaal budget bij vaste prijs */}
          {form.billing_type === "fixed" && totalBudget > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Totaal project honorarium: </span>
                {EUR(totalBudget)}
              </div>
            </div>
          )}
        </div>

        {/* Actie knoppen */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              (isEdit ? updateProject.isPending : addProject.isPending)
            }
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
          >
            {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEdit
              ? updateProject.isPending
                ? "Opslaan..."
                : "Wijzigingen opslaan"
              : addProject.isPending
              ? "Toevoegen..."
              : "Project toevoegen"}
          </button>
        </div>
      </div>
    </div>
  );
}