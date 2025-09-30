import React, { useState } from "react";
import { Download, DollarSign } from "lucide-react";
import { useProjects, usePhases, useTimeEntries } from "./hooks";
import UrenInvoer from "./UrenInvoer";
import ProjectOverzicht from "./ProjectOverzicht";
import AlleUren from "./AlleUren";
import FactureerModal from "./FactureerModal";
import { EUR } from "./utils";

export default function Uren() {
  const [view, setView] = useState<"entries" | "summary" | "all">("entries");
  const [showFactureerModal, setShowFactureerModal] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: phases = [], isLoading: phasesLoading } = usePhases();
  const { data: timeEntries = [], isLoading: entriesLoading } = useTimeEntries();

  const exportToCSV = () => {
    const headers = ["Project", "Fase", "Datum", "Uren", "Omschrijving", "Uurtarief", "Bedrag"];
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
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Uren</h1>
            <p className="text-gray-600 mt-1">
              Registreer je gewerkte uren per project en fase
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("entries")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === "entries" 
                  ? "bg-brikx-teal text-white shadow-lg" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-brikx-teal"
              }`}
            >
              Uren invoer
            </button>
            <button
              onClick={() => setView("summary")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === "summary" 
                  ? "bg-brikx-teal text-white shadow-lg" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-brikx-teal"
              }`}
            >
              Project overzicht
            </button>
            <button
              onClick={() => setView("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === "all" 
                  ? "bg-brikx-teal text-white shadow-lg" 
                  : "bg-white text-gray-700 border border-gray-300 hover:border-brikx-teal"
              }`}
            >
              Alle uren
            </button>
            <button
              onClick={() => setShowFactureerModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Factureren
            </button>
            <button
              onClick={exportToCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Content - GEEN grid meer, gewoon full width */}
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

        {/* Factureer Modal */}
        {showFactureerModal && (
          <FactureerModal
            projects={projects}
            phases={phases}
            timeEntries={timeEntries}
            onClose={() => setShowFactureerModal(false)}
          />
        )}
      </div>
    </div>
  );
}
