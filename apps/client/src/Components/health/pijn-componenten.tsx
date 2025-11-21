// src/Components/health/pijn-componenten.tsx
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Heart, Calendar } from "lucide-react";
import { StatCard, LoadingState, EmptyState } from "./basis-componenten";
import type { DailyMetric } from "../Dashboard/types";

export function PijnTab() {
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

    const avgPijn = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + (m.schouder_pijn || 0), 0) / last7Days.length
      : 0;

    const pijnFreeDays = last7Days.filter(m => (m.schouder_pijn || 0) >= 8).length;
    const highPainDays = last7Days.filter(m => (m.schouder_pijn || 0) <= 3).length;

    const sortedByPain = [...metrics]
      .filter(m => m.schouder_pijn && m.schouder_pijn > 0)
      .sort((a, b) => (a.schouder_pijn || 0) - (b.schouder_pijn || 0));

    const worstDay = sortedByPain[0] || null;
    const bestDay = sortedByPain[sortedByPain.length - 1] || null;

    return {
      avgPijn,
      pijnFreeDays,
      highPainDays,
      worstDay,
      bestDay,
      totalDays: metrics.length,
    };
  }, [metrics]);

  if (isLoading) return <LoadingState message="Pijn data laden..." />;

  if (!metrics.length) {
    return (
      <EmptyState
        icon="💪"
        title="Nog geen pijn data"
        description="Begin met je dagelijkse check-in op het Dashboard om trends te zien"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Gem. Schouderpijn (7d)"
          value={stats?.avgPijn.toFixed(1) || "0"}
          unit="/ 10"
          icon={<Heart className="h-4 w-4 text-red-500" />}
          subtitle={getPainLabel(stats?.avgPijn || 0)}
        />
        <StatCard
          title="Pijnvrije Dagen (7d)"
          value={(stats?.pijnFreeDays || 0).toString()}
          unit="dagen"
          icon={<Heart className="h-4 w-4 text-green-500" />}
          subtitle={(stats?.pijnFreeDays || 0) === 7 ? "Perfect!" : "Blijf werken eraan"}
        />
        <StatCard
          title="Hoge Pijn Dagen (7d)"
          value={(stats?.highPainDays || 0).toString()}
          unit="dagen"
          icon={<Heart className="h-4 w-4 text-orange-500" />}
          subtitle={(stats?.highPainDays || 0) === 0 ? "Uitstekend!" : "Let op rust"}
        />
      </div>

      {stats && stats.avgPijn < 5 && (
        <Card className="bg-red-900/20 border-red-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              ⚠️ Let Op: Hoge Pijn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-300">
              Je gemiddelde schouderpijn is {stats.avgPijn.toFixed(1)}/10 (waarbij 10 = geen pijn).
              Overweeg rust, fysiotherapie of medisch advies.
            </p>
          </CardContent>
        </Card>
      )}

      {stats && stats.avgPijn >= 8 && (
        <Card className="bg-green-900/20 border-green-800/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-400">
              ✅ Goed Bezig!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-300">
              Je gemiddelde schouderpijn is laag ({stats.avgPijn.toFixed(1)}/10). Blijf je huidige aanpak volhouden!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.bestDay && (
          <Card className="bg-green-900/20 border-green-800/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                ✅ Minste Pijn
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
              <p className="text-xs text-green-300 mt-2">
                Pijn: {stats.bestDay.schouder_pijn}/10 ({getPainLabel(stats.bestDay.schouder_pijn || 0)})
              </p>
            </CardContent>
          </Card>
        )}

        {stats?.worstDay && (
          <Card className="bg-red-900/20 border-red-800/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                ⚠️ Meeste Pijn
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
              <p className="text-xs text-red-300 mt-2">
                Pijn: {stats.worstDay.schouder_pijn}/10 ({getPainLabel(stats.worstDay.schouder_pijn || 0)})
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
              <PijnDayCard key={metric.id} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PijnDayCard({ metric }: { metric: DailyMetric }) {
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

  const pijn = metric.schouder_pijn || 0;

  return (
    <div className="flex items-center justify-between p-3 bg-[var(--zeus-bg-secondary)] rounded-lg hover:bg-[var(--zeus-card-hover)] transition-colors border border-[var(--zeus-border)]">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-[var(--zeus-text)]">{dateLabel}</p>
        <Badge
          variant="secondary"
          className={`text-xs border ${pijn >= 8 ? 'bg-green-900/20 text-green-400 border-green-800/50' :
              pijn >= 5 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50' :
                'bg-red-900/20 text-red-400 border-red-800/50'
            }`}
        >
          {getPainEmoji(pijn)} {pijn}/10
        </Badge>
      </div>
      <span className="text-xs text-[var(--zeus-text-secondary)]">{getPainLabel(pijn)}</span>
    </div>
  );
}

function getPainEmoji(score: number): string {
  if (score >= 8) return "✅";
  if (score >= 5) return "😐";
  if (score >= 3) return "😕";
  return "😣";
}

function getPainLabel(score: number): string {
  if (score >= 9) return "Geen pijn";
  if (score >= 7) return "Lichte pijn";
  if (score >= 5) return "Matige pijn";
  if (score >= 3) return "Behoorlijke pijn";
  return "Veel pijn";
}

export default PijnTab;