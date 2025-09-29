import React from "react";
import { X } from "lucide-react";
import type { Project, Phase, TimeEntry } from "./types";
import { EUR } from "./utils";
import { supabase } from "../../supabase"; // Was: "./supabase"
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  projects: Project[];
  phases: Phase[];
  timeEntries: TimeEntry[];
  onClose: () => void;
};

function entryHours(e: any) {
  return e.minutes ? e.minutes / 60 : e.hours || 0;
}

export default function FactureerModal({ projects, phases, timeEntries, onClose }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<"hourly" | "fixed">("hourly");

  // ---------- URENBASIS ----------
  const [hourlyProjectId, setHourlyProjectId] = React.useState<string>("");
  const [until, setUntil] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");

  const hourlyEligible = React.useMemo(() => {
    const rows = timeEntries.filter((e: any) => !e.invoiced_at && e.occurred_on <= until);
    return hourlyProjectId ? rows.filter((e) => e.project_id === hourlyProjectId) : rows;
  }, [timeEntries, hourlyProjectId, until]);

  const totalEligibleAmount = React.useMemo(() => {
    return hourlyEligible.reduce((sum, e) => {
      const p = (e as any).projects || (e as any).project || projects.find((pp) => pp.id === e.project_id);
      if (!p) return sum;
      const phaseRates = ((p as any).phase_rates_cents || {}) as Record<string, number>;
      const rate = (phaseRates[e.phase_code] ?? p.default_rate_cents ?? 0) / 100;
      return sum + entryHours(e) * rate;
    }, 0);
  }, [hourlyEligible, projects]);

  async function confirmHourlyOnAmount() {
    const target = parseFloat(amount || "0");
    if (!isFinite(target) || target <= 0) return;
    let remaining = target;

    // FIFO: pak oudste open entries t/m datum
    const rows = hourlyEligible.slice().sort((a, b) => new Date(a.occurred_on).getTime() - new Date(b.occurred_on).getTime());

    for (const e of rows) {
      if (remaining <= 0) break;
      const p = (e as any).projects || (e as any).project || projects.find((pp) => pp.id === e.project_id);
      if (!p) continue;
      const phaseRates = ((p as any).phase_rates_cents || {}) as Record<string, number>;
      const rate = (phaseRates[e.phase_code] ?? p.default_rate_cents ?? 0) / 100;
      const hours = entryHours(e);
      const lineAmount = hours * rate;

      if (lineAmount <= remaining + 1e-6) {
        // hele regel gefactureerd
        const { error } = await supabase
          .from("time_entries")
          .update({ invoiced_at: until, invoice_number: invoiceNumber || null })
          .eq("id", e.id);
        if (error) throw error;
        remaining -= lineAmount;
      } else {
        // splitsen: deel gefactureerd, rest open
        const invHours = Math.max(0, +(remaining / rate).toFixed(2));
        const restHours = Math.max(0, +(hours - invHours).toFixed(2));

        // 1) update bestaande entry naar restHours
        const { error: err1 } = await supabase
          .from("time_entries")
          .update({
            occurred_on: e.occurred_on,
            project_id: e.project_id,
            phase_code: e.phase_code,
            hours: restHours,
            notes: e.notes || "",
          })
          .eq("id", e.id);
        if (err1) throw err1;

        // 2) insert nieuwe entry voor gefactureerd deel
        const invNote = `[INV ${until}${invoiceNumber ? " #"+invoiceNumber : ""}]`;
        const { error: err2 } = await supabase
          .from("time_entries")
          .insert({
            occurred_on: e.occurred_on,
            project_id: e.project_id,
            phase_code: e.phase_code,
            hours: invHours,
            notes: e.notes ? `${e.notes} ${invNote}` : invNote,
            invoiced_at: until,
            invoice_number: invoiceNumber || null,
          });
        if (err2) throw err2;

        remaining = 0;
      }
    }

    await qc.invalidateQueries({ queryKey: ["time-entries"] });
    onClose();
  }

  async function markAllHourly() {
    const ids = hourlyEligible.map((e) => e.id);

    // Probeer RPC (als je script draaide), anders fallback naar update in 1 query
    const { error: rpcErr } = await supabase.rpc("invoice_time_entries", {
      p_entry_ids: ids,
      p_invoiced_at: until,
      p_invoice_number: invoiceNumber || null,
    });
    if (rpcErr) {
      // Fallback: maak 1 update-query (efficienter dan per id)
      const { error } = await supabase
        .from("time_entries")
        .update({ invoiced_at: until, invoice_number: invoiceNumber || null })
        .in("id", ids);
      if (error) throw error;
    }

    await qc.invalidateQueries({ queryKey: ["time-entries"] });
    onClose();
  }

  // ---------- VASTE FASES ----------
  const [fixedProjectId, setFixedProjectId] = React.useState<string>("");
  const fixedProject = React.useMemo(
    () => projects.find((p) => p.id === fixedProjectId) || null,
    [projects, fixedProjectId]
  );
  const [fixedInvoiceDate, setFixedInvoiceDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [fixedInvoiceNumber, setFixedInvoiceNumber] = React.useState<string>("");

  // per-fase deelbedrag
  const [partialByPhase, setPartialByPhase] = React.useState<Record<string, string>>({}); // € string
  const [markPhase, setMarkPhase] = React.useState<Set<string>>(new Set());

  async function saveFixed() {
    if (!fixedProject) return;

    // 1) Vinkjes "gefactureerd" opslaan
    if (markPhase.size) {
      const toMark = Array.from(markPhase);
      const { error } = await supabase
        .from("projects")
        .update({
          invoiced_phases: toMark,
          phase_invoice_meta: {
            invoice_date: fixedInvoiceDate,
            ...(fixedInvoiceNumber ? { invoice_number: fixedInvoiceNumber } : {}),
          },
        })
        .eq("id", fixedProject.id);
      if (error) throw error;
    }

    // 2) Deelbedragen als 0-uur notities per fase
    for (const [code, val] of Object.entries(partialByPhase)) {
      const euros = parseFloat(val || "0");
      if (!isFinite(euros) || euros <= 0) continue;
      const note = `[FIXED_INV PH=${code} €${euros.toFixed(2)} ${fixedInvoiceDate}${
        fixedInvoiceNumber ? " #"+fixedInvoiceNumber : ""
      }]`;
      const { error } = await supabase.from("time_entries").insert({
        occurred_on: fixedInvoiceDate,
        project_id: fixedProject.id,
        phase_code: code,
        hours: 0,
        notes: note,
      });
      if (error) throw error;
    }

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["projects"] }),
      qc.invalidateQueries({ queryKey: ["time-entries"] }),
    ]);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Factureren</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1.5 rounded ${tab === "hourly" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              onClick={() => setTab("hourly")}
            >
              Urenbasis
            </button>
            <button
              className={`px-3 py-1.5 rounded ${tab === "fixed" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              onClick={() => setTab("fixed")}
            >
              Fases (vast)
            </button>
          </div>

          {tab === "hourly" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Project (optioneel)</label>
                  <select
                    value={hourlyProjectId}
                    onChange={(e) => setHourlyProjectId(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Alle projecten</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">t/m datum *</label>
                  <input
                    type="date"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurnummer (optie)</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2025-001"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded text-sm">
                In aanmerking komend t/m datum: <strong>{EUR(totalEligibleAmount)}</strong>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurbedrag (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Bijv. 1.000,00"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmHourlyOnAmount}
                    disabled={!hourlyEligible.length || !amount}
                    className="flex-1 bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:bg-gray-300"
                  >
                    Bevestig (op bedrag)
                  </button>
                  <button
                    onClick={markAllHourly}
                    disabled={!hourlyEligible.length}
                    className="flex-1 bg-indigo-600 text-white rounded px-3 py-2 text-sm disabled:bg-gray-300"
                    title="Markeer alle niet-gefactureerde uren t/m de gekozen datum als gefactureerd"
                  >
                    Markeer alles t/m datum
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "fixed" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Project *</label>
                  <select
                    value={fixedProjectId}
                    onChange={(e) => setFixedProjectId(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Selecteer...</option>
                    {projects
                      .filter((p) => (p as any).phase_budgets && Object.keys((p as any).phase_budgets).length)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurdatum *</label>
                  <input
                    type="date"
                    value={fixedInvoiceDate}
                    onChange={(e) => setFixedInvoiceDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Factuurnummer (optie)</label>
                  <input
                    type="text"
                    value={fixedInvoiceNumber}
                    onChange={(e) => setFixedInvoiceNumber(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2025-002"
                  />
                </div>
              </div>

              {!fixedProject ? (
                <div className="text-sm text-gray-500">Selecteer eerst een project met vaste fasebudgetten.</div>
              ) : (
                <div className="space-y-2">
                  {phases
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((ph) => {
                      const budgets = ((fixedProject as any).phase_budgets || {}) as Record<string, number>;
                      const budget = budgets[ph.code] ? budgets[ph.code] / 100 : 0;
                      const checked = markPhase.has(ph.code);

                      return (
                        <div key={ph.code} className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setMarkPhase((prev) => {
                                  const n = new Set(prev);
                                  if (e.target.checked) n.add(ph.code);
                                  else n.delete(ph.code);
                                  return n;
                                });
                              }}
                            />
                            <span className="font-medium">{ph.name}</span>
                          </label>

                          <span className="text-xs text-gray-600">Budget: {budget ? EUR(budget) : "-"}</span>

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Deelbedrag (€)"
                            value={partialByPhase[ph.code] || ""}
                            onChange={(e) =>
                              setPartialByPhase((prev) => ({ ...prev, [ph.code]: e.target.value }))
                            }
                            className="ml-auto w-40 border rounded px-2 py-1 text-sm"
                          />
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 border rounded px-3 py-2">
                  Annuleren
                </button>
                <button
                  onClick={saveFixed}
                  disabled={!fixedProject}
                  className="flex-1 bg-blue-600 text-white rounded px-3 py-2 disabled:bg-gray-300"
                >
                  Opslaan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
