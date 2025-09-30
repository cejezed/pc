import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Dumbbell, Plus, Trash2, Clock } from "lucide-react";
import { useWorkouts } from "./hooks";
import { formatDateTime } from "./helpers";
import {
  StatCard,
  LoadingState,
  EmptyState,
  DateHeader,
  IntensityBadge,
} from "./basis-componenten";
import type { Workout } from "./hooks";

export function WorkoutsTab() {
  const { workouts, isLoading, addWorkout, deleteWorkout } = useWorkouts();
  const [showModal, setShowModal] = useState(false);

  // Laatste 7 dagen
  const last7Days = useMemo(() => {
    if (!workouts) return [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return workouts.filter((w: Workout) => new Date(w.logged_at) >= weekAgo);
  }, [workouts]);

  const totalWorkouts = last7Days.length;

  const totalMinutes = useMemo(() => {
    return last7Days.reduce((sum: number, w: Workout) => sum + (w.duration_minutes ?? 0), 0);
  }, [last7Days]);

  const avgIntensity = useMemo(() => {
    const withIntensity = last7Days.filter((w: Workout) => w.intensity_level != null);
    if (!withIntensity.length) return 0;
    const sum = withIntensity.reduce((s: number, w: Workout) => s + (w.intensity_level ?? 0), 0);
    return sum / withIntensity.length;
  }, [last7Days]);

  // Groeperen per datum
  const { grouped, sortedDates } = useMemo(() => {
    const acc: Record<string, Workout[]> = {};
    (workouts ?? []).forEach((w: Workout) => {
      const date = (w.logged_at ?? "").split("T")[0] || "onbekend";
      (acc[date] ||= []).push(w);
    });
    const dates = Object.keys(acc).sort((a, b) => b.localeCompare(a));
    return { grouped: acc, sortedDates: dates };
  }, [workouts]);

  if (isLoading) return <LoadingState message="Workouts laden..." />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Workouts (7d)"
          value={totalWorkouts}
          icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Totaal minuten (7d)"
          value={totalMinutes}
          unit="min"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Gem. intensiteit"
          value={avgIntensity ? avgIntensity.toFixed(1) : "-"}
          subtitle={avgIntensity ? `~${Math.round(avgIntensity)}/5` : "Nog geen data"}
        />
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowModal(true)} className="w-full md:w-auto">
        <Plus className="w-4 h-4 mr-2" /> Workout toevoegen
      </Button>

      {/* Lijst */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon="🏋️"
          title="Nog geen workouts gelogd"
          description="Voeg je eerste training toe om voortgang te zien."
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Eerste workout
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <DateHeader date={date} />
              <div className="grid gap-3">
                {grouped[date]
                  .sort(
                    (a: Workout, b: Workout) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
                  )
                  .map((w: Workout) => (
                    <WorkoutCard
                      key={w.id}
                      workout={w}
                      onDelete={() => deleteWorkout.mutate(w.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AddWorkoutModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={(data) => {
          addWorkout.mutate(data);
          setShowModal(false);
        }}
      />
    </div>
  );
}

function WorkoutCard({ workout, onDelete }: { workout: Workout; onDelete: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <div>
              <CardTitle className="text-base">
                {workout.title || workout.workout_type || "Workout"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(workout.logged_at)}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Verwijder workout"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {workout.duration_minutes != null && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {workout.duration_minutes} min
            </div>
          )}
          {workout.intensity_level != null && (
            <IntensityBadge level={Math.min(5, Math.max(1, workout.intensity_level)) as 1 | 2 | 3 | 4 | 5} />
          )}
          {workout.workout_type && (
            <span className="text-muted-foreground capitalize">{workout.workout_type}</span>
          )}
        </div>
        {workout.notes && (
          <p className="text-sm text-muted-foreground pt-2">{workout.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AddWorkoutModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Workout>) => void;
}) {
  // ✅ Controlled states
  const [workoutType, setWorkoutType] =
    useState<"cardio" | "strength" | "flexibility" | "sports" | "other">("other");
  const [intensity, setIntensity] = useState<number>(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🏋️ Workout toevoegen</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);

            onSubmit({
              workout_type: workoutType,
              title: String(fd.get("title") || ""),
              duration_minutes: Number(fd.get("duration_minutes")) || undefined,
              intensity_level: Math.min(5, Math.max(1, intensity)) as 1 | 2 | 3 | 4 | 5,
              notes: String(fd.get("notes") || ""),
              logged_at: new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="workout_type" value={workoutType} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={workoutType} onValueChange={(v) => setWorkoutType(v as "cardio" | "strength" | "flexibility" | "sports" | "other")}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardio">🏃 Cardio</SelectItem>
                  <SelectItem value="strength">💪 Kracht</SelectItem>
                  <SelectItem value="flexibility">🧘 Flexibiliteit</SelectItem>
                  <SelectItem value="sports">⚽ Sport</SelectItem>
                  <SelectItem value="other">🏋️ Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titel</Label>
              <Input name="title" placeholder="Bijv. Push/Pull/Legs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duur (min)</Label>
              <Input type="number" name="duration_minutes" placeholder="45" />
            </div>

            <div className="space-y-2">
              <Label>Intensiteit: {intensity}/5</Label>
              <input
                type="range"
                min={1}
                max={5}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notities</Label>
            <Textarea name="notes" placeholder="Opmerkingen over de training..." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit">Opslaan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}