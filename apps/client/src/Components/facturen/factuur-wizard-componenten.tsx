import React, { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Modal, centsToMoney } from "./basis-componenten";
import { 
  useCreateInvoice, 
  useUnbilled,
  useProjects,
  ymd, 
  addDays 
} from "./hooks";
import { api } from "@/lib/api";
import type { InvoiceItem, TimeEntry } from "./types";

type Step = 1 | 2 | 3;

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
  manualMode: boolean;
  cutoff_date: string;
};

const today = ymd(new Date());

export function CreateInvoiceModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { data: unbilled, isLoading: loadingUnbilled } = useUnbilled();
  const { data: projects = [] } = useProjects();
  const createMutation = useCreateInvoice();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<CreateForm>({
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
    manualMode: false,
    cutoff_date: today,
  });

  // Auto-generate invoice number
  useEffect(() => {
    if (!form.invoice_number) {
      const n = `INV-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9000) + 1000
      )}`;
      setForm((f) => ({ ...f, invoice_number: n }));
    }
  }, [form.invoice_number]);

  // Filter unbilled op cutoff date
  const filteredUnbilled = useMemo(() => {
    if (!unbilled || !form.cutoff_date) return unbilled;
    
    return unbilled.map(project => {
      const filteredEntries = project.entries.filter(e => e.occurred_on <= form.cutoff_date);
      
      const totalHours = filteredEntries.reduce((sum, e) => 
        sum + ((e.minutes || 0) / 60), 0
      );
      
      const totalAmount = filteredEntries.reduce((sum, e) => {
        const hours = (e.minutes || 0) / 60;
        // ✅ FIX: Gebruik optional chaining en fallback
        const rate = e.projects?.default_rate_cents ?? e.project?.default_rate_cents ?? 0;
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

  const toggleProjectAll = (projectId: string, entryIds: string[]) => {
    const allSelected = entryIds.every((id) => 
      form.selectedEntryIds.includes(id)
    );
    
    if (allSelected) {
      setForm((f) => ({
        ...f,
        selectedEntryIds: f.selectedEntryIds.filter(
          (id) => !entryIds.includes(id)
        ),
        byProject: { ...f.byProject, [projectId]: false },
      }));
    } else {
      setForm((f) => ({
        ...f,
        selectedEntryIds: Array.from(
          new Set([...f.selectedEntryIds, ...entryIds])
        ),
        byProject: { ...f.byProject, [projectId]: true },
      }));
    }
  };

  // Build items from selected entries on Step 3
  useEffect(() => {
    if (step === 3 && form.items.length === 0 && !form.manualMode && filteredUnbilled) {
      const chosen: TimeEntry[] = [];
      
      filteredUnbilled.forEach((b) =>
        b.entries.forEach((e) => {
          if (form.selectedEntryIds.includes(e.id)) chosen.push(e);
        })
      );

      const items: InvoiceItem[] = chosen.map((e) => {
        const hours = (e.minutes || 0) / 60;
        const projectName = e.projects?.name ?? e.project?.name ?? "Project";
        
        return {
          description: `${projectName} – ${e.occurred_on}${
            e.notes ? ` – ${e.notes}` : ""
          }`,
          quantity: Number(hours.toFixed(2)),
          rate_cents: 7500,
          amount_cents: Math.round(7500 * hours),
        };
      });
      
      setForm((f) => ({ ...f, items }));
    }
    
    if (step === 3 && form.items.length === 0 && form.manualMode) {
      setForm((f) => ({
        ...f,
        items: [
          {
            description: "",
            quantity: 1,
            rate_cents: 7500,
            amount_cents: 7500,
          },
        ],
      }));
    }
  }, [step, form.selectedEntryIds, form.items.length, form.manualMode, filteredUnbilled]);

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
    if (!form.manualMode && !form.selectedEntryIds.length) {
      alert("Selecteer minimaal één uren-entry of schakel over naar handmatige modus.");
      return;
    }

    const payload = {
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date,
      due_date: form.due_date,
      notes: form.notes,
      vat_percent: form.vat_percent,
      items: form.items,
      time_entry_ids: form.manualMode ? [] : form.selectedEntryIds,
      status: sendImmediately ? "sent" : "draft",
      payment_terms: form.payment_terms,
      project_id: form.project_id,
    };

    const created = await createMutation.mutateAsync(payload);

    if (sendImmediately && created?.id) {
      await api(`/api/invoices/${created.id}/send`, { method: "POST" });
    }

    alert(
      sendImmediately 
        ? "Factuur aangemaakt en verzonden." 
        : "Conceptfactuur opgeslagen."
    );

    if (onCreated && created?.id) onCreated(created.id);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Nieuwe factuur" maxWidth="5xl">
      {/* Stepper */}
      <div className="flex items-center gap-2 px-4 py-3 text-sm border-b">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 grid place-items-center rounded-full border ${
                step === s 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-700"
              }`}
            >
              {s}
            </div>
            <span className={step === s ? "font-medium" : "text-gray-600"}>
              {s === 1 && (form.manualMode ? "Project kiezen" : "Uren selecteren")}
              {s === 2 && "Factuurdetails"}
              {s === 3 && "Review & Regels"}
            </span>
            {s < 3 && <div className="w-8 border-t" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-auto max-h-[60vh]">
        {/* Step 1 */}
        {step === 1 && (
          <div>
            {/* Cutoff date */}
            {!form.manualMode && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <label className="block">
                  <span className="text-sm font-medium text-blue-900 mb-2 block flex items-center gap-2">
                    📅 Factureer alle uren tot en met datum
                  </span>
                  <input
                    type="date"
                    value={form.cutoff_date}
                    onChange={(e) => {
                      setForm((f) => ({ 
                        ...f, 
                        cutoff_date: e.target.value,
                        selectedEntryIds: [],
                      }));
                    }}
                    className="border border-blue-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    Alleen ongefactureerde uren tot en met deze datum worden getoond
                  </p>
                </label>
              </div>
            )}

            {/* Manual mode toggle */}
            <div className="mb-6 p-4 border-2 border-dashed rounded-xl bg-gray-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.manualMode}
                  onChange={(e) => {
                    const manual = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      manualMode: manual,
                      selectedEntryIds: manual ? [] : f.selectedEntryIds,
                    }));
                  }}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Handmatige factuur aanmaken</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Gebruik deze optie om bestaande facturen in te voeren of facturen zonder gekoppelde uren aan te maken.
                  </div>
                </div>
              </label>
            </div>

            {form.manualMode ? (
              /* Manual mode UI */
              <div className="py-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-gray-600">
                    Je maakt een handmatige factuur. Selecteer optioneel een project en ga naar de volgende stap.
                  </div>
                  
                  <label className="block">
                    <div className="text-sm font-medium text-gray-700 mb-2 text-left">
                      Project (optioneel)
                    </div>
                    <select
                      className="w-full border rounded-xl px-3 py-2"
                      value={form.project_id || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, project_id: e.target.value || undefined }))
                      }
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
            ) : (
              /* Normale unbilled hours selectie */
              <>
                {loadingUnbilled ? (
                  <div className="py-12 flex justify-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Unbilled uren laden…
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
                      const allSelected = entryIds.every((id) =>
                        form.selectedEntryIds.includes(id)
                      );

                      return (
                        <div key={b.project_id} className="border rounded-xl">
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <div className="font-medium">
                                {b.project_name}{" "}
                                <span className="text-gray-500">
                                  – {b.client_name}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {b.total_hours.toFixed(2)} uur •{" "}
                                {centsToMoney(b.total_amount_cents)}
                              </div>
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() =>
                                  toggleProjectAll(b.project_id, entryIds)
                                }
                              />
                              Alles van dit project
                            </label>
                          </div>

                          <div className="border-t divide-y max-h-60 overflow-auto">
                            {b.entries.map((e) => {
                              const checked = form.selectedEntryIds.includes(e.id);
                              const hours = (e.minutes || 0) / 60;

                              return (
                                <label
                                  key={e.id}
                                  className="flex items-center gap-3 p-3 hover:bg-gray-50 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setForm((f) => ({
                                        ...f,
                                        selectedEntryIds: checked
                                          ? f.selectedEntryIds.filter(
                                              (id) => id !== e.id
                                            )
                                          : [...f.selectedEntryIds, e.id],
                                        project_id: f.project_id ?? e.project_id,
                                      }))
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {e.occurred_on} • {hours.toFixed(2)} u
                                    </div>
                                    <div className="text-gray-600">
                                      {e.notes || "–"} • {e.phase_code}
                                    </div>
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

        {/* Step 2: Invoice details */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600">Factuurnummer</span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.invoice_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, invoice_number: e.target.value }))
                  }
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
                    const due = ymd(
                      addDays(
                        new Date(inv + "T00:00:00"),
                        Number(form.payment_terms)
                      )
                    );
                    setForm((f) => ({ 
                      ...f, 
                      invoice_date: inv, 
                      due_date: due 
                    }));
                  }}
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Vervaldatum</span>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600">
                  Betaalvoorwaarden
                </span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={form.payment_terms}
                  onChange={(e) => {
                    const terms = e.target.value as CreateForm["payment_terms"];
                    const due = ymd(
                      addDays(
                        new Date(form.invoice_date + "T00:00:00"),
                        Number(terms)
                      )
                    );
                    setForm((f) => ({ 
                      ...f, 
                      payment_terms: terms, 
                      due_date: due 
                    }));
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
                  onChange={(e) =>
                    setForm((f) => ({ 
                      ...f, 
                      vat_percent: Number(e.target.value) 
                    }))
                  }
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Notities</span>
                <textarea
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Review & line items */}
        {step === 3 && (
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
                              items[idx] = { 
                                ...items[idx], 
                                description: e.target.value 
                              };
                              return { ...f, items };
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.25"
                          className="w-28 border rounded-lg px-2 py-1 text-right"
                          value={it.quantity}
                          onChange={(e) => {
                            const quantity = Number(e.target.value);
                            setForm((f) => {
                              const items = [...f.items];
                              const rate = items[idx].rate_cents;
                              items[idx] = {
                                ...items[idx],
                                quantity,
                                amount_cents: Math.round(rate * quantity),
                              };
                              return { ...f, items };
                            });
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="1"
                          className="w-28 border rounded-lg px-2 py-1 text-right"
                          value={(it.rate_cents / 100).toFixed(2)}
                          onChange={(e) => {
                            const rate = Math.round(
                              Number(e.target.value) * 100
                            );
                            setForm((f) => {
                              const items = [...f.items];
                              const qty = items[idx].quantity;
                              items[idx] = {
                                ...items[idx],
                                rate_cents: rate,
                                amount_cents: Math.round(rate * qty),
                              };
                              return { ...f, items };
                            });
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {centsToMoney(it.amount_cents)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              items: f.items.filter((_, i) => i !== idx),
                            }))
                          }
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
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            items: [
                              ...f.items,
                              {
                                description: "",
                                quantity: 1,
                                rate_cents: 7500,
                                amount_cents: 7500,
                              },
                            ],
                          }))
                        }
                      >
                        <Plus className="h-4 h-4" /> Regel toevoegen
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">
                      Subtotaal
                    </td>
                    <td className="px-3 py-2 text-right">
                      {centsToMoney(subtotalCents)}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">
                      BTW {form.vat_percent}%
                    </td>
                    <td className="px-3 py-2 text-right">
                      {centsToMoney(vatCents)}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                      Totaal
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {centsToMoney(totalCents)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="text-sm text-gray-600">Stap {step} van 3</div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              Terug
            </button>
          )}
          {step < 3 && (
            <button
              className="px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 && !form.manualMode && !form.selectedEntryIds.length}
            >
              Volgende
            </button>
          )}
          {step === 3 && (
            <>
              <button
                className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                onClick={() => onSave(false)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending 
                  ? "Opslaan…" 
                  : "Opslaan als concept"}
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
                onClick={() => onSave(true)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending 
                  ? "Versturen…" 
                  : "Opslaan & versturen"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}