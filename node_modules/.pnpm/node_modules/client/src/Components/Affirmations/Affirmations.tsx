// src/components/Affirmations.tsx - DEEL 1
import React from "react";
import {
  Plus,
  X,
  Play,
  Trash2,
  Award,
  Target,
  TrendingUp,
  Clock,
  Star,
  Mic,
  Pause,
  Volume2,
} from "lucide-react";
import {
  useAffirmations,
  useAffirmationStats,
  useTodayLogs,
  useCreateAffirmation,
  useLogAffirmation,
  useDeleteAffirmation,
} from "./hooks";
import { CATEGORY_ICONS, CATEGORY_COLORS, TEMPLATES } from "./types";

// ✅ Missing type definition
type AffirmationFormData = {
  statement: string;
  category: "financial" | "health" | "personal" | "business";
  times_per_day: number;
  reminder_times: string[];
  linked_goal_id?: string;
};

export default function Affirmations() {
  // Data fetching
  const { data: affirmations = [], isLoading: affirmationsLoading } = useAffirmations();
  const { data: stats } = useAffirmationStats();
  const { data: todayLogs = [] } = useTodayLogs();

  // Mutations
  const createAffirmation = useCreateAffirmation();
  const logAffirmation = useLogAffirmation();
  const deleteAffirmation = useDeleteAffirmation();

  // State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showRitualModal, setShowRitualModal] = React.useState(false);
  const [ritualStep, setRitualStep] = React.useState(0); // 0-5 steps
  const [selectedAffirmation, setSelectedAffirmation] = React.useState<any>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [emotionalIntensity, setEmotionalIntensity] = React.useState(3);
  const [visualizationTime, setVisualizationTime] = React.useState(30);
  const [commitmentNote, setCommitmentNote] = React.useState("");

  const [form, setForm] = React.useState<AffirmationFormData>({
    statement: "",
    category: "financial",
    times_per_day: 2,
    reminder_times: ["07:00", "12:00"],
    linked_goal_id: "",
  });

  // Computed values
  const completedToday = React.useMemo(() => {
    return new Set(todayLogs.map((log) => log.affirmation_id));
  }, [todayLogs]);

  const pendingAffirmations = React.useMemo(() => {
    return affirmations.filter((aff) => !completedToday.has(aff.id));
  }, [affirmations, completedToday]);

  // Handlers
  const startRitual = () => {
    if (pendingAffirmations.length > 0) {
      setSelectedAffirmation(pendingAffirmations[0]);
      setRitualStep(0);
      setShowRitualModal(true);
    }
  };

  const nextRitualStep = () => {
    if (ritualStep < 5) {
      setRitualStep((s) => s + 1);
    }
  };

  const completeRitual = async () => {
    if (!selectedAffirmation) return;

    await logAffirmation.mutateAsync({
      affirmation_id: selectedAffirmation.id,
      emotional_intensity: emotionalIntensity,
      notes: commitmentNote.trim() || undefined,
      felt_authentic: emotionalIntensity >= 3,
    });

    // Check if more affirmations pending
    const remaining = pendingAffirmations.filter((a) => a.id !== selectedAffirmation.id);
    if (remaining.length > 0) {
      setSelectedAffirmation(remaining[0]);
      setRitualStep(0);
    } else {
      setShowRitualModal(false);
      setSelectedAffirmation(null);
    }

    // Reset form
    setEmotionalIntensity(3);
    setCommitmentNote("");
  };

  const handleCreateSubmit = () => {
    if (!form.statement.trim()) return;

    createAffirmation.mutate(
      {
        statement: form.statement.trim(),
        category: form.category,
        times_per_day: form.times_per_day,
        reminder_times: form.reminder_times.slice(0, form.times_per_day),
        active: true,
        linked_goal_id: form.linked_goal_id || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setForm({
            statement: "",
            category: "financial",
            times_per_day: 2,
            reminder_times: ["07:00", "12:00"],
            linked_goal_id: "",
          });
        },
      }
    );
  };

  // Visualization timer effect
  React.useEffect(() => {
    if (showRitualModal && ritualStep === 3 && visualizationTime > 0) {
      const timer = setTimeout(() => {
        setVisualizationTime((t) => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (ritualStep !== 3) {
      setVisualizationTime(30);
    }
  }, [showRitualModal, ritualStep, visualizationTime]);

  // Main UI Rendering
  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brikx-dark">📿 Affirmations</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-brikx transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Affirmatie
          </button>
        </div>

        {/* Stats Overview */}
        {!affirmationsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Streak</span>
                <Award className="w-5 h-5 text-brikx-teal" />
              </div>
              <div className="text-3xl font-bold text-brikx-dark">
                {stats?.current_streak || 0} dagen
              </div>
              <div className="text-sm text-gray-500 mt-1">
                🏆 Max: {stats?.longest_streak || 0}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Vandaag</span>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-brikx-dark">
                {completedToday.size}/{affirmations.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">voltooid</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Gem. Intensiteit</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-brikx-dark">
                {stats?.avg_intensity?.toFixed(1) || "0.0"}/5
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(stats?.avg_intensity || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Morning Ritual CTA */}
        {pendingAffirmations.length > 0 && (
          <div className="bg-gradient-to-r from-brikx-teal to-brikx-teal-dark rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  🌅 Time for your affirmations!
                </h3>
                <p className="text-white/90">
                  Je hebt nog {pendingAffirmations.length} affirmatie(s) te doen vandaag
                </p>
              </div>
              <button
                onClick={startRitual}
                className="bg-white text-brikx-teal hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Start Nu
              </button>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        {affirmations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brikx-dark mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brikx-teal" />
              VANDAAG
            </h3>
            <div className="space-y-3">
              {affirmations.map((aff) => (
                <div
                  key={aff.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    completedToday.has(aff.id)
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200 hover:border-brikx-teal"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {completedToday.has(aff.id) ? "✅" : "⏰"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {aff.reminder_times[0]} {CATEGORY_ICONS[aff.category]}{" "}
                        {aff.statement.substring(0, 60)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {completedToday.has(aff.id) ? "Voltooid" : "Te doen"}
                      </div>
                    </div>
                  </div>
                  {!completedToday.has(aff.id) && (
                    <button
                      onClick={() => {
                        setSelectedAffirmation(aff);
                        startRitual();
                      }}
                      className="text-brikx-teal hover:text-brikx-teal-dark font-medium text-sm transition-all"
                    >
                      Nu doen!
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Affirmations */}
        {affirmations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-brikx-dark mb-4">
              📝 MIJN AFFIRMATIES
            </h3>
            <div className="space-y-4">
              {affirmations.map((aff) => (
                <div
                  key={aff.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-brikx-teal hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{CATEGORY_ICONS[aff.category]}</span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded border ${
                            CATEGORY_COLORS[aff.category]
                          }`}
                        >
                          {aff.category}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">"{aff.statement}"</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{aff.times_per_day}x per dag</span>
                        <span>🔥 {stats?.current_streak || 0} dagen streak</span>
                        {aff.linked_goal_id && <span>🎯 Gekoppeld aan doel</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                        <Play className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm("Weet je zeker dat je deze affirmatie wilt verwijderen?")
                          ) {
                            deleteAffirmation.mutate(aff.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-brikx-dark mb-4">
            📚 TEMPLATES (Click to use)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setForm({
                    ...form,
                    statement: template.text,
                    category: template.category as "financial" | "health" | "personal" | "business",
                  });
                  setShowCreateModal(true);
                }}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-brikx-teal hover:bg-gray-50 transition-all"
              >
                <span className="text-gray-700">• {template.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {!affirmationsLoading && affirmations.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📿</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nog geen affirmaties
            </h3>
            <p className="text-gray-600 mb-6">
              Begin met het maken van je eerste dagelijkse affirmatie
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg"
            >
              Maak Je Eerste Affirmatie
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-brikx-dark">📿 Nieuwe Affirmatie</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                💡 <strong>TIP:</strong> Gebruik "Ik ben/heb/doe" (tegenwoordige tijd) en wees
                specifiek over het resultaat
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jouw Affirmatie *
                </label>
                <textarea
                  value={form.statement}
                  onChange={(e) => setForm({ ...form, statement: e.target.value })}
                  placeholder="Ik verdien en ontvang €100.000 in 2024 door uitzonderlijke waarde te leveren..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent min-h-24 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["financial", "health", "personal", "business"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        form.category === cat
                          ? "border-brikx-teal bg-brikx-teal/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                      <div className="text-sm font-medium capitalize">{cat}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoe vaak per dag? (Minimum 2x aanbevolen)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.times_per_day}
                  onChange={(e) =>
                    setForm({ ...form, times_per_day: parseInt(e.target.value) || 1 })
                  }
                  className="w-32 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brikx-teal transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Herinneringstijden
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      className="w-4 h-4 text-brikx-teal rounded"
                    />
                    <span className="text-2xl">🌅</span>
                    <span className="text-sm font-medium">Ochtend</span>
                    <input
                      type="time"
                      value={form.reminder_times[0] || "07:00"}
                      onChange={(e) => {
                        const times = [...form.reminder_times];
                        times[0] = e.target.value;
                        setForm({ ...form, reminder_times: times });
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                    />
                  </div>
                  {form.times_per_day >= 2 && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="w-4 h-4 text-brikx-teal rounded"
                      />
                      <span className="text-2xl">☀️</span>
                      <span className="text-sm font-medium">Middag</span>
                      <input
                        type="time"
                        value={form.reminder_times[1] || "12:00"}
                        onChange={(e) => {
                          const times = [...form.reminder_times];
                          times[1] = e.target.value;
                          setForm({ ...form, reminder_times: times });
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                      />
                    </div>
                  )}
                  {form.times_per_day >= 3 && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="w-4 h-4 text-brikx-teal rounded"
                      />
                      <span className="text-2xl">🌙</span>
                      <span className="text-sm font-medium">Avond</span>
                      <input
                        type="time"
                        value={form.reminder_times[2] || "22:00"}
                        onChange={(e) => {
                          const times = [...form.reminder_times];
                          times[2] = e.target.value;
                          setForm({ ...form, reminder_times: times });
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brikx-teal"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={!form.statement.trim() || createAffirmation.isPending}
                  className="flex-1 px-6 py-3 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-brikx"
                >
                  {createAffirmation.isPending ? "Opslaan..." : "Opslaan & Test Nu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ritual Modal - Full Screen Experience */}
      {showRitualModal && selectedAffirmation && (
        <div className="fixed inset-0 bg-gradient-to-br from-brikx-dark to-brikx-teal z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl text-center text-white space-y-8">
            {/* Step 0: Welcome */}
            {ritualStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-5xl font-bold">🌅 GOEDEMORGEN!</h1>
                <p className="text-xl text-white/90">Je dagelijkse affirmatie wacht</p>
                <button
                  onClick={nextRitualStep}
                  className="bg-white text-brikx-teal hover:bg-gray-100 px-12 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-2xl"
                >
                  Begin Ritueel →
                </button>
                <p className="text-white/80">🔥 Streak: {stats?.current_streak || 0} dagen</p>
              </div>
            )}

            {/* Step 1: Affirmation Display */}
            {ritualStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <p className="text-3xl font-bold leading-relaxed px-8">
                  "{selectedAffirmation.statement}"
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                  >
                    {isRecording ? <Pause className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    {isRecording ? "Stop Opname" : "🎤 Spreek Hardop In"}
                  </button>
                  <button
                    onClick={nextRitualStep}
                    className="bg-white text-brikx-teal hover:bg-gray-100 px-8 py-4 rounded-lg font-bold transition-all"
                  >
                    Volgende →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Emotional Intensity */}
            {ritualStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-bold">Hoe overtuigd voel je je?</h2>
                <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setEmotionalIntensity(rating)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-16 h-16 ${
                          rating <= emotionalIntensity
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-white/80">
                  1 = Twijfel · 5 = Absolute zekerheid
                </p>
                <button
                  onClick={nextRitualStep}
                  className="bg-white text-brikx-teal hover:bg-gray-100 px-12 py-4 rounded-lg font-bold transition-all"
                >
                  Rate & Volgende →
                </button>
              </div>
            )}

            {/* Step 3: Visualization */}
            {ritualStep === 3 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-bold">🧘 VISUALISEER HET RESULTAAT</h2>
                <p className="text-xl text-white/90">
                  Sluit je ogen en zie jezelf dit doel bereiken...
                </p>
                <div className="text-6xl font-bold">{visualizationTime}s</div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={nextRitualStep}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    Skip
                  </button>
                  {visualizationTime === 0 && (
                    <button
                      onClick={nextRitualStep}
                      className="bg-white text-brikx-teal hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-all"
                    >
                      Done →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Commitment Note */}
            {ritualStep === 4 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-bold">Waarom GA je dit bereiken?</h2>
                <textarea
                  value={commitmentNote}
                  onChange={(e) => setCommitmentNote(e.target.value)}
                  placeholder="Voor financiële vrijheid, om mijn familie te kunnen ondersteunen..."
                  className="w-full bg-white/10 border-2 border-white/30 rounded-lg px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-white min-h-32"
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={nextRitualStep}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={nextRitualStep}
                    className="bg-white text-brikx-teal hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-all"
                  >
                    Opslaan & Afsluiten →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Celebration */}
            {ritualStep === 5 && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-5xl font-bold">✨ GEWELDIG! ✨</h2>
                <p className="text-2xl">
                  Affirmatie {completedToday.size + 1}/{affirmations.length} voltooid vandaag
                </p>
                <p className="text-xl text-white/90">
                  🔥 Streak: {(stats?.current_streak || 0) + 1} dagen!
                </p>
                {pendingAffirmations.length > 1 && (
                  <p className="text-white/80">
                    Volgende herinnering: {pendingAffirmations[1]?.reminder_times[0]}
                  </p>
                )}
                <button
                  onClick={completeRitual}
                  className="bg-white text-brikx-teal hover:bg-gray-100 px-12 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-2xl"
                >
                  {pendingAffirmations.length > 1 ? "Volgende Affirmatie" : "Ga naar Dashboard"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}