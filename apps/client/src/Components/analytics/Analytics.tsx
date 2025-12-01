import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  BarChart3,
} from "lucide-react";
import {
  TimeBarChart,
  BudgetPieChart,
  TrendLineChart,
  ProjectPhaseChart,
} from "./chart-componenten";
import { PeriodSelector, ViewToggle } from "./filter-componenten";
import { KPICard } from "./kpi-componenten";
import {
  EUR,
  toISODate,
  startOfPeriod,
  endOfPeriod,
  CHART_COLORS,
} from "./basis-componenten";
import { Button } from "@/Components/ui/button";
import { FinanceDashboard } from "./finance-dashboard";
import { FinanceTaxCockpit } from "./FinanceTaxCockpit";

// Types
type TimeEntry = {
  id: string;
  project_id: string;
  phase_code: string;
  occurred_on: string;
  minutes: number;
  projects?: { name: string };
  phases?: { name: string };
};

type Project = {
  id: string;
  name: string;
  default_rate_cents: number;
};

// Supabase queries
async function fetchTimeEntries(
  from?: string,
  to?: string
): Promise<TimeEntry[]> {
  if (!supabase) throw new Error("Supabase not initialized");

  let query = supabase
    .from("time_entries")
    .select(
      `
      *,
      projects(name),
      phases(name)
    `
    )
    .order("occurred_on", { ascending: true });

  if (from) query = query.gte("occurred_on", from);
  if (to) query = query.lte("occurred_on", to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchProjects(): Promise<Project[]> {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, default_rate_cents")
    .eq("archived", false);

  if (error) throw error;
  return data || [];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const getDateRange = (range: "week" | "month" | "quarter") => {
  const now = new Date();
  const from = new Date(now);

  switch (range) {
    case "week":
      from.setDate(now.getDate() - 7);
      break;
    case "month":
      from.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      from.setMonth(now.getMonth() - 3);
      break;
  }

  return {
    from: from.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
};

export default function Analytics() {
  const [timeRange, setTimeRange] = React.useState<
    "week" | "month" | "quarter" | "custom"
  >("month");
  const [selectedProject, setSelectedProject] = React.useState<string | "all">(
    "all"
  );
  const [viewType, setViewType] = React.useState<"chart" | "table">("chart");
  const [customRange, setCustomRange] = React.useState({ from: "", to: "" });

  // 🔐 userId ophalen uit Supabase auth
  const [userId, setUserId] = React.useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        console.error("Error loading auth user", error);
        setUserId(null);
        return;
      }
      setUserId(data.user?.id ?? null);
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get date range
  const dateRange =
    timeRange === "custom"
      ? customRange
      : getDateRange(timeRange);

  // Fetch data
  const {
    data: timeEntries = [],
    isLoading: entriesLoading,
  } = useQuery({
    queryKey: ["analytics-entries", dateRange.from, dateRange.to],
    queryFn: () => fetchTimeEntries(dateRange.from, dateRange.to),
    enabled: !!(dateRange.from && dateRange.to),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["analytics-projects"],
    queryFn: fetchProjects,
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!timeEntries.length) {
      return {
        kpis: {
          total_hours: 0,
          avg_hours_per_day: 0,
          total_revenue: 0,
          avg_hourly_rate: 0,
        },
        dailyData: [],
        projectData: [],
      };
    }

    // Filter by selected project
    const filteredEntries =
      selectedProject === "all"
        ? timeEntries
        : timeEntries.filter((e) => e.project_id === selectedProject);

    // Calculate KPIs
    const totalMinutes = filteredEntries.reduce(
      (sum, e) => sum + e.minutes,
      0
    );
    const totalHours = totalMinutes / 60;

    // Get unique dates for avg calculation
    const uniqueDates = new Set(filteredEntries.map((e) => e.occurred_on));
    const avgHoursPerDay =
      uniqueDates.size > 0 ? totalHours / uniqueDates.size : 0;

    // Calculate revenue (estimate based on default rate)
    const totalRevenue = filteredEntries.reduce((sum, e) => {
      const project = projects.find((p) => p.id === e.project_id);
      const hourlyRate = project ? project.default_rate_cents / 100 : 75;
      return sum + (e.minutes / 60) * hourlyRate;
    }, 0);

    const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Daily breakdown
    const dailyMap = new Map<
      string,
      { hours: number; projects: Map<string, number> }
    >();

    filteredEntries.forEach((entry) => {
      const date = entry.occurred_on;
      const hours = entry.minutes / 60;
      const projectName = entry.projects?.name || "Onbekend";

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { hours: 0, projects: new Map() });
      }

      const day = dailyMap.get(date)!;
      day.hours += hours;
      day.projects.set(
        projectName,
        (day.projects.get(projectName) || 0) + hours
      );
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        hours: Math.round(data.hours * 10) / 10,
        projects: Array.from(data.projects.entries()).map(
          ([name, hours], idx) => ({
            name,
            hours: Math.round(hours * 10) / 10,
            color: CHART_COLORS[idx % CHART_COLORS.length],
          })
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Project breakdown
    const projectMap = new Map<
      string,
      {
        hours: number;
        amount: number;
        phases: Map<string, { hours: number; name: string }>;
      }
    >();

    filteredEntries.forEach((entry) => {
      const projectId = entry.project_id;
      const projectName = entry.projects?.name || "Onbekend";
      const hours = entry.minutes / 60;
      const project = projects.find((p) => p.id === projectId);
      const rate = project ? project.default_rate_cents / 100 : 75;
      const amount = hours * rate;
      const phaseName = entry.phases?.name || entry.phase_code;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          hours: 0,
          amount: 0,
          phases: new Map(),
        });
      }

      const proj = projectMap.get(projectId)!;
      proj.hours += hours;
      proj.amount += amount;

      if (!proj.phases.has(entry.phase_code)) {
        proj.phases.set(entry.phase_code, { hours: 0, name: phaseName });
      }
      proj.phases.get(entry.phase_code)!.hours += hours;
    });

    const projectData = Array.from(projectMap.entries())
      .map(([id, data]) => {
        const project = projects.find((p) => p.id === id);
        const phases = Array.from(data.phases.entries()).map(
          ([code, phaseData]) => ({
            phase_code: code,
            phase_name: phaseData.name,
            hours: Math.round(phaseData.hours * 10) / 10,
            percentage: Math.round((phaseData.hours / data.hours) * 100),
          })
        );

        return {
          project_id: id,
          project_name: project?.name || "Onbekend",
          total_hours: Math.round(data.hours * 10) / 10,
          total_amount: Math.round(data.amount),
          phases,
          percentage:
            totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
        };
      })
      .sort((a, b) => b.total_hours - a.total_hours);

    return {
      kpis: {
        total_hours: Math.round(totalHours * 10) / 10,
        avg_hours_per_day: Math.round(avgHoursPerDay * 10) / 10,
        total_revenue: Math.round(totalRevenue),
        avg_hourly_rate: Math.round(avgHourlyRate),
      },
      dailyData,
      projectData,
    };
  }, [timeEntries, projects, selectedProject]);

  const isLoading = entriesLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--zeus-bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { kpis, dailyData, projectData } = analytics;
  const filteredProjects =
    selectedProject === "all"
      ? projectData
      : projectData.filter((p) => p.project_id === selectedProject);

  // Format data for charts
  const timeBarData = dailyData.map((d) => ({
    name: formatDate(d.date),
    hours: d.hours,
  }));

  const budgetPieData = projectData.map((p) => ({
    name: p.project_name,
    value: p.total_amount,
    type: "expense", // Just for coloring logic in pie chart
  }));

  const trendLineData = dailyData.map((d) => ({
    period: formatDate(d.date),
    value: d.hours,
  }));

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] text-[var(--zeus-text)]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--zeus-card)] p-6 rounded-2xl border border-[var(--zeus-border)] shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--zeus-primary)] to-transparent opacity-50"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--zeus-text)] tracking-tight mb-1 drop-shadow-[0_2px_10px_var(--zeus-primary-glow)] flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[var(--zeus-primary)]" />
              ANALYTICS <span className="text-[var(--zeus-primary)]">ZEUS-X</span>
            </h1>
            <p className="text-[var(--zeus-text-secondary)] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--zeus-accent)] animate-pulse"></span>
              Inzicht in je tijdsregistratie en productiviteit
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="zeus-button-secondary">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button className="btn-zeus-primary">
              <Download className="w-4 h-4 mr-2" />
              PDF Rapport
            </Button>
          </div>
        </div>

        {/* 🔢 Financieel dashboard (jaarrekeningen) */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Financieel overzicht (jaarrekeningen)
          </h2>
          <FinanceDashboard userId={userId} />
          
<FinanceTaxCockpit userId="1952170a-a2f8-4658-9c03-975677366e65" />
        </div>

        {/* Filters */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--zeus-primary)]" />
              <select
                value={timeRange}
                onChange={(e) =>
                  setTimeRange(
                    e.target.value as "week" | "month" | "quarter" | "custom"
                  )
                }
                className="px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              >
                <option value="week">Deze week</option>
                <option value="month">Deze maand</option>
                <option value="quarter">Dit kwartaal</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[var(--zeus-primary)]" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              >
                <option value="all">Alle projecten</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <ViewToggle
                value={viewType}
                onChange={(val) =>
                  setViewType(val as "chart" | "table")
                }
                options={[
                  {
                    value: "chart",
                    label: "Charts",
                    icon: <BarChart3 className="w-4 h-4" />,
                  },
                  {
                    value: "table",
                    label: "Tabel",
                    icon: <Filter className="w-4 h-4" />,
                  },
                ]}
              />
            </div>
          </div>

          {timeRange === "custom" && (
            <div className="flex gap-4 mt-6 pt-4 border-t border-[var(--zeus-border)]">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
              />
              <span className="text-[var(--zeus-text-secondary)] self-center">
                tot
              </span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="px-4 py-2 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
              />
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Totaal uren"
            value={kpis.total_hours}
            icon={<Clock className="w-6 h-6" />}
          />
          <KPICard
            title="Gem. per dag"
            value={kpis.avg_hours_per_day}
            icon={<Target className="w-6 h-6" />}
          />
          <KPICard
            title="Omzet"
            value={EUR(kpis.total_revenue)}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <KPICard
            title="Gem. tarief"
            value={EUR(kpis.avg_hourly_rate)}
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>

        {timeEntries.length === 0 ? (
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-12 text-center">
            <Clock className="w-16 h-16 text-[var(--zeus-text-secondary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-2">
              Geen data voor deze periode
            </h3>
            <p className="text-[var(--zeus-text-secondary)]">
              Registreer eerst wat uren om analytics te zien
            </p>
          </div>
        ) : viewType === "chart" ? (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Hours Chart */}
              <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-6 border-b border-[var(--zeus-border)] pb-2">
                  Uren per Dag
                </h3>
                <TimeBarChart data={timeBarData} />
              </div>

              {/* Project Distribution */}
              <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-6 border-b border-[var(--zeus-border)] pb-2">
                  Uren per Project
                </h3>
                {projectData.length > 0 ? (
                  <BudgetPieChart data={budgetPieData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-[var(--zeus-text-secondary)]">
                    Geen project data
                  </div>
                )}
              </div>
            </div>

            {/* Productivity Trend */}
            <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-6 border-b border-[var(--zeus-border)] pb-2">
                Productiviteit Trend
              </h3>
              <TrendLineChart data={trendLineData} />
            </div>
          </>
        ) : (
          /* Table View */
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)]">
              <h3 className="text-lg font-semibold text-[var(--zeus-text)]">
                Project Overzicht
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--zeus-border)]">
                    <th className="p-4 text-sm font-semibold text-[var(--zeus-text-secondary)]">
                      Project
                    </th>
                    <th className="p-4 text-sm font-semibold text-[var(--zeus-text-secondary)]">
                      Totaal Uren
                    </th>
                    <th className="p-4 text-sm font-semibold text-[var(--zeus-text-secondary)]">
                      Omzet
                    </th>
                    <th className="p-4 text-sm font-semibold text-[var(--zeus-text-secondary)]">
                      Gem. Tarief
                    </th>
                    <th className="p-4 text-sm font-semibold text-[var(--zeus-text-secondary)]">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--zeus-border)]">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.project_id}
                      className="hover:bg-[var(--zeus-bg-secondary)]/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="text-sm font-medium text-[var(--zeus-text)]">
                          {project.project_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-[var(--zeus-text-secondary)]">
                          {project.total_hours}u
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-[var(--zeus-text-secondary)]">
                          {EUR(project.total_amount)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-[var(--zeus-text-secondary)]">
                          {project.total_hours > 0
                            ? EUR(
                                project.total_amount / project.total_hours
                              )
                            : "-"}
                          /u
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                          {project.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Project Phase Breakdown */}
        {selectedProject !== "all" && filteredProjects[0] && (
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-6 border-b border-[var(--zeus-border)] pb-2">
              Fase Distributie - {filteredProjects[0].project_name}
            </h3>
            <div className="space-y-4">
              {filteredProjects[0].phases.map((phase, index) => (
                <div
                  key={phase.phase_code}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-sm font-medium text-[var(--zeus-text)]">
                      {phase.phase_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-[var(--zeus-bg-secondary)] rounded-full h-2 w-32 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${phase.percentage}%`,
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm text-[var(--zeus-text-secondary)] w-12 text-right">
                      {phase.hours}u
                    </span>
                    <span className="text-sm text-[var(--zeus-text-secondary)] w-8 text-right">
                      {phase.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
