// src/Components/health/stress-componenten.tsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Brain, Calendar, TrendingDown } from "lucide-react";
import { StatCard, LoadingState, EmptyState } from "./basis-componenten";
import type { DailyMetric } from "../Dashboard/types";

export function StressTab() {
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

  const stats = useMemo(() => {
    if (!metrics.length) return null;

    const last7Days = metrics.filter((m) => {
      const date = new Date(m.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const avgStress = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + (m.stress_niveau || 0), 0) / last7Days.length
      : 0;

    const relaxedDays = last7Days.filter(m => (m.stress_niveau || 0) >= 7).length;
    const highStressDays = last7Days.filter(m => (m.stress_niveau || 0) <= 3).length;

    const sortedByStress = [...metrics]
      .filter(m => m.stress_niveau && m.stress_niveau > 0)
      .sort((a, b) => (b.stress_niveau || 0) - (a.stress_niveau || 0));
    
    const mostRelaxedDay = sortedByStress[0];
    const mostStressedDay = sortedByStress[sortedByStress.length - 1];

    return {
      avgStress,
      relaxedDays,
      highStressDays,
      mostRelaxedDay,
      mostStressedDay,
      totalDays: metrics.length,
    };
  }, [metrics]);

  if (isLoading) return <LoadingState message="Stress data laden..." />;

  if (!metrics.length) {
    return (
      <EmptyState
        icon="🧠"
        title="Nog geen stress data"
        description="Begin met je dagelijkse check-in op het Dashboard om trends te zien"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Gem. Stress (7d)"
          value={stats?.avgStress.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Brain className="h-4 w-4 text-pink-500" />}
          subtitle={getStressLabel(stats?.avgStress || 0)}
        />
        <StatCard
          title="Relaxte Dagen (7d)"
          value={stats?.relaxedDays.toString() || "0"}
          unit="dagen"
          icon={<Brain className="h-4 w-4 text-green-500" />}
          subtitle={stats?.relaxedDays >= 5 ? "Uitstekend!" : "Meer ontspanning nodig"}
        />
        <StatCard
          title="Stressvolle Dagen (7d)"
          value={stats?.highStressDays.toString() || "0"}
          unit="dagen"
          icon={<Brain className="h-4 w-4 text-red-500" />}
          subtitle={stats?.highStressDays === 0 ? "Goed bezig!" : "Let op stress management"}
        />
      </div>

      {/* Insight Cards */}
      {stats && stats.avgStress <= 4 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              ⚠️ Hoog Stress Niveau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-3">
              Je gemiddelde stress is {stats.avgStress.toFixed(1)}/10 (waarbij 10 = zeer relaxed).
              Overweeg deze stress management technieken:
            </p>
            <ul className="text-sm text-red-800 space-y-1 ml-4">
              <li>• Meditatie of ademhalingsoefeningen</li>
              <li>• Regelmatige beweging/sport</li>
              <li>• Voldoende slaap (7-9 uur)</li>
              <li>• Praat met iemand over je stress</li>
              <li>• Plan ontspanningsmomenten in je dag</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {stats && stats.avgStress >= 7 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              ✅ Lage Stress Niveau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              Je gemiddelde stress is laag ({stats.avgStress.toFixed(1)}/10). 
              Blijf je huidige aanpak voor stress management volhouden!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Best/Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.mostRelaxedDay && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                😌 Meest Relaxte Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {new Date(stats.mostRelaxedDay.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-green-800 mt-2">
                Stress: {stats.mostRelaxedDay.stress_niveau}/10 ({getStressLabel(stats.mostRelaxedDay.stress_niveau || 0)})
              </p>
            </CardContent>
          </Card>
        )}

        {stats?.mostStressedDay && (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                😰 Meest Stressvolle Dag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {new Date(stats.mostStressedDay.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-red-800 mt-2">
                Stress: {stats.mostStressedDay.stress_niveau}/10 ({getStressLabel(stats.mostStressedDay.stress_niveau || 0)})
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Laatste 14 Dagen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 14).map((metric) => (
              <StressDayCard key={metric.id} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StressDayCard({ metric }: { metric: DailyMetric }) {
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

  const stress = metric.stress_niveau || 0;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{dateLabel}</p>
        <Badge 
          variant="secondary" 
          className={`text-xs ${
            stress >= 7 ? 'bg-green-100 text-green-700' : 
            stress >= 4 ? 'bg-yellow-100 text-yellow-700' : 
            'bg-red-100 text-red-700'
          }`}
        >
          {getStressEmoji(stress)} {stress}/10
        </Badge>
      </div>
      <span className="text-xs text-gray-600">{getStressLabel(stress)}</span>
    </div>
  );
}

function getStressEmoji(score: number): string {
  if (score >= 8) return "😌";
  if (score >= 6) return "🙂";
  if (score >= 4) return "😐";
  if (score >= 2) return "😰";
  return "😫";
}

function getStressLabel(score: number): string {
  if (score >= 8) return "Zeer relaxed";
  if (score >= 6) return "Relaxed";
  if (score >= 4) return "Gemiddeld";
  if (score >= 2) return "Gestrest";
  return "Zeer gestrest";
}

export default StressTab;