import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, CheckSquare, Lightbulb, Zap, Moon, Dumbbell, Trash2, Activity, Brain, Heart, Eye, Pill, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DailyMetric, Task, Idea } from './types';
import { VoiceChat } from '../coach/VoiceChat';
import { QuickMoment } from '../coach/QuickMoment';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [showVoice, setShowVoice] = useState(false);
  const [dailyMetrics, setDailyMetrics] = useState<Partial<DailyMetric>>({
    energie_score: 0,
    slaap_score: 0,
    workout_done: false,
    lang_wakker: false,
    kort_wakker: false,
    nap: false,
    bedtijd: undefined,
    wakker_tijd: undefined,
    ochtend_workout: false,
    golf_oefenen: false,
    golfen: false,
    mtb: false,
    ogen_schoonmaken: false,
    oogdruppels: false,
    allergie_medicatie: false,
    schouder_pijn: 0,
    stress_niveau: 0,
  });

  const [newTask, setNewTask] = useState('');
  const [newIdea, setNewIdea] = useState('');

  // Fetch today's metrics
  const { data: todayMetrics } = useQuery({
    queryKey: ['daily-metrics', today],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as DailyMetric | null;
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Fetch ideas
  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Idea[];
    },
  });

  // Fetch pending affirmation
  const { data: pendingAffirmation } = useQuery({
    queryKey: ['pending-affirmation'],
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

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

  // ✅ Save daily metrics - MET AUTH
  const saveDailyMetrics = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase not initialized");

      // ✅ Haal user op
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id, // ✅ Voeg user_id toe!
        date: today,
        energie_score: dailyMetrics.energie_score || 0,
        slaap_score: dailyMetrics.slaap_score || 0,
        workout_done: dailyMetrics.workout_done || false,
        lang_wakker: dailyMetrics.lang_wakker || false,
        kort_wakker: dailyMetrics.kort_wakker || false,
        nap: dailyMetrics.nap || false,
        bedtijd: dailyMetrics.bedtijd || null,
        wakker_tijd: dailyMetrics.wakker_tijd || null,
        ochtend_workout: dailyMetrics.ochtend_workout || false,
        golf_oefenen: dailyMetrics.golf_oefenen || false,
        golfen: dailyMetrics.golfen || false,
        mtb: dailyMetrics.mtb || false,
        ogen_schoonmaken: dailyMetrics.ogen_schoonmaken || false,
        oogdruppels: dailyMetrics.oogdruppels || false,
        allergie_medicatie: dailyMetrics.allergie_medicatie || false,
        schouder_pijn: dailyMetrics.schouder_pijn || 0,
        stress_niveau: dailyMetrics.stress_niveau || 0,
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

  // ✅ Add task - MET AUTH
  const addTask = useMutation({
    mutationFn: async (title: string) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title,
          status: 'todo',
          priority: 2,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
    },
  });

  // Toggle task
  const toggleTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!supabase) throw new Error("Supabase not initialized");

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

  // Delete task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");

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

  // ✅ Add idea - MET AUTH
  const addIdea = useMutation({
    mutationFn: async (title: string) => {
      if (!supabase) throw new Error("Supabase not initialized");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ideas')
        .insert([{
          user_id: user.id,
          title,
          status: 'open',
          priority: 2,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setNewIdea('');
    },
  });

  // Delete idea
  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error("Supabase not initialized");

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
  useEffect(() => {
    if (todayMetrics) {
      setDailyMetrics({
        energie_score: todayMetrics.energie_score || 0,
        slaap_score: todayMetrics.slaap_score || 0,
        workout_done: todayMetrics.workout_done || false,
        lang_wakker: todayMetrics.lang_wakker || false,
        kort_wakker: todayMetrics.kort_wakker || false,
        nap: todayMetrics.nap || false,
        bedtijd: todayMetrics.bedtijd || undefined,
        wakker_tijd: todayMetrics.wakker_tijd || undefined,
        ochtend_workout: todayMetrics.ochtend_workout || false,
        golf_oefenen: todayMetrics.golf_oefenen || false,
        golfen: todayMetrics.golfen || false,
        mtb: todayMetrics.mtb || false,
        ogen_schoonmaken: todayMetrics.ogen_schoonmaken || false,
        oogdruppels: todayMetrics.oogdruppels || false,
        allergie_medicatie: todayMetrics.allergie_medicatie || false,
        schouder_pijn: todayMetrics.schouder_pijn || 0,
        stress_niveau: todayMetrics.stress_niveau || 0,
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
    icon: React.ComponentType<{ className?: string }>;
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
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${value === score
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

  const CheckboxItem = ({
    label,
    icon: Icon,
    iconColor,
    checked,
    onChange,
  }: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-brikx-teal transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-brikx-teal rounded focus:ring-2 focus:ring-brikx-teal"
      />
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className="flex-1 font-medium text-gray-900">{label}</span>
    </label>
  );

  const TimeInput = ({
    label,
    icon: Icon,
    iconColor,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    value?: string;
    onChange: (time: string) => void;
    placeholder: string;
  }) => (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {label}
      </label>
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-brikx-teal focus:border-brikx-teal transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
      {/* Header with Voice Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-brikx-dark mb-2">Dashboard</h1>
          <p className="text-gray-600">Goedemorgen! Hier is je dagelijkse overzicht.</p>
        </div>
        <button
          onClick={() => setShowVoice(!showVoice)}
          className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${showVoice
            ? 'bg-[#FF6B00] text-white ring-4 ring-[#FF6B00]/30'
            : 'bg-white text-[#FF6B00] border-2 border-[#FF6B00]'
            }`}
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>

      {/* Voice Chat Overlay */}
      {showVoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl relative">
            <button
              onClick={() => setShowVoice(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#FF6B00] transition-colors"
            >
              Sluiten [ESC]
            </button>
            <VoiceChat />
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Capture & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Capture Section */}
          <QuickMoment />

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
              {tasks.filter(t => t.status !== 'done').map((task) => (
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
                  <span className={`flex-1 text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brikx-teal"
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
                Ideeën
              </h3>
              <span className="text-sm text-gray-500">{ideas.length}</span>
            </div>

            <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
              {ideas.map((idea) => (
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
                <p className="text-sm text-gray-500 text-center py-4">Geen ideeën. Voeg er een toe!</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && newIdea.trim() && addIdea.mutate(newIdea)}
                placeholder="Nieuw idee..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
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

        {/* Right Column - Daily Check-in */}
        <div className="space-y-6">
          <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brikx-dark mb-6">
              Dagelijkse Check-in
            </h3>

            <div className="space-y-6">
              {/* Energie & Slaap Scores */}
              <ScoreSelector
                label="Energie niveau"
                icon={Zap}
                iconColor="text-orange-500"
                value={dailyMetrics.energie_score || 0}
                onChange={(score) => setDailyMetrics({ ...dailyMetrics, energie_score: score })}
                lowLabel="Uitgeput"
                highLabel="Energiek"
              />

              <ScoreSelector
                label="Slaap kwaliteit"
                icon={Moon}
                iconColor="text-blue-500"
                value={dailyMetrics.slaap_score || 0}
                onChange={(score) => setDailyMetrics({ ...dailyMetrics, slaap_score: score })}
                lowLabel="Slecht"
                highLabel="Uitgerust"
              />

              {/* Slaap Tijden */}
              <div className="grid grid-cols-2 gap-4">
                <TimeInput
                  label="Bedtijd"
                  icon={Moon}
                  iconColor="text-indigo-500"
                  value={dailyMetrics.bedtijd}
                  onChange={(time) => setDailyMetrics({ ...dailyMetrics, bedtijd: time })}
                  placeholder="22:00"
                />
                <TimeInput
                  label="Wakker tijd"
                  icon={Moon}
                  iconColor="text-amber-500"
                  value={dailyMetrics.wakker_tijd}
                  onChange={(time) => setDailyMetrics({ ...dailyMetrics, wakker_tijd: time })}
                  placeholder="07:00"
                />
              </div>

              {/* Pijn & Stress Scores */}
              <ScoreSelector
                label="Schouderpijn"
                icon={Heart}
                iconColor="text-red-500"
                value={dailyMetrics.schouder_pijn || 0}
                onChange={(score) => setDailyMetrics({ ...dailyMetrics, schouder_pijn: score })}
                lowLabel="Veel pijn"
                highLabel="Geen pijn"
              />

              <ScoreSelector
                label="Stress niveau"
                icon={Brain}
                iconColor="text-pink-500"
                value={dailyMetrics.stress_niveau || 0}
                onChange={(score) => setDailyMetrics({ ...dailyMetrics, stress_niveau: score })}
                lowLabel="Zeer gestrest"
                highLabel="Zeer relaxed"
              />

              {/* Slaap Details */}
              <div className="space-y-2">
                <CheckboxItem
                  label="Lang wakker geweest"
                  icon={Moon}
                  iconColor="text-purple-500"
                  checked={dailyMetrics.lang_wakker || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, lang_wakker: checked })}
                />
                <CheckboxItem
                  label="Kort wakker geweest"
                  icon={Moon}
                  iconColor="text-indigo-500"
                  checked={dailyMetrics.kort_wakker || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, kort_wakker: checked })}
                />
                <CheckboxItem
                  label="Powernap"
                  icon={Moon}
                  iconColor="text-blue-400"
                  checked={dailyMetrics.nap || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, nap: checked })}
                />
              </div>


              {/* Activiteiten */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Activiteiten vandaag</p>
                <CheckboxItem
                  label="Ochtend workout"
                  icon={Dumbbell}
                  iconColor="text-purple-500"
                  checked={dailyMetrics.ochtend_workout || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, ochtend_workout: checked })}
                />
                <CheckboxItem
                  label="Golfen geoefend"
                  icon={Activity}
                  iconColor="text-green-500"
                  checked={dailyMetrics.golf_oefenen || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, golf_oefenen: checked })}
                />
                <CheckboxItem
                  label="Golfen"
                  icon={Activity}
                  iconColor="text-emerald-500"
                  checked={dailyMetrics.golfen || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, golfen: checked })}
                />
                <CheckboxItem
                  label="MTB gereden"
                  icon={Activity}
                  iconColor="text-orange-500"
                  checked={dailyMetrics.mtb || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, mtb: checked })}
                />
                <CheckboxItem
                  label="Workout gedaan"
                  icon={Dumbbell}
                  iconColor="text-red-500"
                  checked={dailyMetrics.workout_done || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, workout_done: checked })}
                />
              </div>

              {/* Gezondheid */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Gezondheid</p>
                <CheckboxItem
                  label="Ogen schoonmaken"
                  icon={Eye}
                  iconColor="text-cyan-500"
                  checked={dailyMetrics.ogen_schoonmaken || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, ogen_schoonmaken: checked })}
                />
                <CheckboxItem
                  label="Oogdruppels"
                  icon={Eye}
                  iconColor="text-blue-600"
                  checked={dailyMetrics.oogdruppels || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, oogdruppels: checked })}
                />
                <CheckboxItem
                  label="Allergie medicatie"
                  icon={Pill}
                  iconColor="text-pink-500"
                  checked={dailyMetrics.allergie_medicatie || false}
                  onChange={(checked) => setDailyMetrics({ ...dailyMetrics, allergie_medicatie: checked })}
                />
              </div>


              {/* Save Button */}
              <button
                onClick={() => saveDailyMetrics.mutate()}
                disabled={
                  (dailyMetrics.energie_score || 0) === 0 ||
                  (dailyMetrics.slaap_score || 0) === 0 ||
                  saveDailyMetrics.isPending
                }
                className="w-full bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-3 rounded-brikx font-semibold transition-all shadow-brikx disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saveDailyMetrics.isPending ? 'Opslaan...' : 'Check-in Opslaan'}
              </button>

              {/* Success Message */}
              {todayMetrics && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✅ Vandaag opgeslagen
                  </p>
                  <div className="text-xs text-green-700 space-y-1">
                    <p>🔋 Energie: {todayMetrics.energie_score}/10</p>
                    <p>😴 Slaap: {todayMetrics.slaap_score}/10</p>
                    {todayMetrics.bedtijd && todayMetrics.wakker_tijd && (
                      <p>🌙 Slaap: {todayMetrics.bedtijd} - {todayMetrics.wakker_tijd}</p>
                    )}
                    {todayMetrics.schouder_pijn > 0 && (
                      <p>💪 Schouderpijn: {todayMetrics.schouder_pijn}/10</p>
                    )}
                    {todayMetrics.stress_niveau > 0 && (
                      <p>🧠 Stress: {todayMetrics.stress_niveau}/10</p>
                    )}
                    <p className="mt-2 font-medium">Activiteiten:</p>
                    <div className="flex flex-wrap gap-2">
                      {todayMetrics.ochtend_workout && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Ochtend workout</span>}
                      {todayMetrics.golf_oefenen && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Golf oefenen</span>}
                      {todayMetrics.golfen && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">Golfen</span>}
                      {todayMetrics.mtb && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">MTB</span>}
                      {todayMetrics.workout_done && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">Workout</span>}
                      {todayMetrics.lang_wakker && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Lang wakker</span>}
                      {todayMetrics.kort_wakker && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">Kort wakker</span>}
                      {todayMetrics.nap && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Powernap</span>}
                      {todayMetrics.ogen_schoonmaken && <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-xs">Ogen schoonmaken</span>}
                      {todayMetrics.oogdruppels && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Oogdruppels</span>}
                      {todayMetrics.allergie_medicatie && <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs">Allergie medicatie</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}