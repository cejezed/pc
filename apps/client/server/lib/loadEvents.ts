import { createClient } from '@supabase/supabase-js';
import type { CoachEvent } from './types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function loadRecentEvents(
    userId: string,
    days: number = 14
): Promise<CoachEvent[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();

    const [healthRows, momentRows, reflectionRows, convRows] = await Promise.all([
        supabase
            .from('daily_metrics')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: true }),

        supabase
            .from('moments')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: true }),

        supabase
            .from('evening_reflections')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: true }),

        supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: true }),
    ]);

    const events: CoachEvent[] = [];

    // Convert health data (daily_metrics)
    for (const h of healthRows.data || []) {
        events.push({
            type: 'health_checkin',
            timestamp: h.created_at,
            entryDate: h.date, // Note: daily_metrics uses 'date' column, not 'entry_date'
            sleepHours: h.slaap_score ? h.slaap_score / 10 : undefined, // Rough mapping if score is 0-100
            sleepQuality: h.slaap_score ? Math.round(h.slaap_score / 20) : undefined, // 1-5 scale
            energyLevel: h.energie_score ? Math.round(h.energie_score / 20) : undefined, // 1-5 scale
            anxietyLevel: h.stress_niveau,
            exercised: h.workout_done,
            exerciseType: h.ochtend_workout ? 'morning_workout' : undefined,
            exerciseDurationMinutes: undefined, // Not in daily_metrics yet
            breakfastTaken: h.breakfast_taken,
            lunchTaken: h.lunch_taken,
            dinnerTaken: h.dinner_taken,
            notes: h.notes,
        });
    }

    // Convert moments
    for (const m of momentRows.data || []) {
        events.push({
            type: 'moment',
            timestamp: m.created_at,
            entryDate: m.entry_date,
            label: m.label,
            intensity: m.intensity ?? undefined,
            category: m.category ?? undefined,
            context: m.context ?? undefined,
            voiceTranscript: m.voice_transcript ?? undefined,
        });
    }

    // Convert evening reflections
    for (const r of reflectionRows.data || []) {
        events.push({
            type: 'evening_reflection',
            timestamp: r.created_at,
            entryDate: r.entry_date,
            highlights: r.highlights ?? undefined,
            challenges: r.challenges ?? undefined,
            relational: r.relational ?? undefined,
            authenticityScore: r.authenticity_score ?? undefined,
            tomorrowFocus: r.tomorrow_focus ?? undefined,
            voiceTranscript: r.voice_transcript ?? undefined,
        });
    }

    // Convert conversations
    for (const c of convRows.data || []) {
        events.push({
            type: c.role === 'user' ? 'conversation_user' : 'conversation_coach',
            timestamp: c.created_at,
            text: c.text,
        });
    }

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return events;
}
