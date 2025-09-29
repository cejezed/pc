import React, { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useAddTimeEntry } from "./hooks";
import ProjectModal from "./ProjectModal";
import type { Project, Phase, TimeEntry } from "./types";
import { EUR } from "./utils";

const todayISO = () => new Date().toISOString().split("T")[0];

interface Props {
  projects: Project[];
  phases: Phase[];
  timeEntries: TimeEntry[];
}

export default function UrenInvoer({ projects, phases, timeEntries }: Props) {
  const addTimeEntry = useAddTimeEntry();
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Form state
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  // Sorteer projecten: recent gebruikte bovenaan
  const sortedProjects = useMemo(() => {
    const recentProjectIds = new Set(
      timeEntries
        .slice(0, 10)
        .map(e => e.project_id)
    );
    
    const recent = projects.filter(p => recentProjectIds.has(p.id));
    const rest = projects.filter(p => !recentProjectIds.has(p.id));
    
    return [...recent, ...rest];
  }, [projects, timeEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedPhase || !hours) {
      alert("Vul alle verplichte velden in");
      return;
    }

    addTimeEntry.mutate({
      project_id: selectedProject,
      phase_code: selectedPhase,
      occurred_on: date,
      hours,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedProject("");
    setSelectedPhase("");
    setHours("");
    setNotes("");
  };

  // Project status berekenen
  const projectStats = useMemo(() => {
    return projects
      .filter(p => !p.archived)
      .map(project => {
        const projectEntries = timeEntries.filter(e => e.project_id === project.id);
        const totalHours = projectEntries.reduce((sum, e) => {
          return sum + (e.minutes ? e.minutes / 60 : e.hours || 0);
        }, 0);
        const rate = (project.default_rate_cents || 0) / 100;
        const amount = totalHours * rate;

        return { project, totalHours, amount };
      })
      .filter(p => p.totalHours > 0)
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [projects, timeEntries]);

  return (
    <>
      <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Nieuwe uren registreren</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Kolom 1: Project Selectie */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Project *
                </label>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="text-brikx-teal hover:text-brikx-teal-dark text-sm font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Nieuw
                </button>
              </div>
              <div className="border border-gray-300 rounded-lg h-[320px] overflow-y-auto bg-white">
                {sortedProjects.map((project, index) => {
                  const isRecent = index < 5;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProject(project.id)}
                      className={`w-full text-left px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedProject === project.id
                          ? "bg-brikx-teal/10 border-l-4 border-l-brikx-teal font-medium"
                          : ""
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {project.name}
                        {isRecent && (
                          <span className="ml-2 text-xs text-brikx-teal font-normal">● recent</span>
                        )}
                      </div>
                      {project.city && (
                        <div className="text-xs text-gray-500 leading-tight">{project.city}</div>
                      )}
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Geen projecten gevonden
                  </div>
                )}
              </div>
            </div>

            {/* Kolom 2: Fase Selectie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fase *
              </label>
              <div className="border border-gray-300 rounded-lg h-[320px] overflow-y-auto bg-white">
                {phases
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(phase => (
                    <button
                      key={phase.code}
                      type="button"
                      onClick={() => setSelectedPhase(phase.code)}
                      className={`w-full text-left px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedPhase === phase.code
                          ? "bg-brikx-teal/10 border-l-4 border-l-brikx-teal font-medium"
                          : ""
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {phase.name}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Kolom 3: Datum, Uren, Omschrijving */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all pr-10"
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uren *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Bijv. 3.5"
                  className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Omschrijving
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele beschrijving..."
                  className="w-full border border-gray-300 rounded-brikx px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent transition-all"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={addTimeEntry.isPending}
                className="w-full bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-2.5 rounded-brikx font-semibold shadow-lg hover:shadow-brikx transition-all disabled:bg-gray-300"
              >
                {addTimeEntry.isPending ? "Bezig..." : "Uren toevoegen"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Project status onderaan */}
      <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm mt-6">
        <h3 className="text-lg font-semibold mb-4 text-brikx-dark">Project status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectStats.map(({ project, totalHours, amount }) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-sm text-gray-900 mb-1 truncate">
                {project.name}
              </div>
              {project.city && (
                <div className="text-xs text-gray-500 mb-2">{project.city}</div>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-brikx-dark">
                  {totalHours.toFixed(1)}u
                </div>
                <div className="text-xs text-gray-600">
                  {EUR(amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showProjectModal && (
        <ProjectModal
          phases={phases}
          onClose={() => setShowProjectModal(false)}
        />
      )}
    </>
  );
}