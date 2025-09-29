import React, { useState } from "react";
import { 
  useHabits, 
  useHabitLogs, 
  useLogCompletion,
  useEmojiConfetti,
  todayISO 
} from "./hooks";
import { Header, ConfettiOverlay, StatCard } from "./basis-componenten";
import { TodayList } from "./habit-lijst-componenten";
import { Heatmap, MonthSwitcher } from "./heatmap-componenten";
import { HabitModal } from "./habit-modal-componenten";
import { HabitDetail } from "./habit-detail-componenten";
import { Flame } from "lucide-react";
import type { Habit } from "./types";

export default function HabitsPage() {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { show, burst } = useEmojiConfetti();
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(viewMonth);
  const logCompletion = useLogCompletion();

  const todayStr = todayISO();

  const onToggle = async (h: Habit) => {
    const already = logs.find(
      (l) => l.habit_id === h.id && l.completed_date === todayStr
    );
    if (already) return; // Already done
    
    await logCompletion.mutateAsync({
      habit_id: h.id,
      completed_date: todayStr
    });
    
    burst(); // Confetti celebration
  };

  const onPrevMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  };

  const onNextMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  };

  const activeHabitsCount = habits.filter((h) => h.active).length;
  const thisMonthLogs = logs.filter(
    (l) => l.completed_date.slice(0, 7) === todayISO().slice(0, 7)
  ).length;

  return (
    <div className="max-w-5xl mx-auto p-3 md:p-6">
      <Header onNew={() => setShowCreateModal(true)} />
      
      <ConfettiOverlay show={show} />

      <div className="grid gap-6">
        {/* Today's habits */}
        <TodayList
          habits={habits}
          logs={logs}
          onToggle={onToggle}
          onOpen={setSelectedHabit}
        />

        {/* Month heatmap */}
        <div>
          <MonthSwitcher
            viewMonth={viewMonth}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
          <Heatmap
            viewMonth={viewMonth}
            habits={habits}
            logs={logs}
          />
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="Actieve habits"
            value={activeHabitsCount}
          />
          <StatCard
            label="Logs deze maand"
            value={thisMonthLogs}
          />
          <StatCard
            label="Gemiddelde dagscore"
            value={`${Math.round(
              (logs.length / (habits.length || 1)) * 100
            )}%`}
          />
        </div>
      </div>

      {/* Modals */}
      <HabitModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      {selectedHabit && (
        <HabitDetail
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
        />
      )}
    </div>
  );
}