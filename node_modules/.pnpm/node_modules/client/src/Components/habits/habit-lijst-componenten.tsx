import React from "react";
import { CheckCircle2 } from "lucide-react";
import { classNames } from "./basis-componenten";
import type { Habit, HabitLog } from "./types";

export function TodayList({
  habits,
  logs,
  onToggle,
  onOpen
}: {
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habit: Habit) => void;
  onOpen: (habit: Habit) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const byHabitDone = new Map<string, HabitLog | undefined>();
  
  logs
    .filter((l) => l.completed_date === todayStr)
    .forEach((l) => byHabitDone.set(l.habit_id, l));

  const activeHabits = habits
    .filter((h) => h.active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (activeHabits.length === 0) {
    return (
      <div className="rounded-2xl border p-6 text-center text-muted-foreground">
        Nog geen actieve habits. Maak je eerste habit aan!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-3 md:p-4">
      <div className="grid gap-2">
        {activeHabits.map((h) => {
          const done = !!byHabitDone.get(h.id);
          
          return (
            <div
              key={h.id}
              className={classNames(
                "flex items-center justify-between rounded-xl border px-3 py-2 md:px-4 md:py-3",
                done ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
              )}
            >
              <button 
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => onOpen(h)}
              >
                <span className="text-xl" aria-hidden>
                  {h.icon || "✅"}
                </span>
                <div>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {h.frequency === "daily"
                      ? "Dagelijks"
                      : h.frequency === "weekly"
                      ? `${h.target_count}/week`
                      : `${h.target_count}/maand`}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onToggle(h)}
                className={classNames(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  done
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {done ? "Gedaan" : "Markeer"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}