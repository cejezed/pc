// src/Components/health/slaap-componenten.tsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Moon, Calendar, TrendingUp } from "lucide-react";
import { StatCard, LoadingState, EmptyState } from "./basis-componenten";
import type { DailyMetric } from "../Dashboard/types";

export function SlaapTab() {
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

    const avgSlaap = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + m.slaap_score, 0) / last7Days.length
      : 0;

    const langWakkerCount = last7Days.filter(m => m.lang_wakker).length;
    const kortWakkerCount = last7Days.filter(m => m.kort_wakker).length;

    const sortedBySlaap = [...metrics].sort((a, b) => b.slaap_score - a.slaap_score);
    const bestNight = sortedBySlaap[0];
    const worstNight = sortedBySlaap[sortedBySlaap.length - 1];

    return {
      avgSlaap,
      langWakkerCount,
      kortWakkerCount,
      bestNight,
      worstNight,
      totalDays: metrics.length,
    };
  }, [metrics]);

  if (isLoading) return <LoadingState message="Slaap data laden..." />;

  if (!metrics.length) {
    return (
      <EmptyState
        icon="😴"
        title="Nog geen slaap data"
        description="Begin met je dagelijkse check-in op het Dashboard om trends te zien"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Gem. Slaap (7d)"
          value={stats?.avgSlaap.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Moon className="h-4 w-4 text-blue-500" />}
          subtitle={getSlaapLabel(stats?.avgSlaap || 0)}
        />
        <StatCard
          title="Lang Wakker (7d)"
          value={stats?.langWakkerCount.toString() || "0"}
          unit="nachten"
          icon={<Moon className="h-4 w-4 text-purple-500" />}
          subtitle={stats?.langWakkerCount === 0 ? "Goed bezig!" : "Probeer te verbeteren"}
        />
        <StatCard
          title="Kort Wakker (7d)"
          value={stats?.kortWakkerCount.toString() || "0"}
          unit="nachten"
          icon={<Moon className="h-4 w-4 text-indigo-500" />}
          subtitle={stats?.kortWakkerCount === 0 ? "Perfect!" : "Lichte verstoring"}
        />
      </div>

      {/* Best/Worst Nights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.bestNight && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                🌙 Beste Nacht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {new Date(stats.bestNight.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-blue-800 mt-2">Slaap: {stats.bestNight.slaap_score}/10</p>
            </CardContent>
          </Card>
        )}

        {stats?.worstNight && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                😴 Slechtste Nacht
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {new Date(stats.worstNight.date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-orange-800 mt-2">Slaap: {stats.worstNight.slaap_score}/10</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Laatste 14 Nachten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 14).map((metric) => (
              <SlaapDayCard key={metric.id} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SlaapDayCard({ metric }: { metric: DailyMetric }) {
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

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{dateLabel}</p>
        <Badge variant="secondary" className="text-xs">
          {getSlaapEmoji(metric.slaap_score)} {metric.slaap_score}/10
        </Badge>
      </div>
      <div className="flex gap-2">
        {metric.lang_wakker && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            🌙 Lang wakker
          </span>
        )}
        {metric.kort_wakker && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
            💤 Kort wakker
          </span>
        )}
      </div>
    </div>
  );
}

function getSlaapEmoji(score: number): string {
  if (score >= 8) return "😴";
  if (score >= 6) return "😊";
  if (score >= 4) return "😐";
  if (score >= 2) return "😕";
  return "😫";
}

function getSlaapLabel(score: number): string {
  if (score >= 8) return "Uitgerust";
  if (score >= 6) return "Goed";
  if (score >= 4) return "Redelijk";
  if (score >= 2) return "Slecht";
  return "Zeer slecht";
}

export default SlaapTab;