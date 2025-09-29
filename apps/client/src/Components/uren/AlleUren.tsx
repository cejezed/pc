import React, { useState, useMemo } from "react";
import { Trash2, ArrowUpDown } from "lucide-react";
import { useDeleteTimeEntry } from "./hooks";
import { EUR } from "./utils";
import type { TimeEntry } from "./types";

interface Props {
  timeEntries: TimeEntry[];
}

type SortField = "date" | "project" | "phase" | "hours";
type SortDirection = "asc" | "desc";

export default function AlleUren({ timeEntries }: Props) {
  const deleteEntry = useDeleteTimeEntry();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedEntries = useMemo(() => {
    return [...timeEntries].sort((a, b) => {
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
  }, [timeEntries, sortField, sortDirection]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 hover:text-brikx-teal transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-4 h-4 ${sortField === field ? 'text-brikx-teal' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className="bg-white rounded-brikx border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold">Alle uren ({timeEntries.length})</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="date">Datum</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="project">Project</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="phase">Fase</SortButton>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                <SortButton field="hours">Uren</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Omschrijving
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Bedrag
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Geen uren gevonden
                </td>
              </tr>
            ) : (
              sortedEntries.map(entry => {
                const project = entry.projects || entry.project;
                const phase = entry.phases || entry.phase;
                const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                const phaseRates = (project as any)?.phase_rates_cents || {};
                const rate = (phaseRates[entry.phase_code] ?? project?.default_rate_cents ?? 0) / 100;
                const amount = hours * rate;

                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.occurred_on).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {project?.name || "Onbekend"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {phase?.name || entry.phase_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {hours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {EUR(amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => {
                          if (confirm("Weet je zeker dat je deze entry wilt verwijderen?")) {
                            deleteEntry.mutate(entry.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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