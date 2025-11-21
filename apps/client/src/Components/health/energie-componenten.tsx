// src/Components/health/energie-componenten.tsx - MET daily_metrics DATA
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Zap, Brain, Heart, TrendingUp, Calendar } from "lucide-react";
import { StatCard, LoadingState, EmptyState } from "./basis-componenten";
import type { DailyMetric } from "../Dashboard/types";

export function EnergieTab() {
  // Fetch last 30 days of daily_metrics
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['daily-metrics-history'],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .gte('date', dateStr)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as DailyMetric[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!metrics.length) return null;

    const last7Days = metrics.filter((m) => {
      const date = new Date(m.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const avgEnergie = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + m.energie_score, 0) / last7Days.length
      : 0;

    const avgStress = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + (m.stress_niveau || 0), 0) / last7Days.length
      : 0;

    const avgSchouder = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + (m.schouder_pijn || 0), 0) / last7Days.length
      : 0;

    const avgSlaap = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + m.slaap_score, 0) / last7Days.length
      : 0;

    // Workout days
    const workoutDays = last7Days.filter(m =>
      m.workout_done || m.ochtend_workout || m.golf_oefenen || m.golfen || m.mtb
    ).length;

    // Find best and worst energy days
    const sortedByEnergy = [...metrics].sort((a, b) => b.energie_score - a.energie_score);
    const bestDay = sortedByEnergy[0];
    const worstDay = sortedByEnergy[sortedByEnergy.length - 1];

    return {
      avgEnergie,
      avgStress,
      avgSchouder,
      avgSlaap,
      workoutDays,
      bestDay,
      worstDay,
      totalDays: metrics.length,
      last7Days: last7Days.length,
    };
  }, [metrics]);

  // Correlaties berekenen
  const correlations = useMemo(() => {
    if (!metrics.length) return null;

    const workoutDays = metrics.filter(m =>
      m.workout_done || m.ochtend_workout || m.golf_oefenen || m.golfen || m.mtb
    );
    const noWorkoutDays = metrics.filter(m =>
      !m.workout_done && !m.ochtend_workout && !m.golf_oefenen && !m.golfen && !m.mtb
    );

    const avgEnergieWorkout = workoutDays.length > 0
      ? workoutDays.reduce((sum, m) => sum + m.energie_score, 0) / workoutDays.length
      : 0;

    const avgEnergieNoWorkout = noWorkoutDays.length > 0
      ? noWorkoutDays.reduce((sum, m) => sum + m.energie_score, 0) / noWorkoutDays.length
      : 0;

    const diff = avgEnergieWorkout - avgEnergieNoWorkout;
    const percentDiff = avgEnergieNoWorkout > 0
      ? Math.round((diff / avgEnergieNoWorkout) * 100)
      : 0;

    return {
      avgEnergieWorkout,
      avgEnergieNoWorkout,
      diff,
      percentDiff,
    };
  }, [metrics]);

  if (isLoading) return <LoadingState message="Energie data laden..." />;

  if (!metrics.length) {
    return (
      <EmptyState
        icon="⚡"
        title="Nog geen energie data"
        description="Begin met je dagelijkse check-in op het Dashboard om trends te zien"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gem. Energie (7d)"
          value={stats?.avgEnergie.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Zap className="h-4 w-4 text-orange-500" />}
          subtitle={getEnergyLabel(stats?.avgEnergie || 0)}
        />
        <StatCard
          title="Gem. Slaap (7d)"
          value={stats?.avgSlaap.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          subtitle={getSlaapLabel(stats?.avgSlaap || 0)}
        />
        <StatCard
          title="Gem. Schouderpijn (7d)"
          value={stats?.avgSchouder.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Heart className="h-4 w-4 text-red-500" />}
          subtitle={getPainLabel(stats?.avgSchouder || 0)}
        />
        <StatCard
          title="Gem. Stress (7d)"
          value={stats?.avgStress.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Brain className="h-4 w-4 text-pink-500" />}
          subtitle={getStressLabel(stats?.avgStress || 0)}
        />
      </div>

      {/* Correlatie Insight */}
      {correlations && correlations.avgEnergieWorkout > 0 && (
        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-400">
              💡 Inzicht: Activiteit & Energie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-300">
              Op dagen met workout/activiteit heb je gemiddeld{" "}
              <strong>{correlations.avgEnergieWorkout.toFixed(1)}/10</strong> energie,
              tegenover <strong>{correlations.avgEnergieNoWorkout.toFixed(1)}/10</strong> op
              rustdagen. Dat is{" "}
              <strong className="text-blue-400">
                {correlations.percentDiff > 0 ? "+" : ""}
                {correlations.percentDiff}%
              </strong>{" "}
              {correlations.diff > 0 ? "meer" : "minder"} energie!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Beste & Slechtste Dag */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.bestDay && (
          <Card className="bg-green-900/20 border-green-800/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                🏆 Beste Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-[var(--zeus-text)]">
                {new Date(stats.bestDay.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="mt-2 space-y-1 text-xs text-green-300">
                <p>⚡ Energie: {stats.bestDay.energie_score}/10</p>
                <p>😴 Slaap: {stats.bestDay.slaap_score}/10</p>
                {stats.bestDay.stress_niveau > 0 && (
                  <p>🧠 Stress: {stats.bestDay.stress_niveau}/10</p>
                )}
                {(stats.bestDay.ochtend_workout || stats.bestDay.golf_oefenen ||
                  stats.bestDay.golfen || stats.bestDay.mtb || stats.bestDay.workout_done) && (
                    <p className="font-medium mt-2">
                      Activiteiten:{" "}
                      {[
                        stats.bestDay.ochtend_workout && "Ochtend workout",
                        stats.bestDay.golf_oefenen && "Golf oefenen",
                        stats.bestDay.golfen && "Golfen",
                        stats.bestDay.mtb && "MTB",
                        stats.bestDay.workout_done && "Workout",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.worstDay && (
          <Card className="bg-orange-900/20 border-orange-800/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-orange-400">
                📉 Laagste Energie Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-[var(--zeus-text)]">
                {new Date(stats.worstDay.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="mt-2 space-y-1 text-xs text-orange-300">
                <p>⚡ Energie: {stats.worstDay.energie_score}/10</p>
                <p>😴 Slaap: {stats.worstDay.slaap_score}/10</p>
                {stats.worstDay.stress_niveau > 0 && (
                  <p>🧠 Stress: {stats.worstDay.stress_niveau}/10</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Days List */}
      <Card className="zeus-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--zeus-text)]">
            <Calendar className="h-5 w-5" />
            Laatste 14 Dagen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 14).map((metric) => (
              <DayCard key={metric.id} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DayCard({ metric }: { metric: DailyMetric }) {
  const date = new Date(metric.date);
  const isToday = date.toDateString() === new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  let dateLabel = date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (isToday) dateLabel = "Vandaag";
  if (isYesterday) dateLabel = "Gisteren";

  const activities = [
    metric.ochtend_workout && "🏃 Ochtend",
    metric.golf_oefenen && "🏌️ Golf oefenen",
    metric.golfen && "⛳ Golfen",
    metric.mtb && "🚵 MTB",
    metric.workout_done && "💪 Workout",
  ].filter(Boolean);

  return (
    <div className="flex items-start justify-between p-3 bg-[var(--zeus-bg-secondary)] rounded-lg hover:bg-[var(--zeus-card-hover)] transition-colors border border-[var(--zeus-border)]">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-sm font-medium text-[var(--zeus-text)]">{dateLabel}</p>
          <Badge variant="secondary" className="text-xs bg-[var(--zeus-card)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]">
            {getEnergyEmoji(metric.energie_score)} {metric.energie_score}/10
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--zeus-text-secondary)]">
          <span>😴 Slaap: {metric.slaap_score}/10</span>
          {metric.stress_niveau > 0 && (
            <span>🧠 Stress: {metric.stress_niveau}/10</span>
          )}
          {metric.schouder_pijn > 0 && (
            <span>💪 Pijn: {metric.schouder_pijn}/10</span>
          )}
        </div>

        {activities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activities.map((activity, i) => (
              <span
                key={i}
                className="text-xs bg-green-900/20 text-green-400 border border-green-800/50 px-2 py-0.5 rounded"
              >
                {activity}
              </span>
            ))}
          </div>
        )}

        {(metric.lang_wakker || metric.kort_wakker) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {metric.lang_wakker && (
              <span className="text-xs bg-purple-900/20 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded">
                🌙 Lang wakker
              </span>
            )}
            {metric.kort_wakker && (
              <span className="text-xs bg-indigo-900/20 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded">
                💤 Kort wakker
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getEnergyEmoji(score: number): string {
  if (score >= 8) return "🚀";
  if (score >= 6) return "😊";
  if (score >= 4) return "🙂";
  if (score >= 2) return "😕";
  return "😴";
}

function getEnergyLabel(score: number): string {
  if (score >= 8) return "Uitstekend!";
  if (score >= 6) return "Goed";
  if (score >= 4) return "Gemiddeld";
  if (score >= 2) return "Laag";
  return "Zeer laag";
}

function getSlaapLabel(score: number): string {
  if (score >= 8) return "Uitgerust";
  if (score >= 6) return "Goed";
  if (score >= 4) return "Redelijk";
  if (score >= 2) return "Slecht";
  return "Zeer slecht";
}

function getStressLabel(score: number): string {
  if (score >= 8) return "Zeer relaxed";
  if (score >= 6) return "Relaxed";
  if (score >= 4) return "Gemiddeld";
  if (score >= 2) return "Gestrest";
  return "Zeer gestrest";
}

function getPainLabel(score: number): string {
  if (score >= 8) return "Veel pijn";
  if (score >= 6) return "Behoorlijk";
  if (score >= 4) return "Matig";
  if (score >= 2) return "Licht";
  return "Geen pijn";
}

export default EnergieTab;