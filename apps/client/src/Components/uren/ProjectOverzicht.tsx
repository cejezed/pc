import React from "react";
import { ChevronDown, ChevronRight, Archive, ArchiveRestore, Trash2, Plus, Edit3, CheckCircle2 } from "lucide-react";
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

  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();

  const projectSummary = React.useMemo(() => {
    return projects.map((project) => {
      const projectEntries = timeEntries.filter((e) => e.project_id === project.id);
      const defaultRate = (project.default_rate_cents || 0) / 100;
      const phaseRatesCents = ((project as any)?.phase_rates_cents ?? {}) as Record<string, number>;
      const invoicedPhases = new Set<string>(((project as any)?.invoiced_phases ?? []) as string[]);

      const totalHours = projectEntries.reduce((sum, e) => sum + (e.minutes ? e.minutes / 60 : e.hours || 0), 0);
      const totalAmount = totalHours * defaultRate;

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
        totalHours,
        totalAmount,
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

      <div className="space-y-4">
        {/* Header met Project Toevoegen button */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brikx-dark">Projecten</h2>
          <button
            onClick={openCreate}
            className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Project toevoegen
          </button>
        </div>

        {/* Actieve Projecten */}
        <div className="space-y-3">
          {sortedActiveProjects.map(({ project, totalHours, totalAmount, phaseBreakdown, hasEntries }) => {
            const isExpanded = expandedProjects.has(project.id);
            return (
              <div key={project.id} className="bg-white rounded-brikx shadow-sm border border-gray-200">
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="flex items-center gap-3 flex-1 text-left hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-brikx-dark">{project.name}</h3>
                      {project.city && <p className="text-sm text-gray-600">{project.city}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-brikx-dark">{EUR(totalAmount)}</div>
                      <div className="text-sm text-gray-600">{totalHours.toFixed(1)} uur</div>
                    </div>
                  </button>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEdit(project)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Project bewerken"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(project.id, true)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Archiveer project"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Verwijder project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 bg-gray-50">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 font-medium text-gray-700">Fase</th>
                          <th className="text-right py-2 font-medium text-gray-700">Uren</th>
                          <th className="text-right py-2 font-medium text-gray-700">Tarief</th>
                          <th className="text-right py-2 font-medium text-gray-700">Bedrag</th>
                          {project.billing_type === 'fixed' && (
                            <>
                              <th className="text-right py-2 font-medium text-gray-700">Budget</th>
                              <th className="text-right py-2 font-medium text-gray-700">%</th>
                            </>
                          )}
                          <th className="text-right py-2 font-medium text-gray-700">Status</th>
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
                              <tr key={phase.code} className="border-b last:border-0 hover:bg-gray-100">
                                <td className="py-2">
                                  <span className="font-medium text-gray-600 mr-2">
                                    {phaseShortcodes[phase.code]}
                                  </span>
                                  {phase.name}
                                </td>
                                <td className="text-right py-2">{(data?.hours ?? 0).toFixed(1)}</td>
                                <td className="text-right py-2">{EUR(data?.rate ?? 0)}</td>
                                <td className="text-right py-2 font-medium">{EUR(data?.amount ?? 0)}</td>
                                {project.billing_type === 'fixed' && (
                                  <>
                                    <td className="text-right py-2 text-gray-600">
                                      {hasBudget ? EUR((data!.budget! / 100)) : '-'}
                                    </td>
                                    <td className={`text-right py-2 font-medium ${
                                      isOverBudget ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {hasBudget ? `${percentage.toFixed(0)}%` : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="text-right py-2">
                                  {data?.invoiced ? (
                                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Gefactureerd
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>

                    {!hasEntries && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Nog geen uren geregistreerd voor dit project
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gearchiveerde Projecten */}
        {archivedProjects.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchivedProjects(!showArchivedProjects)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-3"
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
                  <div key={project.id} className="bg-white rounded-brikx shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-brikx-dark">{project.name}</h3>
                      <p className="text-sm text-gray-600">{totalHours.toFixed(1)} uur · {EUR(totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleArchive(project.id, false)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Activeer project"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.name)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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