import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, CheckSquare, Lightbulb, Zap, Moon, Dumbbell, Trash2, Activity, Brain, Heart, Eye, Pill, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DailyMetric, Task, Idea } from './types';
import { VoiceChat } from '../coach/VoiceChat';
import { QuickMoment } from '../coach/QuickMoment';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  return (
    <div className="min-h-screen bg-zeus-bg text-zeus-text p-4 md:p-8 font-sans selection:bg-zeus-accent/30">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-black text-zeus-primary tracking-tight">
            DASHBOARD
          </h1>
          <button
            onClick={() => setShowVoice(!showVoice)}
            className={`p-4 rounded-full shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all transform hover:scale-105 ${showVoice
              ? 'bg-zeus-accent text-white ring-4 ring-zeus-accent/30'
              : 'bg-zeus-card text-zeus-accent border border-zeus-accent hover:bg-zeus-accent hover:text-white'
              }`}
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>

        {/* Voice Chat Overlay */}
        {showVoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl relative">
              <button
                onClick={() => setShowVoice(false)}
                className="absolute -top-12 right-0 text-zeus-text hover:text-zeus-accent transition-colors font-medium"
              >
                Sluiten [ESC]
              </button>
              <VoiceChat />
            </div>
          </div>
        )}

        {/* Pending Affirmation */}
        {pendingAffirmation && (
          <div className="bg-gradient-to-r from-zeus-card to-zeus-bg border border-zeus-accent/30 rounded-xl p-6 text-white shadow-[0_0_15px_rgba(255,107,0,0.1)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-zeus-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-zeus-accent animate-pulse" />
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white tracking-wide">
                    Jouw dagelijkse affirmatie
                    {new Date().getHours() >= 20 && (
                      <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-1 rounded font-semibold">
                        Laatste kans vandaag!
                      </span>
                    )}
                  </h3>
                </div>
                <p className="text-xl mb-6 text-zeus-text italic font-light leading-relaxed">
                  "{pendingAffirmation.statement}"
                </p>
                <button
                  onClick={() => window.location.hash = '#affirmaties'}
                  className="bg-zeus-accent text-white hover:bg-zeus-accent/80 px-6 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(255,107,0,0.3)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)] transform hover:-translate-y-0.5"
                >
                  Start Ritueel Nu
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Quick Capture & Tasks */}
          <div className="md:col-span-2 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tasks */}
              <div className="bg-zeus-card rounded-xl border border-zeus-accent/20 p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zeus-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-lg font-bold text-zeus-primary flex items-center gap-2 tracking-wide">
                    <CheckSquare className="w-5 h-5 text-zeus-accent" />
                    Taken
                  </h3>
                  <span className="text-xs font-mono text-zeus-accent bg-zeus-accent/10 px-2 py-1 rounded border border-zeus-accent/20">
                    {tasks.filter(t => t.status === 'done').length}/{tasks.length}
                  </span>
                </div>

                <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.filter(t => t.status !== 'done').map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 hover:bg-zeus-bg rounded-lg transition-all group border border-transparent hover:border-zeus-accent/10"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => toggleTask.mutate({ id: task.id, status: task.status })}
                        className="w-5 h-5 text-zeus-accent bg-zeus-bg border-zeus-border rounded focus:ring-zeus-accent focus:ring-offset-0 transition-all cursor-pointer"
                      />
                      <span className={`flex-1 text-sm font-medium transition-colors ${task.status === 'done' ? 'line-through text-zeus-text-secondary' : 'text-zeus-text group-hover:text-zeus-primary'
                        }`}>
                        {task.title}
                      </span>
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-zeus-accent hover:text-red-500 transition-all p-2 hover:bg-zeus-accent/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-sm text-zeus-text/50 text-center py-8 italic">Geen taken. Tijd voor actie?</p>
                  )}
                </div>

                <div className="flex gap-3 relative z-10">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && newTask.trim() && addTask.mutate(newTask)}
                    placeholder="Nieuwe taak..."
                    className="flex-1 bg-zeus-bg border border-zeus-border rounded-lg px-4 py-3 text-sm text-zeus-text placeholder-zeus-text-secondary focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    onClick={() => newTask.trim() && addTask.mutate(newTask)}
                    disabled={!newTask.trim()}
                    className="bg-zeus-accent hover:bg-zeus-accent/80 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,107,0,0.2)] hover:shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Ideas */}
              <div className="bg-zeus-card rounded-xl border border-zeus-accent/20 p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zeus-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-lg font-bold text-zeus-primary flex items-center gap-2 tracking-wide">
                    <Lightbulb className="w-5 h-5 text-zeus-accent" />
                    Ideeën
                  </h3>
                  <span className="text-xs font-mono text-zeus-accent bg-zeus-accent/10 px-2 py-1 rounded border border-zeus-accent/20">{ideas.length}</span>
                </div>

                <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {ideas.map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-start gap-3 p-3 hover:bg-zeus-bg rounded-lg transition-all group border border-transparent hover:border-zeus-accent/10"
                    >
                      <span className="text-zeus-accent mt-0.5 shrink-0">💡</span>
                      <span className="flex-1 text-sm text-zeus-text font-medium group-hover:text-zeus-primary transition-colors">{idea.title}</span>
                      <button
                        onClick={() => deleteIdea.mutate(idea.id)}
                        className="opacity-0 group-hover:opacity-100 text-zeus-accent hover:text-red-500 transition-all p-2 hover:bg-zeus-accent/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {ideas.length === 0 && (
                    <p className="text-sm text-zeus-text/50 text-center py-8 italic">Geen ideeën. Laat je creativiteit stromen!</p>
                  )}
                </div>

                <div className="flex gap-3 relative z-10">
                  <input
                    type="text"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && newIdea.trim() && addIdea.mutate(newIdea)}
                    placeholder="Nieuw idee..."
                    className="flex-1 bg-zeus-bg border border-zeus-border rounded-lg px-4 py-3 text-sm text-zeus-text placeholder-zeus-text-secondary focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    onClick={() => newIdea.trim() && addIdea.mutate(newIdea)}
                    disabled={!newIdea.trim()}
                    className="bg-zeus-accent hover:bg-zeus-accent/80 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,107,0,0.2)] hover:shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <QuickMoment />

          </div>

          {/* Right Column - Daily Check-in */}
          <div className="space-y-6">
            <div className="bg-zeus-card rounded-xl border border-zeus-accent/20 p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-zeus-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <h3 className="text-lg font-bold text-zeus-primary mb-6 relative z-10 tracking-wide border-b border-zeus-border pb-2">
                Dagelijkse Check-in
              </h3>

              <div className="space-y-6 relative z-10">
                {/* Energie & Slaap Scores */}
                <ScoreSelector
                  label="Energie niveau"
                  icon={Zap}
                  iconColor="text-zeus-accent"
                  value={dailyMetrics.energie_score || 0}
                  onChange={(score: number) => setDailyMetrics({ ...dailyMetrics, energie_score: score })}
                  lowLabel="Uitgeput"
                  highLabel="Energiek"
                />

                <ScoreSelector
                  label="Slaap kwaliteit"
                  icon={Moon}
                  iconColor="text-zeus-text-highlight"
                  value={dailyMetrics.slaap_score || 0}
                  onChange={(score: number) => setDailyMetrics({ ...dailyMetrics, slaap_score: score })}
                  lowLabel="Slecht"
                  highLabel="Uitgerust"
                />

                {/* Slaap Tijden */}
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput
                    label="Bedtijd"
                    icon={Moon}
                    iconColor="text-zeus-text"
                    value={dailyMetrics.bedtijd}
                    onChange={(time: string) => setDailyMetrics({ ...dailyMetrics, bedtijd: time })}
                    placeholder="22:00"
                  />
                  <TimeInput
                    label="Wakker tijd"
                    icon={Moon}
                    iconColor="text-zeus-text"
                    value={dailyMetrics.wakker_tijd}
                    onChange={(time: string) => setDailyMetrics({ ...dailyMetrics, wakker_tijd: time })}
                    placeholder="07:00"
                  />
                </div>

                {/* Pijn & Stress Scores */}
                <ScoreSelector
                  label="Schouderpijn"
                  icon={Heart}
                  iconColor="text-red-500"
                  value={dailyMetrics.schouder_pijn || 0}
                  onChange={(score: number) => setDailyMetrics({ ...dailyMetrics, schouder_pijn: score })}
                  lowLabel="Veel pijn"
                  highLabel="Geen pijn"
                />

                <ScoreSelector
                  label="Stress niveau"
                  icon={Brain}
                  iconColor="text-pink-500"
                  value={dailyMetrics.stress_niveau || 0}
                  onChange={(score: number) => setDailyMetrics({ ...dailyMetrics, stress_niveau: score })}
                  lowLabel="Zeer gestrest"
                  highLabel="Zeer relaxed"
                />

                {/* Slaap Details */}
                <div className="space-y-2">
                  <CheckboxItem
                    label="Lang wakker geweest"
                    icon={Moon}
                    iconColor="text-zeus-text"
                    checked={dailyMetrics.lang_wakker || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, lang_wakker: checked })}
                  />
                  <CheckboxItem
                    label="Kort wakker geweest"
                    icon={Moon}
                    iconColor="text-zeus-text"
                    checked={dailyMetrics.kort_wakker || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, kort_wakker: checked })}
                  />
                  <CheckboxItem
                    label="Powernap"
                    icon={Moon}
                    iconColor="text-zeus-text-highlight"
                    checked={dailyMetrics.nap || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, nap: checked })}
                  />
                </div>

                {/* Activiteiten */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zeus-text-secondary mb-3 uppercase tracking-wider text-xs opacity-70">Activiteiten vandaag</p>
                  <CheckboxItem
                    label="Ochtend workout"
                    icon={Dumbbell}
                    iconColor="text-zeus-accent"
                    checked={dailyMetrics.ochtend_workout || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, ochtend_workout: checked })}
                  />
                  <CheckboxItem
                    label="Golfen geoefend"
                    icon={Activity}
                    iconColor="text-green-500"
                    checked={dailyMetrics.golf_oefenen || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, golf_oefenen: checked })}
                  />
                  <CheckboxItem
                    label="Golfen"
                    icon={Activity}
                    iconColor="text-emerald-500"
                    checked={dailyMetrics.golfen || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, golfen: checked })}
                  />
                  <CheckboxItem
                    label="MTB gereden"
                    icon={Activity}
                    iconColor="text-orange-500"
                    checked={dailyMetrics.mtb || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, mtb: checked })}
                  />
                  <CheckboxItem
                    label="Workout gedaan"
                    icon={Dumbbell}
                    iconColor="text-red-500"
                    checked={dailyMetrics.workout_done || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, workout_done: checked })}
                  />
                </div>

                {/* Gezondheid */}
                <div className="space-y-2">
                  <p className="text-sm font-bold text-zeus-text-secondary mb-3 uppercase tracking-wider text-xs opacity-70">Gezondheid</p>
                  <CheckboxItem
                    label="Ogen schoonmaken"
                    icon={Eye}
                    iconColor="text-zeus-text-highlight"
                    checked={dailyMetrics.ogen_schoonmaken || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, ogen_schoonmaken: checked })}
                  />
                  <CheckboxItem
                    label="Oogdruppels"
                    icon={Eye}
                    iconColor="text-blue-500"
                    checked={dailyMetrics.oogdruppels || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, oogdruppels: checked })}
                  />
                  <CheckboxItem
                    label="Allergie medicatie"
                    icon={Pill}
                    iconColor="text-pink-500"
                    checked={dailyMetrics.allergie_medicatie || false}
                    onChange={(checked: boolean) => setDailyMetrics({ ...dailyMetrics, allergie_medicatie: checked })}
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
                  className="w-full bg-zeus-accent hover:bg-zeus-accent/80 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_25px_rgba(255,107,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {saveDailyMetrics.isPending ? 'Opslaan...' : 'Check-in Opslaan'}
                </button>

                {/* Success Message */}
                {todayMetrics && (
                  <div className="bg-zeus-bg border border-green-500/30 rounded-lg p-4 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                    <p className="text-sm text-green-400 font-bold mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Vandaag opgeslagen
                    </p>
                    <div className="text-xs text-zeus-text space-y-1 font-mono">
                      <p>🔋 Energie: {todayMetrics.energie_score}/10</p>
                      <p>😴 Slaap: {todayMetrics.slaap_score}/10</p>
                      {todayMetrics.bedtijd && todayMetrics.wakker_tijd && (
                        <p>🌙 Slaap: {todayMetrics.bedtijd} - {todayMetrics.wakker_tijd}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreSelector({ label, icon: Icon, iconColor, value, onChange, lowLabel, highLabel }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zeus-text flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {label}
        </label>
        <span className="text-lg font-bold text-zeus-primary">{value}/10</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`flex-1 py-2 text-xs font-bold rounded transition-all ${value === num
                ? 'bg-zeus-accent text-white shadow-md'
                : 'bg-zeus-bg text-zeus-text hover:bg-zeus-accent/10 hover:text-zeus-primary border border-zeus-border'
              }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-zeus-text/50 font-mono">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function CheckboxItem({ label, icon: Icon, iconColor, checked, onChange }: any) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${checked
        ? 'bg-zeus-accent/10 border-zeus-accent/30'
        : 'bg-zeus-bg border-zeus-border hover:border-zeus-accent/30'
        }`}
    >
      <div className={`p-2 rounded-full ${checked ? 'bg-zeus-accent/20' : 'bg-zeus-bg'}`}>
        <Icon className={`w-4 h-4 ${checked ? 'text-zeus-accent' : 'text-zeus-text-secondary'}`} />
      </div>
      <span className={`flex-1 text-sm font-medium ${checked ? 'text-zeus-primary' : 'text-zeus-text'}`}>
        {label}
      </span>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked
        ? 'bg-zeus-accent border-zeus-accent'
        : 'border-zeus-text-secondary bg-white'
        }`}>
        {checked && <CheckSquare className="w-3 h-3 text-white" />}
      </div>
    </div>
  );
}

function TimeInput({ label, icon: Icon, iconColor, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zeus-text flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        {label}
      </label>
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zeus-bg border border-zeus-border rounded-lg px-3 py-2 text-sm text-zeus-text focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}
