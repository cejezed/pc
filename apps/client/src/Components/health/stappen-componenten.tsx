// src/Components/health/stappen-componenten.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";

// Import from the helpers file (now with complete functions)
import { 
  todayISO, 
  formatDate, 
  formatNumber, 
  stepsGoalStatus,
  stepsGoalColor,
  stepsGoalMessage,
  calculatePercentage,
  getProgressWidth,
  formatDistance,
  estimateCaloriesBurned
} from "./helpers";

// Types
type StepsEntry = {
  id: string;
  date: string;
  steps: number;
  goal: number;
  notes?: string;
};

interface StepsComponentProps {
  entries?: StepsEntry[];
  onAddEntry?: (entry: Omit<StepsEntry, 'id'>) => void;
  onUpdateEntry?: (id: string, entry: Partial<StepsEntry>) => void;
  onDeleteEntry?: (id: string) => void;
}

function StepsComponent({ 
  entries = [], 
  onAddEntry, 
  onUpdateEntry, 
  onDeleteEntry 
}: StepsComponentProps) {
  const [newEntry, setNewEntry] = useState({
    date: todayISO(),
    steps: '',
    goal: '10000',
    notes: ''
  });

  const todayEntry = useMemo(() => {
    return entries.find(entry => entry.date === todayISO());
  }, [entries]);

  const weekEntries = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // Last 7 days
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => e.date === dateStr);
      weekData.push({
        date: dateStr,
        dateObj: date,
        steps: entry?.steps || 0,
        goal: entry?.goal || 10000,
        achieved: entry ? entry.steps >= entry.goal : false
      });
    }
    
    return weekData;
  }, [entries]);

  const stats = useMemo(() => {
    const totalSteps = entries.reduce((sum, entry) => sum + entry.steps, 0);
    const avgSteps = entries.length > 0 ? Math.round(totalSteps / entries.length) : 0;
    const goalsAchieved = entries.filter(entry => entry.steps >= entry.goal).length;
    const achievementRate = entries.length > 0 ? Math.round((goalsAchieved / entries.length) * 100) : 0;
    
    return {
      totalSteps,
      avgSteps,
      goalsAchieved,
      achievementRate
    };
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.steps || !onAddEntry) return;
    
    onAddEntry({
      date: newEntry.date,
      steps: parseInt(newEntry.steps),
      goal: parseInt(newEntry.goal),
      notes: newEntry.notes || undefined
    });
    
    setNewEntry({
      date: todayISO(),
      steps: '',
      goal: '10000',
      notes: ''
    });
  };

  const currentSteps = todayEntry?.steps || 0;
  const currentGoal = todayEntry?.goal || 10000;
  const status = stepsGoalStatus(currentSteps, currentGoal);
  const progress = getProgressWidth(currentSteps, currentGoal);

  return (
    <div className="space-y-6">
      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚶‍♂️ Stappen Vandaag
            <Badge className={stepsGoalColor(status)}>
              {stepsGoalMessage(status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{formatNumber(currentSteps)} stappen</span>
                <span>Doel: {formatNumber(currentGoal)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">
                {calculatePercentage(currentSteps, currentGoal)}%
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {formatDistance(currentSteps)}
                </div>
                <div className="text-sm text-gray-600">Afstand</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {estimateCaloriesBurned(currentSteps)} kcal
                </div>
                <div className="text-sm text-gray-600">Calorieën</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Stappen Toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="steps">Aantal Stappen</Label>
                <Input
                  id="steps"
                  type="number"
                  placeholder="8500"
                  value={newEntry.steps}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, steps: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="goal">Dagdoel</Label>
                <Input
                  id="goal"
                  type="number"
                  placeholder="10000"
                  value={newEntry.goal}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, goal: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notities (optioneel)</Label>
              <Input
                id="notes"
                placeholder="Lange wandeling in het park..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={!newEntry.steps}>
              Stappen Toevoegen
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Week Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Deze Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekEntries.map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {day.dateObj.toLocaleDateString('nl-NL', { weekday: 'short' })}
                </div>
                <div className={`
                  w-full h-16 rounded-lg flex flex-col items-center justify-center text-xs
                  ${day.achieved 
                    ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                    : day.steps > 0 
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                      : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                  }
                `}>
                  <div className="font-semibold">
                    {formatNumber(day.steps / 1000, 1)}k
                  </div>
                  {day.achieved && <div>✅</div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.totalSteps / 1000, 0)}k
              </div>
              <div className="text-sm text-gray-600">Totaal Stappen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.avgSteps / 1000, 1)}k
              </div>
              <div className="text-sm text-gray-600">Gemiddeld per Dag</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.goalsAchieved}
              </div>
              <div className="text-sm text-gray-600">Doelen Behaald</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.achievementRate}%
              </div>
              <div className="text-sm text-gray-600">Slagingspercentage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recente Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((entry) => {
                  const entryStatus = stepsGoalStatus(entry.steps, entry.goal);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {formatDate(entry.date)}
                        </div>
                        <Badge className={stepsGoalColor(entryStatus)}>
                          {formatNumber(entry.steps)} / {formatNumber(entry.goal)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.notes && (
                          <span className="text-xs text-gray-500 max-w-32 truncate">
                            {entry.notes}
                          </span>
                        )}
                        {onDeleteEntry && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Verwijder
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export both named and default
export { StepsComponent as StappenTab };
export default StepsComponent;