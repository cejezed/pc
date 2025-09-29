import React from "react";
import { X, Info, BarChart3, LineChart, Edit3, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useHabitStats, useDeleteHabit } from "./hooks";
import { StatCard } from "./basis-componenten";
import type { Habit } from "./types";

export function StatCards({ stats }: { stats: any }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <StatCard
        label="Streak"
        value={`${stats.current_streak} dagen`}
        subtitle={`🏆 Max: ${stats.longest_streak}`}
        icon={<span className="text-orange-500">🔥</span>}
      />
      <StatCard
        label="Deze week"
        value={`${stats.this_week}/7`}
      />
      <StatCard
        label="Completion (30d)"
        value={`${Math.round((stats.completion_rate || 0) * 100)}%`}
      />
    </div>
  );
}

export function HabitDetail({
  habit,
  onClose,
  onEdit
}: {
  habit: Habit;
  onClose: () => void;
  onEdit?: (habit: Habit) => void;
}) {
  const { data: stats } = useHabitStats(habit.id);
  const deleteHabit = useDeleteHabit();

  // Dummy chart data - vervang met echte data van API
  const chartData = Array.from({ length: 12 }).map((_, i) => ({
    name: `W${i + 1}`,
    completed: Math.round(Math.random() * 6) + 1,
  }));

  const handleDelete = async () => {
    if (!confirm(`Weet je zeker dat je "${habit.name}" wilt verwijderen?`)) {
      return;
    }
    
    await deleteHabit.mutateAsync(habit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl" aria-hidden>
              {habit.icon}
            </div>
            <div>
              <div className="text-lg font-semibold">{habit.name}</div>
              {habit.description && (
                <div className="text-xs text-muted-foreground">
                  {habit.description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(habit)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Bewerken"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              title="Verwijderen"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatCards stats={stats} />

        {/* Charts & Analytics */}
        <div className="mt-6 grid gap-4">
          {/* Line chart */}
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Trend (laatste 12 weken)
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart
                  data={chartData}
                  margin={{ top: 5, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={false}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Per week (laatste 12 weken)
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={chartData}
                  margin={{ top: 5, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="completed"
                    fill="#111111"
                    radius={[6, 6, 0, 0]}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <span className="font-medium">Frequentie:</span>{" "}
                {habit.frequency === "daily"
                  ? "Dagelijks"
                  : habit.frequency === "weekly"
                  ? "Wekelijks"
                  : "Maandelijks"}
              </div>
              <div>
                <span className="font-medium">Doel:</span>{" "}
                {habit.target_count} {habit.unit || "keer"}
              </div>
              {habit.reminder_times && habit.reminder_times.length > 0 && (
                <div>
                  <span className="font-medium">Herinneringen:</span>{" "}
                  {habit.reminder_times.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* History placeholder */}
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium mb-2">Recent logboek</div>
            <div className="text-xs text-muted-foreground">
              Hier komt straks een lijst met recente completions + notes
              (via /api/habit-logs voor deze habit)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}