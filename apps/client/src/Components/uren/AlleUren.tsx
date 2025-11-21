import React, { useState, useMemo } from "react";
import { Trash2, ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import { useDeleteTimeEntry, useUnmarkTimeEntry } from "./hooks";
import { EUR } from "./utils";
import type { TimeEntry } from "./types";

interface Props {
  timeEntries: TimeEntry[];
}

type SortField = "date" | "project" | "phase" | "hours";
type SortDirection = "asc" | "desc";

export default function AlleUren({ timeEntries }: Props) {
  const deleteEntry = useDeleteTimeEntry();
  const unmarkEntry = useUnmarkTimeEntry();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterInvoiced, setFilterInvoiced] = useState<"all" | "billed" | "unbilled">("all");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = timeEntries;

    // Filter op facturatie status
    if (filterInvoiced === "billed") {
      filtered = filtered.filter(e => e.invoiced_at != null);
    } else if (filterInvoiced === "unbilled") {
      filtered = filtered.filter(e => e.invoiced_at == null);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.occurred_on).getTime() - new Date(b.occurred_on).getTime();
          break;
        case "project":
          const projectA = (a.projects || a.project)?.name || "";
          const projectB = (b.projects || b.project)?.name || "";
          comparison = projectA.localeCompare(projectB);
          break;
        case "phase":
          const phaseA = (a.phases || a.phase)?.name || a.phase_code;
          const phaseB = (b.phases || b.phase)?.name || b.phase_code;
          comparison = phaseA.localeCompare(phaseB);
          break;
        case "hours":
          const hoursA = a.minutes ? a.minutes / 60 : a.hours || 0;
          const hoursB = b.minutes ? b.minutes / 60 : b.hours || 0;
          comparison = hoursA - hoursB;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [timeEntries, sortField, sortDirection, filterInvoiced]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-primary)] transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-4 h-4 ${sortField === field ? 'text-[var(--zeus-primary)]' : 'text-[var(--zeus-text-secondary)]/50'}`} />
    </button>
  );

  const stats = useMemo(() => {
    const total = timeEntries.length;
    const billed = timeEntries.filter(e => e.invoiced_at != null).length;
    const unbilled = total - billed;
    return { total, billed, unbilled };
  }, [timeEntries]);

  return (
    <div className="zeus-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--zeus-text)]">Alle uren ({stats.total})</h2>
            <p className="text-sm text-[var(--zeus-text-secondary)] mt-1">
              {stats.unbilled} ongefactureerd • {stats.billed} gefactureerd
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterInvoiced("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterInvoiced === "all"
                ? "bg-[var(--zeus-primary)] text-white"
                : "bg-[var(--zeus-card)] border border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]"
                }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilterInvoiced("unbilled")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterInvoiced === "unbilled"
                ? "bg-orange-500 text-white"
                : "bg-[var(--zeus-card)] border border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]"
                }`}
            >
              Ongefactureerd ({stats.unbilled})
            </button>
            <button
              onClick={() => setFilterInvoiced("billed")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterInvoiced === "billed"
                ? "bg-green-500 text-white"
                : "bg-[var(--zeus-card)] border border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]"
                }`}
            >
              Gefactureerd ({stats.billed})
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--zeus-bg-secondary)] border-b border-[var(--zeus-border)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                <SortButton field="date">Datum</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                <SortButton field="project">Project</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                <SortButton field="phase">Fase</SortButton>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                <SortButton field="hours">Uren</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                Omschrijving
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                Bedrag
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-[var(--zeus-text-secondary)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-[var(--zeus-card-hover)] divide-y divide-[var(--zeus-border)]">
            {filteredAndSortedEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[var(--zeus-text-secondary)]">
                  Geen uren gevonden
                </td>
              </tr>
            ) : (
              filteredAndSortedEntries.map(entry => {
                const project = entry.projects || entry.project;
                const phase = entry.phases || entry.phase;
                const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                const phaseRates = (project as any)?.phase_rates_cents || {};
                const rate = (phaseRates[entry.phase_code] ?? project?.default_rate_cents ?? 0) / 100;
                const amount = hours * rate;
                const isBilled = !!entry.invoiced_at;

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${isBilled ? 'bg-green-900/10 hover:bg-green-900/20' : 'hover:bg-[var(--zeus-card)]'
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--zeus-text)]">
                      {new Date(entry.occurred_on).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--zeus-text)]">
                      {project?.name || "Onbekend"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--zeus-text-secondary)]">
                      {phase?.name || entry.phase_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[var(--zeus-text)]">
                      {hours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--zeus-text-secondary)]">
                      {entry.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[var(--zeus-text)]">
                      {EUR(amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isBilled ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Gefactureerd
                          </div>
                          {entry.invoice_number && (
                            <div className="text-xs text-[var(--zeus-text-secondary)]">
                              {entry.invoice_number}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--zeus-text-secondary)]/50 text-xs">Open</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {!isBilled ? (
                        <button
                          onClick={() => {
                            if (confirm("Weet je zeker dat je deze entry wilt verwijderen?")) {
                              deleteEntry.mutate(entry.id);
                            }
                          }}
                          className="text-[var(--zeus-text-secondary)] hover:text-red-400 transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm("Weet je zeker dat je deze uren wilt ontmarkeren als gefactureerd?")) {
                              unmarkEntry.mutate(entry.id);
                            }
                          }}
                          className="text-[var(--zeus-text-secondary)] hover:text-orange-400 transition-colors"
                          title="Ontmarkeren als gefactureerd"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}