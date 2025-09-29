import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { Clock, CheckCircle2, TrendingUp, Calendar, Target, Zap } from "lucide-react";

// --- Types
type TimeEntry = {
  id: string;
  project_id?: string | null;
  phase_id?: string | null;
  date: string;
  duration_minutes: number;
  description?: string | null;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  created_at: string;
};

// --- Helpers
function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// --- Supabase DAL
async function fetchTimeEntriesThisWeek(): Promise<TimeEntry[]> {
  const from = toISODate(startOfWeek());
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .gte("date", from)
    .order("date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

async function fetchRecentTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

async function fetchRecentTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export default function Dashboard() {
  const { data: weekEntries = [], isLoading: weekLoading } = useQuery({
    queryKey: ["time-entries", "week"],
    queryFn: fetchTimeEntriesThisWeek,
  });

  const { data: recentEntries = [], isLoading: recentLoading } = useQuery({
    queryKey: ["time-entries", "recent"],
    queryFn: fetchRecentTimeEntries,
  });

  const { data: recentTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "recent"],
    queryFn: fetchRecentTasks,
  });

  const minutesThisWeek = weekEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const hoursThisWeek = Math.round((minutesThisWeek / 60) * 10) / 10;
  const openTasks = recentTasks.filter(t => !t.completed).length;

  const isLoading = weekLoading || recentLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brikx-bg flex items-center justify-center">
        <div className="spinner-brikx"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overzicht van je belangrijkste KPI's en recente activiteit.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Vandaag</div>
              <div className="text-lg font-semibold text-brikx-dark">
                {new Date().toLocaleDateString("nl-NL", { 
                  weekday: "short", 
                  day: "numeric", 
                  month: "short" 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Uren deze week */}
          <div className="card-brikx group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-brikx-teal/10 text-brikx-teal group-hover:bg-brikx-teal group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deze week
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-brikx-dark">{hoursThisWeek}</div>
              <div className="text-sm text-gray-600">uren gewerkt</div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>Op schema</span>
            </div>
          </div>

          {/* Open taken */}
          <div className="card-brikx group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taken
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-brikx-dark">{openTasks}</div>
              <div className="text-sm text-gray-600">nog open</div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <Target className="w-3 h-3" />
              <span>{recentTasks.length} totaal</span>
            </div>
          </div>

          {/* Registraties */}
          <div className="card-brikx group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recent
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-brikx-dark">{recentEntries.length}</div>
              <div className="text-sm text-gray-600">registraties</div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <Zap className="w-3 h-3" />
              <span>Laatste 5</span>
            </div>
          </div>

          {/* Productivity score placeholder */}
          <div className="card-brikx-dark">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-lg bg-white/10">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                Productiviteit
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-sm text-gray-300">deze maand</div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-gray-300">↗ +12% vs vorige maand</div>
            </div>
          </div>
        </div>

        {/* Recent Taken & Uren */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Taken */}
          <div className="card-brikx overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brikx-dark">Laatste taken</h2>
                <span className="text-xs text-gray-500">{recentTasks.length} items</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentTasks.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen taken gevonden</p>
                  <p className="text-xs text-gray-400 mt-1">Maak je eerste taak aan</p>
                </div>
              ) : (
                recentTasks.map((t) => (
                  <div key={t.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${t.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {t.due_date && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(t.due_date).toLocaleDateString("nl-NL", { 
                                day: "numeric", 
                                month: "short" 
                              })}
                            </div>
                          )}
                          <span className={`badge-brikx ${
                            t.priority === "high" ? "bg-red-50 text-red-700" :
                            t.priority === "medium" ? "bg-yellow-50 text-yellow-700" :
                            "bg-gray-50 text-gray-700"
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>
                      <span className={`badge-brikx ${
                        t.completed ? "badge-success" : "bg-amber-50 text-amber-700"
                      }`}>
                        {t.completed ? "✓ Voltooid" : "Open"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Uren */}
          <div className="card-brikx overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brikx-dark">Recente tijdregistraties</h2>
                <span className="text-xs text-gray-500">{recentEntries.length} items</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentEntries.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nog geen tijdregistraties</p>
                  <p className="text-xs text-gray-400 mt-1">Begin met uren registreren</p>
                </div>
              ) : (
                recentEntries.map((e) => (
                  <div key={e.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(e.date).toLocaleDateString("nl-NL", {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                          })}
                        </div>
                        {e.description && (
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {e.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brikx-teal" />
                        <span className="text-gray-900 font-semibold">
                          {Math.round((e.duration_minutes / 60) * 10) / 10}u
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="card-brikx">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Week Progress</h3>
              <div className="flex items-center gap-2">
                <div className="progress-bar-brikx w-48">
                  <div 
                    className="progress-fill-brikx" 
                    style={{ width: `${Math.min((hoursThisWeek / 40) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {hoursThisWeek}/40u
                </span>
              </div>
            </div>
            <button className="btn-brikx-primary">
              + Nieuwe registratie
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}