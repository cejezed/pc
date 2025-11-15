import React, { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Modal, centsToMoney } from "./basis-componenten";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useUnbilled,
  useProjects,
  ymd,
  addDays
} from "./hooks";
import { supabase } from "@/supabase";
import type { InvoiceItem, TimeEntry, Invoice } from "./types";

type Step = 1 | 2 | 3;
type Mode = "normal" | "manual" | "historic";

type CreateForm = {
  selectedEntryIds: string[];
  byProject: Record<string, boolean>;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: "14" | "30" | "60";
  vat_percent: number;
  notes?: string;
  project_id?: string;
  items: InvoiceItem[];
  mode: Mode;
  cutoff_date: string;
};

const today = ymd(new Date());

export function CreateInvoiceModalV2({  
  open,
  onClose,
  onCreated,
  defaultMode,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultMode?: Mode;
}) {
  const { data: unbilled, isLoading: loadingUnbilled, refetch: refetchUnbilled } = useUnbilled();
  const { data: projects = [] } = useProjects();
  const createMutation = useCreateInvoice();

  const makeInitialForm = (mode: Mode): CreateForm => ({
    selectedEntryIds: [],
    byProject: {},
    invoice_number: "",
    invoice_date: today,
    due_date: ymd(addDays(new Date(), 30)),
    payment_terms: "30",
    vat_percent: 21,
    notes: "",
    project_id: undefined,
    items: [],
    mode,
    cutoff_date: today,
  });

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<CreateForm>(makeInitialForm(defaultMode ?? "normal"));

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(makeInitialForm(defaultMode ?? "normal"));
    }
  }, [open, defaultMode]);

  useEffect(() => {
    if (!form.invoice_number) {
      const n = `INV-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9000) + 1000
      )}`;
      setForm((f) => ({ ...f, invoice_number: n }));
    }
  }, [form.invoice_number]);

  const filteredUnbilled = useMemo(() => {
    if (!unbilled || !form.cutoff_date) return unbilled;
    
    return unbilled.map(project => {
      const filteredEntries = project.entries.filter(e => e.occurred_on <= form.cutoff_date);
      const totalHours = filteredEntries.reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
      const totalAmount = filteredEntries.reduce((sum, e) => {
        const hours = (e.minutes || 0) / 60;
        const rate = e.projects?.default_rate_cents ?? 0;
        return sum + Math.round(hours * rate);
      }, 0);

      return {
        ...project,
        entries: filteredEntries,
        total_hours: totalHours,
        total_amount_cents: totalAmount,
      };
    }).filter(p => p.entries.length > 0);
  }, [unbilled, form.cutoff_date]);

  const historicEntries = useMemo(() => {
    if (form.mode !== "historic" || !form.project_id) return [];
    const project = filteredUnbilled?.find(p => p.project_id === form.project_id);
    return project?.entries || [];
  }, [form.mode, form.project_id, filteredUnbilled]);

  const historicTotal = useMemo(() => {
    return historicEntries.reduce((sum, e) => {
      const hours = (e.minutes || 0) / 60;
      const rate = e.projects?.default_rate_cents ?? 0;
      return sum + Math.round(hours * rate);
    }, 0);
  }, [historicEntries]);

  const toggleProjectAll = (projectId: string, entryIds: string[]) => {
    const allSelected = entryIds.every((id) => form.selectedEntryIds.includes(id));
    
    if (allSelected) {
      setForm((f) => ({
        ...f,
        selectedEntryIds: f.selectedEntryIds.filter((id) => !entryIds.includes(id)),
        byProject: { ...f.byProject, [projectId]: false },
      }));
    } else {
      setForm((f) => ({
        ...f,
        selectedEntryIds: Array.from(new Set([...f.selectedEntryIds, ...entryIds])),
        byProject: { ...f.byProject, [projectId]: true },
      }));
    }
  };

  // Helper function to get correct rate for an entry
  const getEntryRate = (entry: TimeEntry): number => {
    // Try phase-specific rate first
    const phaseRates = (entry.projects as any)?.phase_rates_cents || {};
    const phaseRate = phaseRates[entry.phase_code];
    if (phaseRate !== undefined && phaseRate !== null) {
      return phaseRate;
    }
    // Fall back to project default rate
    const defaultRate = entry.projects?.default_rate_cents;
    if (defaultRate !== undefined && defaultRate !== null) {
      return defaultRate;
    }
    // Ultimate fallback
    return 7500;
  };

  useEffect(() => {
    if (step === 3 && form.items.length === 0 && form.mode === "normal" && filteredUnbilled) {
      const chosen: TimeEntry[] = [];
      filteredUnbilled.forEach((b) =>
        b.entries.forEach((e) => {
          if (form.selectedEntryIds.includes(e.id)) chosen.push(e);
        })
      );

      const items: InvoiceItem[] = chosen.map((e) => {
        const hours = (e.minutes || 0) / 60;
        const projectName = e.projects?.name ?? "Project";
        const rateCents = getEntryRate(e);
        return {
          description: `${projectName} — ${e.occurred_on}${e.notes ? ` — ${e.notes}` : ""}`,
          quantity: Number(hours.toFixed(2)),
          rate_cents: rateCents,
          amount_cents: Math.round(rateCents * hours),
        };
      });
      setForm((f) => ({ ...f, items }));
    }

    if (step === 3 && form.items.length === 0 && form.mode === "manual") {
      // For manual invoices, use project's default rate if available
      const project = projects.find(p => p.id === form.project_id);
      const defaultRate = project?.default_rate_cents || 7500;
      setForm((f) => ({
        ...f,
        items: [{ description: "", quantity: 1, rate_cents: defaultRate, amount_cents: defaultRate }],
      }));
    }
  }, [step, form.selectedEntryIds, form.items.length, form.mode, filteredUnbilled, form.project_id, projects]);

  const subtotalCents = useMemo(
    () => form.items.reduce((acc, it) => acc + (it.amount_cents || 0), 0),
    [form.items]
  );

  const vatCents = useMemo(
    () => Math.round(subtotalCents * (form.vat_percent / 100)),
    [subtotalCents, form.vat_percent]
  );

  const totalCents = subtotalCents + vatCents;

  const onSave = async (sendImmediately = false) => {
    if (form.mode === "normal" && !form.selectedEntryIds.length) {
      alert("Selecteer minimaal één uren-entry of kies een andere modus.");
      return;
    }

    const payload = {
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date,
      due_date: form.due_date,
      notes: form.notes,
      vat_percent: form.vat_percent,
      items: form.items,
      time_entry_ids: form.mode === "manual" ? [] : form.selectedEntryIds,
      status: sendImmediately ? "sent" : "draft",
      payment_terms: form.payment_terms,
      project_id: form.project_id,
    };

    const created = await createMutation.mutateAsync(payload);

    alert(sendImmediately ? "Factuur aangemaakt en verzonden." : "Conceptfactuur opgeslagen.");

    if (onCreated && created?.id) onCreated(created.id);
    onClose();
  };

  const onMarkHistoric = async () => {
    if (!form.project_id || !historicEntries.length) {
      alert("Selecteer een project met ongefactureerde uren");
      return;
    }

    const ids = historicEntries.map(e => e.id);
    const confirmMsg = `${ids.length} uren markeren als gefactureerd (${centsToMoney(historicTotal)})?`;

    if (!confirm(confirmMsg)) return;

    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('facturen')
        .insert({
          invoice_number: form.invoice_number || `HIST-${Date.now()}`,
          project_id: form.project_id,
          invoice_date: form.invoice_date,
          due_date: form.invoice_date,
          amount_cents: historicTotal,
          status: 'paid',
          notes: `Historische factuur - ${ids.length} uren geregistreerd`,
          vat_percent: form.vat_percent,
          payment_terms: '0',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items for historic invoice
      const items = historicEntries.map((e) => {
        const hours = (e.minutes || 0) / 60;
        const projectName = e.projects?.name ?? "Project";
        const rateCents = getEntryRate(e);
        return {
          factuur_id: invoice.id,
          description: `${projectName} — ${e.occurred_on}${e.notes ? ` — ${e.notes}` : ""}`,
          quantity: Number(hours.toFixed(2)),
          rate_cents: rateCents,
          amount_cents: Math.round(rateCents * hours),
        };
      });

      const { error: itemsError } = await supabase
        .from('factuur_items')
        .insert(items);

      if (itemsError) throw itemsError;

      const { error: timeError } = await supabase
        .from("time_entries")
        .update({
          invoiced_at: form.invoice_date,
          invoice_number: form.invoice_number || invoice.invoice_number
        })
        .in("id", ids);

      if (timeError) throw timeError;

      alert(`Factuur ${invoice.invoice_number} geregistreerd met ${ids.length} uren`);
      await refetchUnbilled();

      if (onCreated && invoice?.id) onCreated(invoice.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Er ging iets mis bij het registreren");
    }
  };

  if (!open) return null;

  const stepLabel = form.mode === "historic" 
    ? "Historische factuur registreren"
    : form.mode === "manual" 
    ? "Handmatige factuur"
    : "Nieuwe factuur";

  return (
    <Modal open={open} onClose={onClose} title={stepLabel} maxWidth="5xl">
      {form.mode !== "historic" && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm border-b">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-7 w-7 grid place-items-center rounded-full border ${
                step === s ? "bg-black text-white border-black" : "bg-white text-gray-700"
              }`}>
                {s}
              </div>
              <span className={step === s ? "font-medium" : "text-gray-600"}>
                {s === 1 && (form.mode === "manual" ? "Project kiezen" : "Uren selecteren")}
                {s === 2 && "Factuurdetails"}
                {s === 3 && "Review & Regels"}
              </span>
              {s < 3 && <div className="w-8 border-t" />}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 overflow-auto max-h-[60vh]">
        {step === 1 && (
          <div>
            <div className="mb-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, mode: "normal", selectedEntryIds: [], project_id: undefined }))}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  form.mode === "normal" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium mb-1">Nieuwe factuur</div>
                <div className="text-sm text-gray-600">Selecteer ongefactureerde uren en maak PDF</div>
              </button>

              <button
                onClick={() => setForm(f => ({ ...f, mode: "manual", selectedEntryIds: [], project_id: undefined }))}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  form.mode === "manual" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium mb-1">Handmatig</div>
                <div className="text-sm text-gray-600">Factuur zonder gekoppelde uren</div>
              </button>

              <button
                onClick={() => setForm(f => ({ ...f, mode: "historic", selectedEntryIds: [], project_id: undefined }))}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  form.mode === "historic" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium mb-1">Historisch</div>
                <div className="text-sm text-gray-600">Markeer oude factuur zonder PDF</div>
              </button>
            </div>

            {form.mode === "historic" && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800 space-y-2">
                      <p><strong>Historische factuur registreren</strong></p>
                      <p>
                        Gebruik dit voor facturen die al zijn verstuurd maar nog niet geregistreerd in het systeem.
                        Alle ongefactureerde uren tot de gekozen datum worden gemarkeerd, maar er wordt <strong>geen PDF</strong> aangemaakt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                    <select
                      value={form.project_id || ""}
                      onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value || undefined }))}
                      className="w-full border rounded-xl px-3 py-2"
                    >
                      <option value="">Selecteer project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.client_name ? `(${p.client_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Markeer uren tot en met datum *
                      </label>
                      <input
                        type="date"
                        value={form.cutoff_date}
                        onChange={(e) => setForm((f) => ({ ...f, cutoff_date: e.target.value }))}
                        className="w-full border rounded-xl px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Alle ongefactureerde uren tot deze datum worden gemarkeerd
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Factuurdatum (registratie)
                      </label>
                      <input
                        type="date"
                        value={form.invoice_date}
                        onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))}
                        className="w-full border rounded-xl px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optioneel: wanneer was de factuur verstuurd?
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Factuurnummer (optioneel)</label>
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                    placeholder="bijv. 2024-087"
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>

                {form.project_id && (
                  <div className="bg-gray-50 border rounded-xl p-4">
                    <h4 className="font-medium mb-3">Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Ongefactureerde uren tot {new Date(form.cutoff_date).toLocaleDateString('nl-NL')}:
                        </span>
                        <strong>{historicEntries.length} entries</strong>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Totaal bedrag:</span>
                        <strong className="text-lg">{centsToMoney(historicTotal)}</strong>
                      </div>
                    </div>

                    {historicEntries.length === 0 && (
                      <div className="mt-3 text-sm text-orange-600 bg-orange-50 rounded p-2">
                        Geen ongefactureerde uren gevonden voor dit project tot deze datum
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {form.mode === "manual" && (
              <div className="py-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-gray-600">
                    Je maakt een handmatige factuur. Selecteer optioneel een project en ga naar de volgende stap.
                  </div>
                  <label className="block">
                    <div className="text-sm font-medium text-gray-700 mb-2 text-left">Project (optioneel)</div>
                    <select
                      className="w-full border rounded-xl px-3 py-2"
                      value={form.project_id || ""}
                      onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value || undefined }))}
                    >
                      <option value="">-- Geen project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.client_name ? `(${p.client_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {form.mode === "normal" && (
              <>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="block">
                    <span className="text-sm font-medium text-blue-900 mb-2 block flex items-center gap-2">
                      Factureer alle uren tot en met datum
                    </span>
                    <input
                      type="date"
                      value={form.cutoff_date}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, cutoff_date: e.target.value, selectedEntryIds: [] }));
                      }}
                      className="border border-blue-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                    />
                    <p className="text-xs text-blue-700 mt-2">
                      Alleen ongefactureerde uren tot en met deze datum worden getoond
                    </p>
                  </label>
                </div>

                {loadingUnbilled ? (
                  <div className="py-12 flex justify-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Unbilled uren laden
                  </div>
                ) : !filteredUnbilled?.length ? (
                  <div className="py-8 text-center text-gray-600">
                    <p className="mb-2">Geen ongefactureerde uren gevonden tot en met {form.cutoff_date}.</p>
                    <button
                      onClick={() => setForm(f => ({ ...f, cutoff_date: today }))}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Datum wijzigen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUnbilled.map((b) => {
                      const entryIds = b.entries.map((e) => e.id);
                      const allSelected = entryIds.every((id) => form.selectedEntryIds.includes(id));

                      return (
                        <div key={b.project_id} className="border rounded-xl">
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <div className="font-medium">
                                {b.project_name} <span className="text-gray-500">{b.client_name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {b.total_hours.toFixed(2)} uur {centsToMoney(b.total_amount_cents)}
                              </div>
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => toggleProjectAll(b.project_id, entryIds)}
                              />
                              Alles van dit project
                            </label>
                          </div>

                          <div className="border-t divide-y max-h-60 overflow-auto">
                            {b.entries.map((e) => {
                              const checked = form.selectedEntryIds.includes(e.id);
                              const hours = (e.minutes || 0) / 60;

                              return (
                                <label key={e.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setForm((f) => ({
                                        ...f,
                                        selectedEntryIds: checked
                                          ? f.selectedEntryIds.filter((id) => id !== e.id)
                                          : [...f.selectedEntryIds, e.id],
                                        project_id: f.project_id ?? e.project_id,
                                      }))
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{e.occurred_on} {hours.toFixed(2)} u</div>
                                    <div className="text-gray-600">{e.notes || "—"} {e.phase_code}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && form.mode !== "historic" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600">Factuurnummer</span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Factuurdatum</span>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.invoice_date}
                  onChange={(e) => {
                    const inv = e.target.value;
                    const due = ymd(addDays(new Date(inv + "T00:00:00"), Number(form.payment_terms)));
                    setForm((f) => ({ ...f, invoice_date: inv, due_date: due }));
                  }}
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Vervaldatum</span>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </label>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600">Betaalvoorwaarden</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.payment_terms}
                  onChange={(e) => {
                    const terms = e.target.value as CreateForm["payment_terms"];
                    const due = ymd(addDays(new Date(form.invoice_date + "T00:00:00"), Number(terms)));
                    setForm((f) => ({ ...f, payment_terms: terms, due_date: due }));
                  }}
                >
                  <option value="14">14 dagen</option>
                  <option value="30">30 dagen</option>
                  <option value="60">60 dagen</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">BTW %</span>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.vat_percent}
                  onChange={(e) => setForm((f) => ({ ...f, vat_percent: Number(e.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Notities</span>
                <textarea
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && form.mode !== "historic" && (
          <div className="space-y-4">
            <div className="overflow-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Omschrijving</th>
                    <th className="text-right px-3 py-2">Aantal (uur)</th>
                    <th className="text-right px-3 py-2">Tarief</th>
                    <th className="text-right px-3 py-2">Bedrag</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {form.items.map((it, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="px-3 py-2">
                        <textarea
                          className="w-full border rounded-lg px-2 py-1"
                          rows={2}
                          value={it.description}
                          onChange={(e) =>
                            setForm((f) => {
                              const items = [...f.items];
                              items[idx] = { ...items[idx], description: e.target.value };
                              return { ...f, items };
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                          title="Regel verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} className="px-3 py-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
                        onClick={() => {
                          const project = projects.find(p => p.id === form.project_id);
                          const defaultRate = project?.default_rate_cents || 7500;
                          setForm((f) => ({
                            ...f,
                            items: [...f.items, { description: "", quantity: 1, rate_cents: defaultRate, amount_cents: defaultRate }],
                          }));
                        }}
                      >
                        <Plus className="h-4 w-4" /> Regel toevoegen
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">Subtotaal</td>
                    <td className="px-3 py-2 text-right">{centsToMoney(subtotalCents)}</td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">BTW {form.vat_percent}%</td>
                    <td className="px-3 py-2 text-right">{centsToMoney(vatCents)}</td>
                    <td />
                  </tr>
                  <tr className="font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right">Totaal</td>
                    <td className="px-3 py-2 text-right">{centsToMoney(totalCents)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3 flex justify-between">
        {form.mode === "historic" ? (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={onMarkHistoric}
              disabled={!form.project_id || !historicEntries.length}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Markeer {historicEntries.length} uren als gefactureerd
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                if (step > 1) setStep((s) => (s - 1) as Step);
                else onClose();
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {step === 1 ? "Annuleren" : "Terug"}
            </button>

            <div className="flex gap-2">
              {step === 3 && (
                <>
                  <button
                    onClick={() => onSave(false)}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Opslaan..." : "Opslaan als concept"}
                  </button>
                  <button
                    onClick={() => onSave(true)}
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Versturen..." : "Opslaan & Versturen"}
                  </button>
                </>
              )}

              {step < 3 && (
                <button
                  onClick={() => {
                    if (form.mode === "manual" && step === 1) {
                      setStep(2);
                    } else if (step === 1 && !form.selectedEntryIds.length && form.mode === "normal") {
                      alert("Selecteer minimaal één uren-entry");
                    } else {
                      setStep((s) => (s + 1) as Step);
                    }
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90"
                >
                  Volgende
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function EditInvoiceModal({
  invoice,
  onClose,
  onUpdated,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdated?: (id: string) => void;
}) {
  const updateMutation = useUpdateInvoice();
  const { data: projects = [] } = useProjects();
  
  const [form, setForm] = useState<{
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    payment_terms: "14" | "30" | "60";
    vat_percent: number;
    notes?: string;
    project_id?: string;
    items: InvoiceItem[];
    status: string;
  } | null>(null);

  useEffect(() => {
    if (invoice) {
      setForm({
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms as "14" | "30" | "60",
        vat_percent: invoice.vat_percent,
        notes: invoice.notes,
        project_id: invoice.project_id,
        items: invoice.items || [],
        status: invoice.status,
      });
    }
  }, [invoice]);

  const subtotalCents = useMemo(
    () => form?.items.reduce((acc, it) => acc + (it.amount_cents || 0), 0) || 0,
    [form?.items]
  );

  const vatCents = useMemo(
    () => Math.round(subtotalCents * ((form?.vat_percent || 0) / 100)),
    [subtotalCents, form?.vat_percent]
  );

  const totalCents = subtotalCents + vatCents;

  const onSave = async () => {
    if (!form || !invoice) return;

    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        payload: form,
      });

      alert("Factuur bijgewerkt");

      if (onUpdated) onUpdated(invoice.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Er ging iets mis bij het bijwerken");
    }
  };

  if (!invoice || !form) return null;

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Factuur ${invoice.invoice_number} bewerken`} maxWidth="4xl">
      <div className="p-4 overflow-auto max-h-[70vh] space-y-6">
        {/* Invoice Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600">Factuurnummer</span>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.invoice_number}
                onChange={(e) => setForm((f) => f ? ({ ...f, invoice_number: e.target.value }) : null)}
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Factuurdatum</span>
              <input
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.invoice_date}
                onChange={(e) => {
                  const inv = e.target.value;
                  const due = ymd(addDays(new Date(inv + "T00:00:00"), Number(form.payment_terms)));
                  setForm((f) => f ? ({ ...f, invoice_date: inv, due_date: due }) : null);
                }}
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Vervaldatum</span>
              <input
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.due_date}
                onChange={(e) => setForm((f) => f ? ({ ...f, due_date: e.target.value }) : null)}
              />
            </label>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600">Betaalvoorwaarden</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.payment_terms}
                onChange={(e) => {
                  const terms = e.target.value as typeof form.payment_terms;
                  const due = ymd(addDays(new Date(form.invoice_date + "T00:00:00"), Number(terms)));
                  setForm((f) => f ? ({ ...f, payment_terms: terms, due_date: due }) : null);
                }}
              >
                <option value="14">14 dagen</option>
                <option value="30">30 dagen</option>
                <option value="60">60 dagen</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">BTW %</span>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={form.vat_percent}
                onChange={(e) => setForm((f) => f ? ({ ...f, vat_percent: Number(e.target.value) }) : null)}
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Notities</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-3 py-2"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => f ? ({ ...f, notes: e.target.value }) : null)}
              />
            </label>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <h3 className="font-medium">Factuurregels</h3>
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Omschrijving</th>
                  <th className="text-right px-3 py-2">Aantal (uur)</th>
                  <th className="text-right px-3 py-2">Tarief</th>
                  <th className="text-right px-3 py-2">Bedrag</th>
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {form.items.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="px-3 py-2">
                      <textarea
                        className="w-full border rounded-lg px-2 py-1"
                        rows={2}
                        value={it.description}
                        onChange={(e) =>
                          setForm((f) => {
                            if (!f) return null;
                            const items = [...f.items];
                            items[idx] = { ...items[idx], description: e.target.value };
                            return { ...f, items };
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 border rounded px-2 py-1 text-right"
                        value={it.quantity}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          setForm((f) => {
                            if (!f) return null;
                            const items = [...f.items];
                            items[idx] = {
                              ...items[idx],
                              quantity: qty,
                              amount_cents: Math.round(qty * items[idx].rate_cents)
                            };
                            return { ...f, items };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="100"
                        className="w-24 border rounded px-2 py-1 text-right"
                        value={it.rate_cents / 100}
                        onChange={(e) => {
                          const rate = Number(e.target.value) * 100;
                          setForm((f) => {
                            if (!f) return null;
                            const items = [...f.items];
                            items[idx] = {
                              ...items[idx],
                              rate_cents: rate,
                              amount_cents: Math.round(items[idx].quantity * rate)
                            };
                            return { ...f, items };
                          });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {centsToMoney(it.amount_cents)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => setForm((f) => f ? ({ ...f, items: f.items.filter((_, i) => i !== idx) }) : null)}
                        title="Regel verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="px-3 py-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
                      onClick={() => {
                        const project = projects.find(p => p.id === form.project_id);
                        const defaultRate = project?.default_rate_cents || 7500;
                        setForm((f) => f ? ({
                          ...f,
                          items: [...f.items, { description: "", quantity: 1, rate_cents: defaultRate, amount_cents: defaultRate }],
                        }) : null);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Regel toevoegen
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right font-medium">Subtotaal</td>
                  <td className="px-3 py-2 text-right">{centsToMoney(subtotalCents)}</td>
                  <td />
                </tr>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right font-medium">BTW {form.vat_percent}%</td>
                  <td className="px-3 py-2 text-right">{centsToMoney(vatCents)}</td>
                  <td />
                </tr>
                <tr className="font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">Totaal</td>
                  <td className="px-3 py-2 text-right">{centsToMoney(totalCents)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t px-4 py-3 flex justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          onClick={onSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Opslaan..." : "Wijzigingen opslaan"}
        </button>
      </div>
    </Modal>
  );
}
