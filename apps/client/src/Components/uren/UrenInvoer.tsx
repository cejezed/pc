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
      <div className="zeus-card p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--zeus-text)]">Nieuwe uren registreren</h2>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* RESPONSIVE GRID: 1 kolom mobiel, 3 kolommen desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Kolom 1: Project Selectie */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)]">
                  Project *
                </label>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="text-[var(--zeus-primary)] hover:text-[var(--zeus-text-highlight)] text-sm font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nieuw
                </button>
              </div>
              {/* RESPONSIVE HEIGHT: 200px mobiel, 320px desktop */}
              <div className="border border-[var(--zeus-border)] rounded-lg h-[200px] lg:h-[320px] overflow-y-auto bg-[var(--zeus-bg-secondary)] custom-scrollbar">
                {sortedProjects.map((project, index) => {
                  const isRecent = index < 5;
                  const isSelected = selectedProject === project.id;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProject(project.id)}
                      className={`w-full text-left px-3 py-2.5 md:py-2 border-b border-[var(--zeus-border)] transition-all ${isSelected
                        ? "bg-[var(--zeus-primary)] text-white border-l-4 border-l-white font-medium"
                        : "hover:bg-[var(--zeus-card-hover)] text-[var(--zeus-text)]"
                        }`}
                    >
                      <div className="text-sm font-medium leading-tight">
                        {project.name}
                        {isRecent && !isSelected && (
                          <span className="ml-2 text-xs text-[var(--zeus-primary)] font-normal">● recent</span>
                        )}
                      </div>
                      {project.city && (
                        <div className={`text-xs leading-tight ${isSelected ? 'text-white opacity-90' : 'text-[var(--zeus-text-secondary)]'}`}>
                          {project.city}
                        </div>
                      )}
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <div className="flex items-center justify-center h-full text-[var(--zeus-text-secondary)] text-sm">
                    Geen projecten gevonden
                  </div>
                )}
              </div>
            </div>

            {/* Kolom 2: Fase Selectie */}
            <div>
              <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                Fase *
              </label>
              <div className="border border-[var(--zeus-border)] rounded-lg h-[200px] lg:h-[320px] overflow-y-auto bg-[var(--zeus-bg-secondary)] custom-scrollbar">
                {phases
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(phase => {
                    const isSelected = selectedPhase === phase.code;
                    return (
                      <button
                        key={phase.code}
                        type="button"
                        onClick={() => setSelectedPhase(phase.code)}
                        className={`w-full text-left px-3 py-2.5 md:py-2 border-b border-[var(--zeus-border)] transition-all ${isSelected
                          ? "bg-[var(--zeus-primary)] text-white border-l-4 border-l-white font-medium"
                          : "hover:bg-[var(--zeus-card-hover)] text-[var(--zeus-text)]"
                          }`}
                      >
                        <div className="text-sm font-medium leading-tight">
                          {phase.name}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Kolom 3: Datum, Uren, Omschrijving */}
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Datum *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-zeus pr-10"
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--zeus-text-secondary)] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Uren *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Bijv. 3.5"
                  className="input-zeus"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Omschrijving
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele beschrijving..."
                  className="input-zeus resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={addTimeEntry.isPending}
                className={`w-full px-4 md:px-6 py-2.5 md:py-3 font-semibold shadow-lg transition-all rounded-xl ${addTimeEntry.isPending
                  ? 'bg-[var(--zeus-card-hover)] cursor-not-allowed text-[var(--zeus-text-secondary)]'
                  : 'btn-zeus-primary'
                  }`}
              >
                {addTimeEntry.isPending ? "Bezig..." : "Uren toevoegen"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Laatste 3 invoeren */}
      <div className="zeus-card mt-6 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--zeus-border)] bg-[var(--zeus-card-hover)]">
          <h3 className="text-base md:text-lg font-semibold text-[var(--zeus-text)]">Laatste 3 invoeren</h3>
        </div>

        {/* DESKTOP: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--zeus-bg-secondary)] border-b border-[var(--zeus-border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Fase</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Uren</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Notities</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase">Bedrag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--zeus-border)]">
              {timeEntries.slice(0, 3).map(entry => {
                const project = entry.projects || entry.project;
                const phase = entry.phases || entry.phase;
                const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                const phaseRates = (project as any)?.phase_rates_cents || {};
                const rate = (phaseRates[entry.phase_code] ?? project?.default_rate_cents ?? 0) / 100;
                const amount = hours * rate;

                return (
                  <tr key={entry.id} className="hover:bg-[var(--zeus-card-hover)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--zeus-text)]">
                      {new Date(entry.occurred_on).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-[var(--zeus-text)]">{project?.name || "Onbekend"}</div>
                      {project?.city && <div className="text-xs text-[var(--zeus-text-secondary)]">{project.city}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--zeus-text-secondary)]">{phase?.name || entry.phase_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[var(--zeus-text)]">
                      {hours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--zeus-text-secondary)] max-w-xs truncate">{entry.notes || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[var(--zeus-text)]">
                      {EUR(amount)}
                    </td>
                  </tr>
                );
              })}
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--zeus-text-secondary)]">
                    Nog geen uren geregistreerd
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE: Cards */}
        <div className="md:hidden divide-y divide-[var(--zeus-border)]">
          {timeEntries.slice(0, 3).map(entry => {
            const project = entry.projects || entry.project;
            const phase = entry.phases || entry.phase;
            const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
            const phaseRates = (project as any)?.phase_rates_cents || {};
            const rate = (phaseRates[entry.phase_code] ?? project?.default_rate_cents ?? 0) / 100;
            const amount = hours * rate;

            return (
              <div key={entry.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--zeus-text)] truncate">{project?.name || "Onbekend"}</div>
                    {project?.city && <div className="text-xs text-[var(--zeus-text-secondary)]">{project.city}</div>}
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-semibold text-[var(--zeus-text)]">{EUR(amount)}</div>
                    <div className="text-xs text-[var(--zeus-text-secondary)]">{hours.toFixed(2)} uur</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--zeus-text-secondary)]">{phase?.name || entry.phase_code}</span>
                  <span className="text-[var(--zeus-text-secondary)]/50">•</span>
                  <span className="text-[var(--zeus-text-secondary)]">
                    {new Date(entry.occurred_on).toLocaleDateString("nl-NL")}
                  </span>
                </div>
                {entry.notes && (
                  <div className="text-sm text-[var(--zeus-text-secondary)] line-clamp-2">{entry.notes}</div>
                )}
              </div>
            );
          })}
          {timeEntries.length === 0 && (
            <div className="p-8 text-center text-[var(--zeus-text-secondary)]">
              Nog geen uren geregistreerd
            </div>
          )}
        </div>
      </div>

      {/* Project status onderaan */}
      <div className="zeus-card p-4 md:p-6 mt-6">
        <h3 className="text-base md:text-lg font-semibold mb-4 text-[var(--zeus-text)]">Project status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {projectStats.map(({ project, totalHours, amount }) => (
            <div key={project.id} className="border border-[var(--zeus-border)] rounded-lg p-3 hover:border-[var(--zeus-primary)] transition-colors bg-[var(--zeus-bg-secondary)]">
              <div className="font-medium text-sm text-[var(--zeus-text)] mb-1 truncate">
                {project.name}
              </div>
              {project.city && (
                <div className="text-xs text-[var(--zeus-text-secondary)] mb-2">{project.city}</div>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-[var(--zeus-primary)]">
                  {totalHours.toFixed(1)}u
                </div>
                <div className="text-xs text-[var(--zeus-text-secondary)]">
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