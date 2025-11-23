import React, { useState } from "react";
import { Download } from "lucide-react";
import { useProjects, usePhases, useTimeEntries } from "./hooks";
import UrenInvoer from "./UrenInvoer";
import ProjectOverzicht from "./ProjectOverzicht";
import AlleUren from "./AlleUren";
import { EUR } from "./utils";

export default function Uren() {
  const [view, setView] = useState<"entries" | "summary" | "all">("entries");

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: phases = [], isLoading: phasesLoading } = usePhases();
  const { data: timeEntries = [], isLoading: entriesLoading } = useTimeEntries();

  const exportToCSV = () => {
    const headers = [
      "Project",
      "Fase",
      "Datum",
      "Uren",
      "Omschrijving",
      "Uurtarief",
      "Bedrag",
      "Gefactureerd",
      "Factuurnummer"
    ];

    const rows = timeEntries.map((e) => {
      const project = e.projects || e.project;
      const phase = e.phases || e.phase;
      const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
      const phaseRates = (project as any)?.phase_rates_cents || {};
      const rate = (phaseRates[e.phase_code] ?? project?.default_rate_cents ?? 0) / 100;

      return [
        project?.name || "Onbekend",
        phase?.name || e.phase_code,
        e.occurred_on,
        hours.toFixed(2),
        e.notes || "",
        EUR(rate),
        EUR(hours * rate),
        e.invoiced_at ? "Ja" : "Nee",
        e.invoice_number || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urenexport-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (projectsLoading || phasesLoading || entriesLoading) {
    return (
      <div className="min-h-screen bg-[var(--zeus-bg)] flex items-center justify-center">
        <div className="text-[var(--zeus-text-secondary)] animate-pulse">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] text-[var(--zeus-text)]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* View Toggle */}
        <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setView("entries")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${view === "entries"
                ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                : "bg-[var(--zeus-card)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] hover:text-white"
                }`}
            >
              Uren invoer
            </button>
            <button
              onClick={() => setView("summary")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${view === "summary"
                ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                : "bg-[var(--zeus-card)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] hover:text-white"
                }`}
            >
              Project overzicht
            </button>
            <button
              onClick={() => setView("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${view === "all"
                ? "bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]"
                : "bg-[var(--zeus-card)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] hover:text-white"
                }`}
            >
              Alle uren
            </button>
            <button
              onClick={exportToCSV}
              className="btn-zeus-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {view === "entries" && (
            <UrenInvoer
              projects={projects}
              phases={phases}
              timeEntries={timeEntries}
            />
          )}

          {view === "summary" && (
            <ProjectOverzicht
              projects={projects}
              phases={phases}
              timeEntries={timeEntries}
            />
          )}

          {view === "all" && <AlleUren timeEntries={timeEntries} />}
        </div>
      </div>
    </div>
  );
}