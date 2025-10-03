import React from "react";
import { X, Plus, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase";
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
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  const addProject = useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      const { error } = await supabase.from("projects").insert(payload).single();
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

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
      Object.entries(existingPhaseBudgetsCents).map(([k, v]) => [k, (v / 100).toString()])
    ) as Record<string, string>,
    phase_rates: Object.fromEntries(
      Object.entries(existingPhaseRatesCents).map(([k, v]) => [k, (v / 100).toString()])
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
      <div className="bg-white rounded-brikx w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-brikx-dark">
            {isEdit ? "Project bewerken" : "Nieuw project"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* SECTIE 1: Basisgegevens */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-brikx-dark">Projectgegevens</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projectnaam *
              </label>
              <input
                type="text"
                placeholder="Bijv. Nieuwbouw woning Amsterdam"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opdrachtgever
                </label>
                <input
                  type="text"
                  placeholder="Naam opdrachtgever"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plaats
                </label>
                <input
                  type="text"
                  placeholder="Stad/plaats"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SECTIE 2: Facturatie */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-brikx-dark">Facturatie instellingen</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facturatie methode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="hourly"
                    checked={form.billing_type === "hourly"}
                    onChange={(e) =>
                      setForm({ ...form, billing_type: e.target.value as "hourly" | "fixed" })
                    }
                    className="w-4 h-4 text-brikx-teal"
                  />
                  <span>Op uurbasis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="fixed"
                    checked={form.billing_type === "fixed"}
                    onChange={(e) =>
                      setForm({ ...form, billing_type: e.target.value as "hourly" | "fixed" })
                    }
                    className="w-4 h-4 text-brikx-teal"
                  />
                  <span>Vaste honoraria per fase</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Standaard uurtarief (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.default_rate_euros}
                onChange={(e) => setForm({ ...form, default_rate_euros: e.target.value })}
                className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dit tarief wordt gebruikt tenzij je per fase een afwijkend tarief instelt
              </p>
            </div>
          </div>

          {/* SECTIE 3: Fase instellingen */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-brikx-dark mb-1">Fase instellingen</h4>
              <p className="text-sm text-gray-600">
                Optioneel: stel per fase een afwijkend tarief of budget in
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Fase</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Uurtarief (€)</th>
                    {form.billing_type === "fixed" && (
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Budget (€)</th>
                    )}
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Gefactureerd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {phases
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((phase) => (
                      <tr key={phase.code} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-600 mr-2">
                            {phaseShortcodes[phase.code]}
                          </span>
                          {phase.name}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder={form.default_rate_euros || "75"}
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
                            className="w-28 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                          />
                        </td>
                        {form.billing_type === "fixed" && (
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0"
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
                              className="w-28 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={form.invoiced_phases.has(phase.code)}
                            onChange={() => toggleInvoiced(phase.code)}
                            className="w-4 h-4 text-brikx-teal rounded"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {form.billing_type === "fixed" && totalBudget > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Totaal project budget: </span>
                  <span className="text-lg font-bold">{EUR(totalBudget)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              (isEdit ? updateProject.isPending : addProject.isPending)
            }
            className="flex-1 px-6 py-3 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-semibold shadow-lg"
          >
            {isEdit ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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