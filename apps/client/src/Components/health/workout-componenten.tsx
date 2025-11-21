// src/Components/health/workout-componenten.tsx - MET AUTH FIX
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { supabase } from "@/lib/supabase";
import { Plus, Dumbbell, Activity, Calendar, Trash2, X } from "lucide-react";
import { StatCard, LoadingState, EmptyState } from "./basis-componenten";

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';

type Workout = {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  title: string;
  duration_minutes: number;
  intensity_level: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  logged_at: string;
  created_at: string;
};

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: '💪 Kracht',
  cardio: '🏃 Cardio',
  flexibility: '🧘 Flexibiliteit',
  sports: '⚽ Sport',
  other: '🏃 Anders',
};

const INTENSITY_LABELS = {
  1: 'Zeer licht',
  2: 'Licht',
  3: 'Gemiddeld',
  4: 'Zwaar',
  5: 'Zeer zwaar',
};

export function WorkoutTab() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState<Omit<Workout, 'id' | 'created_at' | 'user_id'>>({
    workout_type: 'strength',
    title: '',
    duration_minutes: 60,
    intensity_level: 3,
    notes: '',
    logged_at: new Date().toISOString().slice(0, 16),
  });

  // Fetch workouts
  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data as Workout[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Stats
  const stats = useMemo(() => {
    if (!workouts.length) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = workouts.filter(w => new Date(w.logged_at) >= weekAgo);
    const last30Days = workouts.filter(w => new Date(w.logged_at) >= monthAgo);

    const totalMinutes7d = last7Days.reduce((sum, w) => sum + w.duration_minutes, 0);
    const totalMinutes30d = last30Days.reduce((sum, w) => sum + w.duration_minutes, 0);

    const avgIntensity7d = last7Days.length > 0
      ? last7Days.reduce((sum, w) => sum + w.intensity_level, 0) / last7Days.length
      : 0;

    const typeBreakdown = last30Days.reduce((acc, w) => {
      acc[w.workout_type] = (acc[w.workout_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPopularType = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])[0];

    return {
      workouts7d: last7Days.length,
      workouts30d: last30Days.length,
      totalMinutes7d,
      totalMinutes30d,
      avgIntensity7d,
      avgHours7d: totalMinutes7d / 60,
      avgHours30d: totalMinutes30d / 60,
      mostPopularType: mostPopularType ? mostPopularType[0] as WorkoutType : null,
      mostPopularCount: mostPopularType ? mostPopularType[1] : 0,
    };
  }, [workouts]);

  // ✅ Add workout - MET AUTH
  const addWorkout = useMutation({
    mutationFn: async (workout: Omit<Workout, 'id' | 'created_at' | 'user_id'>) => {
      if (!supabase) throw new Error("Supabase not initialized");

      // ✅ Haal user_id op
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        ...workout,
        user_id: user.id, // ✅ Voeg user_id toe
      };

      const { data, error } = await supabase
        .from('workouts')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as Workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowAddModal(false);
      setNewWorkout({
        workout_type: 'strength',
        title: '',
        duration_minutes: 60,
        intensity_level: 3,
        notes: '',
        logged_at: new Date().toISOString().slice(0, 16),
      });
    },
  });

  // Delete workout
  const deleteWorkout = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  if (isLoading) return <LoadingState message="Workouts laden..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--zeus-text)]">Workouts</h2>
          <p className="text-sm text-[var(--zeus-text-secondary)]">Track je trainingen en prestaties</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="btn-zeus-primary">
          <Plus className="w-4 h-4 mr-2" />
          Workout Toevoegen
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Workouts (7d)"
            value={stats.workouts7d.toString()}
            icon={<Activity className="h-4 w-4 text-green-500" />}
            subtitle={`${stats.workouts30d} deze maand`}
          />
          <StatCard
            title="Trainingstijd (7d)"
            value={stats.avgHours7d.toFixed(1)}
            unit="uur"
            icon={<Calendar className="h-4 w-4 text-blue-500" />}
            subtitle={`${stats.avgHours30d.toFixed(1)} uur deze maand`}
          />
          <StatCard
            title="Gem. Intensiteit (7d)"
            value={stats.avgIntensity7d.toFixed(1)}
            unit="/ 5"
            icon={<Dumbbell className="h-4 w-4 text-orange-500" />}
            subtitle={INTENSITY_LABELS[Math.round(stats.avgIntensity7d) as 1 | 2 | 3 | 4 | 5]}
          />
          <StatCard
            title="Meest Gedaan"
            value={stats.mostPopularType ? WORKOUT_TYPE_LABELS[stats.mostPopularType].split(' ')[1] : '-'}
            icon={<Activity className="h-4 w-4 text-purple-500" />}
            subtitle={`${stats.mostPopularCount}x deze maand`}
          />
        </div>
      )}

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <EmptyState
          icon="💪"
          title="Nog geen workouts gelogd"
          description="Voeg je eerste workout toe om te beginnen met tracken"
        />
      ) : (
        <Card className="zeus-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--zeus-text)]">
              <Activity className="h-5 w-5" />
              Recente Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workouts.slice(0, 20).map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} onDelete={deleteWorkout.mutate} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="zeus-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[var(--zeus-text)]">Nieuwe Workout</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewWorkout({ ...newWorkout, workout_type: type })}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${newWorkout.workout_type === type
                          ? 'border-[var(--zeus-primary)] bg-[var(--zeus-primary)] text-white'
                          : 'border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:border-[var(--zeus-primary)]'
                        }`}
                    >
                      {WORKOUT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  placeholder="Bijv. Strength training"
                  value={newWorkout.title}
                  onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  className="input-zeus"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                  Duur (minuten)
                </label>
                <input
                  type="number"
                  value={newWorkout.duration_minutes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: parseInt(e.target.value) || 0 })}
                  className="input-zeus"
                  min="1"
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Intensiteit: {INTENSITY_LABELS[newWorkout.intensity_level]}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewWorkout({ ...newWorkout, intensity_level: level as 1 | 2 | 3 | 4 | 5 })}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${newWorkout.intensity_level === level
                          ? 'bg-[var(--zeus-primary)] text-white'
                          : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logged at */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                  Datum & Tijd
                </label>
                <input
                  type="datetime-local"
                  value={newWorkout.logged_at}
                  onChange={(e) => setNewWorkout({ ...newWorkout, logged_at: e.target.value })}
                  className="input-zeus"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-1">
                  Notities (optioneel)
                </label>
                <textarea
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  placeholder="Bijv. PR op squats, voelde goed"
                  className="input-zeus"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={() => addWorkout.mutate(newWorkout)}
                disabled={!newWorkout.title.trim() || addWorkout.isPending}
                className="flex-1 btn-zeus-primary"
              >
                {addWorkout.isPending ? 'Toevoegen...' : 'Toevoegen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutCard({ workout, onDelete }: { workout: Workout; onDelete: (id: string) => void }) {
  const date = new Date(workout.logged_at);
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

  const timeLabel = date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-start justify-between p-3 bg-[var(--zeus-bg-secondary)] rounded-lg hover:bg-[var(--zeus-card-hover)] transition-colors group border border-[var(--zeus-border)]">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">{WORKOUT_TYPE_LABELS[workout.workout_type].split(' ')[0]}</span>
          <p className="text-sm font-medium text-[var(--zeus-text)]">{workout.title}</p>
          <Badge variant="secondary" className="text-xs bg-[var(--zeus-card)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]">
            {workout.duration_minutes} min
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--zeus-text-secondary)]">
          <span>📅 {dateLabel} om {timeLabel}</span>
          <span>💪 Intensiteit: {workout.intensity_level}/5</span>
        </div>

        {workout.notes && (
          <p className="mt-2 text-xs text-[var(--zeus-text-secondary)] italic">{workout.notes}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(workout.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default WorkoutTab;