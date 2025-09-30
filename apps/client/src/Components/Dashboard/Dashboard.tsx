// src/Components/Dashboard/Dashboard.tsx - NO AUTH VERSION
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, CheckSquare, Lightbulb, Zap, Moon, Dumbbell, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type DailyMetric = {
  id: string;
  user_id: string | null;
  date: string;
  energie_score: number;
  slaap_score: number;
  workout_done: boolean;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: string;
  priority: number;
  due_date?: string;
  completed_at?: string;
  created_at: string;
};

type Idea = {
  id: string;
  title: string;
  note?: string;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [dailyMetrics, setDailyMetrics] = useState({
    energie_score: 0,
    slaap_score: 0,
    workout_done: false,
  });

  const [newTask, setNewTask] = useState('');
  const [newIdea, setNewIdea] = useState('');

  // Fetch today's metrics - NO AUTH
  const { data: todayMetrics } = useQuery({
    queryKey: ['daily-metrics', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as DailyMetric | null;
    },
  });

  // Fetch tasks - NO AUTH
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch ideas - NO AUTH
  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Idea[];
    },
  });

  // Fetch pending affirmation - NO AUTH
  const { data: pendingAffirmation } = useQuery({
    queryKey: ['pending-affirmation'],
    queryFn: async () => {
      const { data: affirmations } = await supabase
        .from('affirmations')
        .select('*')
        .eq('active', true);

      if (!affirmations || affirmations.length === 0) return null;

      const { data: todayLogs } = await supabase
        .from('affirmation_logs')
        .select('affirmation_id')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      const completedIds = new Set(todayLogs?.map(l => l.affirmation_id) || []);
      const pending = affirmations.find(a => !completedIds.has(a.id));

      return pending || null;
    },
  });

  // Save daily metrics - NO AUTH
  const saveDailyMetrics = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: null,
        date: today,
        energie_score: dailyMetrics.energie_score,
        slaap_score: dailyMetrics.slaap_score,
        workout_done: dailyMetrics.workout_done,
      };

      if (todayMetrics) {
        const { error } = await supabase
          .from('daily_metrics')
          .update(payload)
          .eq('id', todayMetrics.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_metrics')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-metrics', today] });
    },
  });

  // Add task - NO AUTH
  const addTask = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from('tasks')
        .insert([{ 
          user_id: null, 
          title, 
          status: 'todo',
          priority: 2,
          notes: null
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
    },
  });

  // Toggle task - NO AUTH
  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'done' ? 'todo' : 'done';
      const updateData = {
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task - NO AUTH
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Add idea - NO AUTH
  const addIdea = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from('ideas')
        .insert([{ 
          owner_id: null, 
          title, 
          status: 'open',
          note: null
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setNewIdea('');
    },
  });

  // Delete idea - NO AUTH
  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });

  // Set initial values from today's metrics
  React.useEffect(() => {
    if (todayMetrics) {
      setDailyMetrics({
        energie_score: todayMetrics.energie_score,
        slaap_score: todayMetrics.slaap_score,
        workout_done: todayMetrics.workout_done,
      });
    }
  }, [todayMetrics]);

  const ScoreSelector = ({ 
    label, 
    icon: Icon, 
    iconColor, 
    value, 
    onChange, 
    lowLabel, 
    highLabel 
  }: { 
    label: string; 
    icon: any; 
    iconColor: string; 
    value: number; 
    onChange: (score: number) => void;
    lowLabel: string;
    highLabel: string;
  }) => (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              value === score
                ? 'bg-brikx-teal text-white shadow-lg'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-brikx-dark mb-2">Dashboard</h1>
        <p className="text-gray-600">Goedemorgen! Hier is je dagelijkse overzicht.</p>
      </div>

      {pendingAffirmation && (
        <div className="bg-gradient-to-r from-brikx-teal to-brikx-teal-dark rounded-brikx p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Jouw dagelijkse affirmatie
                  {new Date().getHours() >= 20 && (
                    <span className="text-xs bg-red-500 px-2 py-1 rounded font-semibold">
                      Laatste kans vandaag!
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-lg mb-4 text-white/95">
                "{pendingAffirmation.statement}"
              </p>
              <button
                onClick={() => window.location.hash = '#affirmaties'}
                className="bg-white text-brikx-teal hover:bg-gray-100 px-6 py-2.5 rounded-brikx font-semibold transition-all shadow-lg"
              >
                Start Ritueel Nu
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Tasks */}
          <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brikx-dark flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brikx-teal" />
                Taken
              </h3>
              <span className="text-sm text-gray-500">
                {tasks.filter(t => t.status === 'done').length}/{tasks.length}
              </span>
            </div>

        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
  {tasks.filter(t => t.status !== 'done').slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={() => toggleTask.mutate({ id: task.id, status: task.status })}
                    className="w-4 h-4 text-brikx-teal rounded focus:ring-2 focus:ring-brikx-teal shrink-0"
                  />
                  <span className={`flex-1 text-sm font-medium ${
                    task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Geen taken. Voeg er een toe!</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && newTask.trim() && addTask.mutate(newTask)}
                placeholder="Nieuwe taak..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brikx-teal"
              />
              <button
                onClick={() => newTask.trim() && addTask.mutate(newTask)}
                disabled={!newTask.trim()}
                className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-4 py-2 rounded-lg transition-all disabled:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ideas */}
          <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brikx-dark flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Ideeen
              </h3>
              <span className="text-sm text-gray-500">{ideas.length}</span>
            </div>

            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
              {ideas.slice(0, 6).map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <span className="text-yellow-500 mt-0.5 shrink-0">💡</span>
                  <span className="flex-1 text-sm text-gray-900 font-medium">{idea.title}</span>
                  <button
                    onClick={() => deleteIdea.mutate(idea.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {ideas.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Geen ideeen. Voeg er een toe!</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && newIdea.trim() && addIdea.mutate(newIdea)}
                placeholder="Nieuw idee..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={() => newIdea.trim() && addIdea.mutate(newIdea)}
                disabled={!newIdea.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all disabled:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Daily Check-in */}
        <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brikx-dark mb-6">
            Dagelijkse Check-in
          </h3>

          <div className="space-y-6">
            <ScoreSelector
              label="Energie niveau"
              icon={Zap}
              iconColor="text-orange-500"
              value={dailyMetrics.energie_score}
              onChange={(score) => setDailyMetrics({ ...dailyMetrics, energie_score: score })}
              lowLabel="Uitgeput"
              highLabel="Energiek"
            />

            <ScoreSelector
              label="Slaap kwaliteit"
              icon={Moon}
              iconColor="text-blue-500"
              value={dailyMetrics.slaap_score}
              onChange={(score) => setDailyMetrics({ ...dailyMetrics, slaap_score: score })}
              lowLabel="Slecht geslapen"
              highLabel="Uitgerust"
            />

            <div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-brikx-teal transition-colors">
                <input
                  type="checkbox"
                  checked={dailyMetrics.workout_done}
                  onChange={(e) => setDailyMetrics({ ...dailyMetrics, workout_done: e.target.checked })}
                  className="w-5 h-5 text-brikx-teal rounded focus:ring-2 focus:ring-brikx-teal"
                />
                <Dumbbell className="w-5 h-5 text-purple-500" />
                <span className="flex-1 font-medium text-gray-900">
                  Workout gedaan vandaag
                </span>
              </label>
            </div>

            <button
              onClick={() => saveDailyMetrics.mutate()}
              disabled={dailyMetrics.energie_score === 0 || dailyMetrics.slaap_score === 0 || saveDailyMetrics.isPending}
              className="w-full bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-3 rounded-brikx font-semibold transition-all shadow-brikx disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saveDailyMetrics.isPending ? 'Opslaan...' : 'Check-in Opslaan'}
            </button>

            {todayMetrics && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Vandaag opgeslagen:</strong> {todayMetrics.energie_score}/10 energie, {todayMetrics.slaap_score}/10 slaap
                  {todayMetrics.workout_done && ', workout ✓'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}