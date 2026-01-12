import React from "react";
import { ChevronDown, ChevronRight, Archive, ArchiveRestore, Trash2, Plus, Edit3, CheckCircle2, Euro } from "lucide-react";
import type { Project, Phase, TimeEntry } from "./types";
import { phaseShortcodes } from "./types";
import { EUR } from "./utils";
import { useDeleteProject, useArchiveProject } from "./hooks";
import ProjectModal from "./ProjectModal";

type Props = {
  projects: Project[];
  phases: Phase[];
  timeEntries: TimeEntry[];
};

export default function ProjectOverzicht({ projects, phases, timeEntries }: Props) {
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());
  const [showArchivedProjects, setShowArchivedProjects] = React.useState(false);
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [editProject, setEditProject] = React.useState<Project | null>(null);
  const [entryFilters, setEntryFilters] = React.useState<Record<string, { from?: string }>>({});

  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();

  const projectSummary = React.useMemo(() => {
    return projects.map((project) => {
      const projectEntries = timeEntries.filter((e) => e.project_id === project.id);
      const defaultRate = (project.default_rate_cents || 0) / 100;
      const phaseRatesCents = ((project as any)?.phase_rates_cents ?? {}) as Record<string, number>;
      const invoicedPhases = new Set<string>(((project as any)?.invoiced_phases ?? []) as string[]);

      const totalHours = projectEntries.reduce((sum, e) => sum + (e.minutes ? e.minutes / 60 : e.hours || 0), 0);

      // Split billed/unbilled
      const billedEntries = projectEntries.filter(e => e.invoiced_at != null);
      const unbilledEntries = projectEntries.filter(e => e.invoiced_at == null);

      const billedHours = billedEntries.reduce((sum, e) => sum + (e.minutes ? e.minutes / 60 : e.hours || 0), 0);
      const unbilledHours = unbilledEntries.reduce((sum, e) => sum + (e.minutes ? e.minutes / 60 : e.hours || 0), 0);

      // Bereken bedragen per entry (met fase-specifieke tarieven)
      const billedAmount = billedEntries.reduce((sum, e) => {
        const phaseRate = (phaseRatesCents[e.phase_code] ?? project.default_rate_cents ?? 0) / 100;
        const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
        return sum + (hours * phaseRate);
      }, 0);

      const unbilledAmount = unbilledEntries.reduce((sum, e) => {
        const phaseRate = (phaseRatesCents[e.phase_code] ?? project.default_rate_cents ?? 0) / 100;
        const hours = e.minutes ? e.minutes / 60 : e.hours || 0;
        return sum + (hours * phaseRate);
      }, 0);

      const totalAmount = billedAmount + unbilledAmount;

      const phaseBreakdown = phases.reduce((acc, phase) => {
        const phaseEntries = projectEntries.filter((e) => e.phase_code === phase.code);
        const phaseHours = phaseEntries.reduce((sum, e) => sum + (e.minutes ? e.minutes / 60 : e.hours || 0), 0);

        const phaseRate = (phaseRatesCents[phase.code] ?? project.default_rate_cents ?? 0) / 100;
        const budgetCents = ((project as any)?.phase_budgets?.[phase.code] as number | undefined);

        acc[phase.code] = {
          phase,
          hours: phaseHours,
          rate: phaseRate,
          amount: phaseHours * phaseRate,
          budget: budgetCents,
          invoiced: invoicedPhases.has(phase.code),
        };
        return acc;
      }, {} as Record<string, { phase: Phase; hours: number; rate: number; amount: number; budget?: number; invoiced: boolean }>);

      return {
        project,
        entries: projectEntries,
        totalHours,
        totalAmount,
        billedHours,
        billedAmount,
        unbilledHours,
        unbilledAmount,
        phaseBreakdown,
        hasEntries: projectEntries.length > 0,
        lastActivity: projectEntries.length > 0
          ? projectEntries.sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())[0].occurred_on
          : null,
      };
    });
  }, [projects, phases, timeEntries]);

  const activeProjects = projectSummary.filter(p => !p.project.archived);
  const archivedProjects = projectSummary.filter(p => p.project.archived);

  const sortedActiveProjects = React.useMemo(() => {
    return activeProjects.sort((a, b) => {
      if (a.hasEntries && !b.hasEntries) return -1;
      if (!a.hasEntries && b.hasEntries) return 1;
      if (a.lastActivity && b.lastActivity) {
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }
      return a.project.name.localeCompare(b.project.name);
    });
  }, [activeProjects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) newSet.delete(projectId);
      else newSet.add(projectId);
      return newSet;
    });
  };

  const handleDelete = (projectId: string, projectName: string) => {
    if (confirm(`Weet je zeker dat je project "${projectName}" wilt verwijderen?`)) {
      deleteProject.mutate(projectId);
    }
  };

  const handleArchive = (projectId: string, shouldArchive: boolean) => {
    archiveProject.mutate({ id: projectId, archived: shouldArchive });
  };

  const openCreate = () => {
    setEditProject(null);
    setShowProjectModal(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setShowProjectModal(true);
  };

  return (
    <>
      {showProjectModal && (
        <ProjectModal
          phases={phases}
          onClose={() => setShowProjectModal(false)}
          project={editProject}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[var(--zeus-text)]">Projecten</h2>
          <button
            onClick={openCreate}
            className="bg-[var(--zeus-accent)] text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[var(--zeus-accent)]/80 transition-all shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_25px_rgba(255,107,0,0.5)]"
          >
            <Plus className="w-4 h-4" />
            Project toevoegen
          </button>
        </div>

        <div className="space-y-4">
        {sortedActiveProjects.map(({ project, entries, totalHours, totalAmount, billedAmount, unbilledAmount, billedHours, unbilledHours, phaseBreakdown, hasEntries }) => {
            const isExpanded = expandedProjects.has(project.id);
            const filterFrom = entryFilters[project.id]?.from;
            const filteredEntries = filterFrom
              ? entries.filter((entry) => new Date(entry.occurred_on) >= new Date(filterFrom))
              : entries;
            const filteredHours = filteredEntries.reduce((sum, entry) => {
              const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
              return sum + hours;
            }, 0);
            return (
              <div key={project.id} className="zeus-card overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="flex items-center gap-3 flex-1 text-left hover:bg-[var(--zeus-card-hover)] -m-4 p-4 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[var(--zeus-text-secondary)] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[var(--zeus-text-secondary)] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-[var(--zeus-text)]">{project.name}</h3>
                      {project.city && <p className="text-sm text-[var(--zeus-text-secondary)]">{project.city}</p>}
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-lg text-[var(--zeus-text)] flex items-center gap-2 justify-end">
                        <Euro className="w-5 h-5 text-[var(--zeus-primary)]" />
                        <span>{EUR(totalAmount)}</span>
                      </div>
                      <div className="text-sm text-[var(--zeus-text-secondary)]">{totalHours.toFixed(1)} uur totaal</div>
                      {unbilledAmount > 0 && (
                        <div className="text-xs text-orange-500 font-medium mt-1">
                          {EUR(unbilledAmount)} te factureren
                        </div>
                      )}
                      {billedAmount > 0 && (
                        <div className="text-xs text-green-500 mt-0.5">
                          {EUR(billedAmount)} gefactureerd
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEdit(project)}
                      className="p-2 text-[var(--zeus-text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="Project bewerken"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(project.id, true)}
                      className="p-2 text-[var(--zeus-text-secondary)] hover:text-orange-400 hover:bg-orange-500/10 rounded transition-colors"
                      title="Archiveer project"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-2 text-[var(--zeus-text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Verwijder project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--zeus-border)] p-4 bg-[var(--zeus-bg-secondary)]">
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="bg-[var(--zeus-card)] rounded-lg p-3 border border-[var(--zeus-border)]">
                        <div className="text-xs text-[var(--zeus-text-secondary)] mb-1">Totaal</div>
                        <div className="text-lg font-semibold text-[var(--zeus-text)]">{EUR(totalAmount)}</div>
                        <div className="text-xs text-[var(--zeus-text-secondary)]">{totalHours.toFixed(1)} uur</div>
                      </div>
                      <div className="bg-green-900/20 rounded-lg p-3 border border-green-800/50">
                        <div className="text-xs text-green-400 mb-1">Gefactureerd</div>
                        <div className="text-lg font-semibold text-green-400">{EUR(billedAmount)}</div>
                        <div className="text-xs text-green-400/80">{billedHours.toFixed(1)} uur</div>
                      </div>
                      <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-800/50">
                        <div className="text-xs text-orange-400 mb-1">Ongefactureerd</div>
                        <div className="text-lg font-semibold text-orange-400">{EUR(unbilledAmount)}</div>
                        <div className="text-xs text-orange-400/80">{unbilledHours.toFixed(1)} uur</div>
                      </div>
                    </div>

                    <table className="w-full text-sm">
                      <thead className="border-b border-[var(--zeus-border)]">
                        <tr>
                          <th className="text-left py-2 font-medium text-[var(--zeus-text-secondary)]">Fase</th>
                          <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Uren</th>
                          <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Tarief</th>
                          <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Bedrag</th>
                          {project.billing_type === 'fixed' && (
                            <>
                              <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Budget</th>
                              <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">%</th>
                            </>
                          )}
                          <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phases
                          .slice()
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((phase) => {
                            const data = phaseBreakdown[phase.code];
                            const hasHours = data?.hours > 0;
                            const hasBudget = data?.budget && data?.budget > 0;
                            const showRow = hasHours || hasBudget || data?.invoiced;

                            if (!showRow) return null;

                            const percentage = hasBudget ? (data.amount / (data.budget! / 100)) * 100 : 0;
                            const isOverBudget = percentage > 100;

                            return (
                              <tr key={phase.code} className="border-b border-[var(--zeus-border)] last:border-0 hover:bg-[var(--zeus-card-hover)]">
                                <td className="py-2 text-[var(--zeus-text)]">
                                  <span className="font-medium text-[var(--zeus-text-secondary)] mr-2">
                                    {phaseShortcodes[phase.code]}
                                  </span>
                                  {phase.name}
                                </td>
                                <td className="text-right py-2 text-[var(--zeus-text)]">{(data?.hours ?? 0).toFixed(1)}</td>
                                <td className="text-right py-2 text-[var(--zeus-text)]">{EUR(data?.rate ?? 0)}</td>
                                <td className="text-right py-2 font-medium text-[var(--zeus-text)]">{EUR(data?.amount ?? 0)}</td>
                                {project.billing_type === 'fixed' && (
                                  <>
                                    <td className="text-right py-2 text-[var(--zeus-text-secondary)]">
                                      {hasBudget ? EUR((data!.budget! / 100)) : '-'}
                                    </td>
                                    <td className={`text-right py-2 font-medium ${isOverBudget ? 'text-red-400' : 'text-green-400'
                                      }`}>
                                      {hasBudget ? `${percentage.toFixed(0)}%` : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="text-right py-2">
                                  {data?.invoiced ? (
                                    <span className="inline-flex items-center gap-1 text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full text-xs border border-green-800/50">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Gefactureerd
                                    </span>
                                  ) : (
                                    <span className="text-[var(--zeus-text-secondary)]/50">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {!hasEntries && (
                      <div className="text-center py-4 text-[var(--zeus-text-secondary)] text-sm">
                        Nog geen uren geregistreerd voor dit project
                      </div>
                    )}

                    {hasEntries && (
                      <div className="mt-6">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-base font-semibold text-[var(--zeus-text)]">Alle invoeren</h4>
                            <p className="text-xs text-[var(--zeus-text-secondary)]">
                              {filteredEntries.length} entries, {filteredHours.toFixed(1)} uur
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-[var(--zeus-text-secondary)]">Vanaf datum</label>
                            <input
                              type="date"
                              value={filterFrom || ""}
                              onChange={(e) =>
                                setEntryFilters((prev) => ({
                                  ...prev,
                                  [project.id]: { from: e.target.value || undefined },
                                }))
                              }
                              className="bg-[var(--zeus-card)] border border-[var(--zeus-border)] rounded-md px-2 py-1 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-[var(--zeus-border)]">
                              <tr>
                                <th className="text-left py-2 font-medium text-[var(--zeus-text-secondary)]">Datum</th>
                                <th className="text-left py-2 font-medium text-[var(--zeus-text-secondary)]">Fase</th>
                                <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Uren</th>
                                <th className="text-left py-2 font-medium text-[var(--zeus-text-secondary)]">Omschrijving</th>
                                <th className="text-right py-2 font-medium text-[var(--zeus-text-secondary)]">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-3 text-center text-[var(--zeus-text-secondary)] text-sm">
                                    Geen uren gevonden vanaf deze datum
                                  </td>
                                </tr>
                              ) : (
                                filteredEntries
                                  .slice()
                                  .sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())
                                  .map((entry) => {
                                    const phase = entry.phases || entry.phase;
                                    const hours = entry.minutes ? entry.minutes / 60 : entry.hours || 0;
                                    const isBilled = !!entry.invoiced_at;
                                    return (
                                      <tr key={entry.id} className="border-b border-[var(--zeus-border)] last:border-0">
                                        <td className="py-2 text-[var(--zeus-text)]">
                                          {new Date(entry.occurred_on).toLocaleDateString("nl-NL")}
                                        </td>
                                        <td className="py-2 text-[var(--zeus-text-secondary)]">
                                          {phase?.name || entry.phase_code}
                                        </td>
                                        <td className="py-2 text-right text-[var(--zeus-text)]">
                                          {hours.toFixed(2)}
                                        </td>
                                        <td className="py-2 text-[var(--zeus-text-secondary)]">
                                          {entry.notes || "-"}
                                        </td>
                                        <td className="py-2 text-right">
                                          {isBilled ? (
                                            <span className="text-xs text-green-400">
                                              Gefactureerd{entry.invoice_number ? ` (${entry.invoice_number})` : ""}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-[var(--zeus-text-secondary)]/60">Open</span>
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {archivedProjects.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchivedProjects(!showArchivedProjects)}
              className="flex items-center gap-2 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] font-medium mb-3"
            >
              {showArchivedProjects ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              Gearchiveerde projecten ({archivedProjects.length})
            </button>

            {showArchivedProjects && (
              <div className="space-y-3 opacity-60">
                {archivedProjects.map(({ project, totalHours, totalAmount }) => (
                  <div key={project.id} className="zeus-card p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--zeus-text)]">{project.name}</h3>
                      <p className="text-sm text-[var(--zeus-text-secondary)]">{totalHours.toFixed(1)} uur · {EUR(totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchive(project.id, false)}
                        className="p-2 text-[var(--zeus-text-secondary)] hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                        title="Activeer project"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.name)}
                        className="p-2 text-[var(--zeus-text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Verwijder project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
