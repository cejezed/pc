import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, Download, Filter, TrendingUp, Clock, DollarSign, Target } from "lucide-react";

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
async function fetchTimeEntries(from?: string, to?: string): Promise<TimeEntry[]> {
  if (!supabase) throw new Error("Supabase not initialized");
  
  let query = supabase
    .from("time_entries")
    .select(`
      *,
      projects(name),
      phases(name)
    `)
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

// Helper functions
const EUR = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
};

const getDateRange = (range: 'week' | 'month' | 'quarter') => {
  const now = new Date();
  const from = new Date(now);
  
  switch (range) {
    case 'week':
      from.setDate(now.getDate() - 7);
      break;
    case 'month':
      from.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      from.setMonth(now.getMonth() - 3);
      break;
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0]
  };
};

const COLORS = ['#2D9CDB', '#27AE60', '#F2C94C', '#E74C3C', '#9B59B6', '#1ABC9C'];

export default function Analytics() {
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [selectedProject, setSelectedProject] = React.useState<string | 'all'>('all');
  const [viewType, setViewType] = React.useState<'chart' | 'table'>('chart');
  const [customRange, setCustomRange] = React.useState({ from: '', to: '' });

  // Get date range
  const dateRange = timeRange === 'custom' 
    ? customRange 
    : getDateRange(timeRange);

  // Fetch data
  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery({
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
    const filteredEntries = selectedProject === 'all'
      ? timeEntries
      : timeEntries.filter(e => e.project_id === selectedProject);

    // Calculate KPIs
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + e.minutes, 0);
    const totalHours = totalMinutes / 60;
    
    // Get unique dates for avg calculation
    const uniqueDates = new Set(filteredEntries.map(e => e.occurred_on));
    const avgHoursPerDay = uniqueDates.size > 0 ? totalHours / uniqueDates.size : 0;

    // Calculate revenue (estimate based on default rate)
    const totalRevenue = filteredEntries.reduce((sum, e) => {
      const project = projects.find(p => p.id === e.project_id);
      const hourlyRate = project ? project.default_rate_cents / 100 : 75;
      return sum + (e.minutes / 60) * hourlyRate;
    }, 0);

    const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Daily breakdown
    const dailyMap = new Map<string, { hours: number; projects: Map<string, number> }>();
    
    filteredEntries.forEach(entry => {
      const date = entry.occurred_on;
      const hours = entry.minutes / 60;
      const projectName = entry.projects?.name || 'Onbekend';
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { hours: 0, projects: new Map() });
      }
      
      const day = dailyMap.get(date)!;
      day.hours += hours;
      day.projects.set(projectName, (day.projects.get(projectName) || 0) + hours);
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        hours: Math.round(data.hours * 10) / 10,
        projects: Array.from(data.projects.entries()).map(([name, hours], idx) => ({
          name,
          hours: Math.round(hours * 10) / 10,
          color: COLORS[idx % COLORS.length]
        }))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Project breakdown
    const projectMap = new Map<string, { 
      hours: number; 
      amount: number; 
      phases: Map<string, { hours: number; name: string }> 
    }>();

    filteredEntries.forEach(entry => {
      const projectId = entry.project_id;
      const projectName = entry.projects?.name || 'Onbekend';
      const hours = entry.minutes / 60;
      const project = projects.find(p => p.id === projectId);
      const rate = project ? project.default_rate_cents / 100 : 75;
      const amount = hours * rate;
      const phaseName = entry.phases?.name || entry.phase_code;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, { 
          hours: 0, 
          amount: 0,
          phases: new Map() 
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

    const projectData = Array.from(projectMap.entries()).map(([id, data]) => {
      const project = projects.find(p => p.id === id);
      const phases = Array.from(data.phases.entries()).map(([code, phaseData]) => ({
        phase_code: code,
        phase_name: phaseData.name,
        hours: Math.round(phaseData.hours * 10) / 10,
        percentage: Math.round((phaseData.hours / data.hours) * 100)
      }));

      return {
        project_id: id,
        project_name: project?.name || 'Onbekend',
        total_hours: Math.round(data.hours * 10) / 10,
        total_amount: Math.round(data.amount),
        phases,
        percentage: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0
      };
    }).sort((a, b) => b.total_hours - a.total_hours);

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
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="spinner-brikx"></div>
      </div>
    );
  }

  const { kpis, dailyData, projectData } = analytics;
  const filteredProjects = selectedProject === 'all' 
    ? projectData 
    : projectData.filter(p => p.project_id === selectedProject);

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Inzicht in je tijdsregistratie en productiviteit
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              className="btn-brikx-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button 
              className="btn-brikx-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF Rapport
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-brikx">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'custom')}
                className="select-brikx"
              >
                <option value="week">Deze week</option>
                <option value="month">Deze maand</option>
                <option value="quarter">Dit kwartaal</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="select-brikx"
              >
                <option value="all">Alle projecten</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewType('chart')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewType === 'chart' 
                    ? 'bg-brikx-teal text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Charts
              </button>
              <button
                onClick={() => setViewType('table')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewType === 'table' 
                    ? 'bg-brikx-teal text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tabel
              </button>
            </div>
          </div>

          {timeRange === 'custom' && (
            <div className="flex gap-4 mt-4">
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                className="input-brikx"
              />
              <span className="text-gray-500 self-center">tot</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                className="input-brikx"
              />
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-brikx">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-brikx-teal/10 text-brikx-teal">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{kpis.total_hours}</div>
            <div className="text-sm text-gray-600">Totaal uren</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{kpis.avg_hours_per_day}</div>
            <div className="text-sm text-gray-600">Gem. per dag</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{EUR(kpis.total_revenue)}</div>
            <div className="text-sm text-gray-600">Omzet</div>
          </div>

          <div className="card-brikx">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brikx-dark">{EUR(kpis.avg_hourly_rate)}</div>
            <div className="text-sm text-gray-600">Gem. tarief</div>
          </div>
        </div>

        {timeEntries.length === 0 ? (
          <div className="card-brikx text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen data voor deze periode
            </h3>
            <p className="text-gray-600">
              Registreer eerst wat uren om analytics te zien
            </p>
          </div>
        ) : viewType === 'chart' ? (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Hours Chart */}
              <div className="card-brikx">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uren per Dag</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                      stroke="#6B7280"
                    />
                    <YAxis fontSize={12} stroke="#6B7280" />
                    <Tooltip 
                      labelFormatter={(label) => formatDate(String(label))}
                      formatter={(value: number) => [`${value}u`, 'Uren']}
                    />
                    <Bar dataKey="hours" fill="#2D9CDB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Project Distribution */}
              <div className="card-brikx">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uren per Project</h3>
                {projectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const entry = projectData[props.index];
                          if (!entry) return '';
                          const projectNameShort = entry.project_name.split(' ')[0];
                          return entry.percentage > 5 ? `${projectNameShort} (${entry.percentage}%)` : '';
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="total_hours"
                      >
                        {projectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}u`, 'Uren']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Geen project data
                  </div>
                )}
              </div>
            </div>

            {/* Productivity Trend */}
            <div className="card-brikx">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productiviteit Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                    stroke="#6B7280"
                  />
                  <YAxis fontSize={12} stroke="#6B7280" />
                  <Tooltip 
                    labelFormatter={(label) => formatDate(String(label))}
                    formatter={(value: number) => [`${value}u`, 'Uren']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#2D9CDB" 
                    strokeWidth={3}
                    dot={{ fill: '#2D9CDB', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          /* Table View */
          <div className="card-brikx overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Project Overzicht</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table-brikx">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Totaal Uren</th>
                    <th>Omzet</th>
                    <th>Gem. Tarief</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.project_id}>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">{project.total_hours}u</div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">{EUR(project.total_amount)}</div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-900">
                          {project.total_hours > 0 ? EUR(project.total_amount / project.total_hours) : '-'}/u
                        </div>
                      </td>
                      <td>
                        <span className="badge-success">
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
        {selectedProject !== 'all' && filteredProjects[0] && (
          <div className="card-brikx">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fase Distributie - {filteredProjects[0].project_name}
            </h3>
            <div className="space-y-4">
              {filteredProjects[0].phases.map((phase, index) => (
                <div key={phase.phase_code} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-900">{phase.phase_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${phase.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{phase.hours}u</span>
                    <span className="text-sm text-gray-500 w-8 text-right">{phase.percentage}%</span>
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