import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthNames, weekDayShort, classNames } from "./basis-componenten";
import { startOfMonth, endOfMonth, fmtDate } from "./hooks";
import type { Habit, HabitLog, HeatmapDay } from "./types";

function computeHeatmap(
  viewMonth: Date,
  logs: HabitLog[],
  habits: Habit[]
): HeatmapDay[] {
  const daysInMonth = endOfMonth(viewMonth).getDate();
  const ratioPerDay: HeatmapDay[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = fmtDate(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    );
    const done = logs.filter((l) => l.completed_date === dateStr).length;
    const activeCount = habits.filter((h) => h.active).length || 1;
    const ratio = done / activeCount;
    
    ratioPerDay.push({ day, count: done, total: activeCount, ratio });
  }
  
  return ratioPerDay;
}

function ratioToColor(ratio: number): string {
  if (ratio >= 1) return "bg-green-700 text-white";
  if (ratio >= 0.8) return "bg-green-600 text-white";
  if (ratio >= 0.6) return "bg-green-500 text-white";
  if (ratio >= 0.4) return "bg-yellow-400 text-black";
  if (ratio > 0) return "bg-orange-400 text-black";
  return "bg-gray-200 text-gray-500";
}

export function MonthSwitcher({
  viewMonth,
  onPrevMonth,
  onNextMonth
}: {
  viewMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button
        className="p-2 rounded-lg hover:bg-gray-100"
        onClick={onPrevMonth}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-sm font-medium">
        {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
      </div>
      
      <button
        className="p-2 rounded-lg hover:bg-gray-100"
        onClick={onNextMonth}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export function Heatmap({
  viewMonth,
  habits,
  logs
}: {
  viewMonth: Date;
  habits: Habit[];
  logs: HabitLog[];
}) {
  const data = useMemo(
    () => computeHeatmap(viewMonth, logs, habits),
    [viewMonth, logs, habits]
  );

  const start = startOfMonth(viewMonth);
  const days = endOfMonth(viewMonth).getDate();
  
  // Build week rows
  const rows: number[][] = [];
  let row: number[] = [];
  
  // Start offset (Monday = 0)
  const startOffset = (start.getDay() + 6) % 7;
  for (let i = 0; i < startOffset; i++) row.push(-1);
  
  for (let d = 1; d <= days; d++) {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  
  if (row.length) {
    while (row.length < 7) row.push(-1);
    rows.push(row);
  }

  const legend = [
    { label: "100%", class: "bg-green-700" },
    { label: "80%", class: "bg-green-500" },
    { label: "60%", class: "bg-yellow-400" },
    { label: "<60%", class: "bg-orange-400" },
    { label: "0%", class: "bg-gray-200" }
  ];

  return (
    <div className="rounded-2xl border p-3 md:p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
        {weekDayShort.slice(1).concat(weekDayShort[0]).map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid gap-1">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {r.map((d, j) => {
              if (d === -1) {
                return (
                  <div
                    key={j}
                    className="h-7 rounded-md bg-transparent"
                  />
                );
              }

              const item = data[d - 1];
              const ratio = item?.ratio ?? 0;
              const cls = ratioToColor(ratio);

              return (
                <div
                  key={j}
                  className={classNames(
                    "h-7 rounded-md flex items-center justify-center cursor-pointer",
                    cls
                  )}
                  title={`${d}: ${Math.round(ratio * 100)}%`}
                >
                  <span className="text-[10px] font-medium">{d}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1 text-xs">
            <span
              className={classNames(
                "inline-block w-3 h-3 rounded",
                l.class
              )}
            />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
