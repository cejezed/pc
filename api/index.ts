import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import ical from "node-ical";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`API Request: ${req.method} ${req.url}`);

  // Health check
  if (req.url?.includes("/api/health")) {
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  }

  // Coach Handler (Legacy / Simple)
  if (req.url && (req.url.includes("/api/coach") && !req.url.includes("/cards"))) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized - No header' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) return res.status(401).json({ error: 'Unauthorized - Invalid token' });

    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      // 1. Fetch Context Data & Chat History
      const today = new Date().toISOString().split('T')[0];
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      // Parallel data fetching
      const [
        { data: metrics },
        { data: habits },
        { data: habitLogs },
        { data: mealPlans },
        { data: invoices },
        { data: timeEntries },
        { data: projects },
        { data: chatHistory }
      ] = await Promise.all([
        supabase.from('daily_metrics').select('*').gte('date', twoWeeksAgoStr).order('date', { ascending: false }),
        supabase.from('habits').select('*').eq('active', true),
        supabase.from('habit_logs').select('*').gte('completed_date', twoWeeksAgoStr),
        supabase.from('meal_plans').select('*, recipe:recipes(title)').gte('date', today).limit(10),
        supabase.from('facturen').select('*, project:projects(name)').or(`status.eq.sent,status.eq.overdue,payment_date.gte.${twoWeeksAgoStr}`),
        supabase.from('time_entries').select('*, projects(name)').is('invoiced_at', null).order('occurred_on', { ascending: false }).limit(50),
        supabase.from('projects').select('*').eq('archived', false),
        supabase.from('conversations').select('role, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      ]) as any;

      // 2. Construct System Prompt
      const systemPrompt = `
You are a highly intelligent, empathetic, and holistic Personal Coach.
Your goal is to help the user thrive in both their personal life (health, habits) and business (projects, finances).

**Your Persona:**
- **Warm & Conversational:** Speak naturally, like a close friend or a wise partner. Use "je/jij".
- **Holistic:** Connect the dots.
- **Proactive:** Don't just answer; offer insights based on the data.

**Current Context Data:**
- **Health (Last 14 days):** ${JSON.stringify(metrics?.map((m: any) => ({ date: m.date, sleep: m.slaap_score, energy: m.energie_score, stress: m.stress_niveau, workout: m.workout_done })))}
- **Habits:** ${JSON.stringify(habits?.map((h: any) => h.name))} (Recent logs: ${habitLogs?.length} completions)
- **Nutrition (Upcoming):** ${JSON.stringify(mealPlans?.map((m: any) => `${m.date}: ${m.meal_type} - ${m.recipe?.title}`))}
- **Business - Invoices:** ${JSON.stringify(invoices?.map((i: any) => ({ amount: i.amount_cents, status: i.status, project: i.project?.name })))}
- **Business - Unbilled Hours:** ${timeEntries?.length} entries waiting to be billed.
- **Business - Active Projects:** ${projects?.map((p: any) => p.name).join(', ')}

Respond to the user in Dutch. Be concise but meaningful.
`;

      const historyMessages = (chatHistory || []).reverse().map((msg: any) => ({
        role: (msg.role === 'coach' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.text
      }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as any;
      const reply = data.choices[0]?.message?.content;

      await Promise.all([
        supabase.from('conversations').insert({ user_id: user.id, role: 'user', text: message }),
        supabase.from('conversations').insert({ user_id: user.id, role: 'coach', text: reply })
      ]);

      return res.status(200).json({ reply });

    } catch (error: any) {
      console.error('Coach API error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  // --- Blueprint v2.0 Endpoints ---

  // POST /api/checkin/morning
  if (req.url && req.url.includes("/api/checkin/morning")) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { entryDate, ...data } = req.body;
      const { error } = await supabase.from('daily_metrics').insert({
        user_id: user.id,
        date: entryDate, // daily_metrics uses 'date'
        slaap_score: (data.sleepHours || 0) * 10, // Map back to 0-100 roughly
        stress_niveau: data.anxietyLevel,
        workout_done: data.exercised,
        ochtend_workout: data.exerciseType === 'morning_workout',
        breakfast_taken: data.breakfastTaken,
        lunch_taken: data.lunchTaken,
        dinner_taken: data.dinnerTaken,
        notes: data.notes,
        // Default others
        energie_score: (data.energyLevel || 3) * 20,
        schouder_pijn: 0,
        lang_wakker: false,
        kort_wakker: false,
        nap: false,
        golf_oefenen: false,
        golfen: false,
        mtb: false,
        ogen_schoonmaken: false,
        oogdruppels: false,
        allergie_medicatie: false
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/moment
  if (req.url && req.url.includes("/api/moment")) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { label, intensity, context } = req.body;
      const { error } = await supabase.from('moments').insert({
        user_id: user.id,
        label,
        intensity,
        context,
        entry_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/coach/cards
  if (req.url && req.url.includes("/api/coach/cards")) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      // Dynamic import to avoid top-level await issues in some envs
      const { coachCore } = await import('./lib/coachCore');
      const { cards } = await coachCore({ userId: user.id });
      return res.status(200).json({ cards });
    } catch (error: any) {
      console.error('Cards error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/voice (Full Voice Chat)
  if (req.url && req.url.includes("/api/voice")) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { audio, mimeType } = req.body;

      if (!audio) {
        return res.status(400).json({ error: 'Audio data required' });
      }

      // Fetch ICS URL from DB
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('google_calendar_ics')
        .eq('user_id', user.id)
        .maybeSingle();

      const icsUrl = integrations?.google_calendar_ics;

      // Fetch Calendar Events if URL provided
      let calendarEvents: any[] = [];
      if (icsUrl) {
        try {
          const events = await ical.async.fromURL(icsUrl);
          const now = new Date();
          const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

          for (const k in events) {
            const ev = events[k];
            if (ev.type === 'VEVENT' && ev.start) {
              const start = new Date(ev.start);
              if (start >= now && start <= end) {
                calendarEvents.push({
                  title: ev.summary || 'Untitled',
                  start: start.toLocaleString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
                  description: ev.description
                });
              }
            }
          }
          calendarEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          calendarEvents = calendarEvents.slice(0, 5);
        } catch (e) {
          console.error('Calendar fetch error:', e);
        }
      }

      // Convert base64 to buffer
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');

      // Create a Blob-like object for Whisper
      const type = mimeType || 'audio/webm';
      const audioBlob = new Blob([audioBuffer], { type });

      // Transcribe with Whisper
      const { transcribeAudio } = await import('./lib/llm');
      const transcript = await transcribeAudio(audioBlob, type);

      if (!transcript) {
        return res.status(400).json({ error: 'Could not transcribe audio' });
      }

      // Store user msg
      await supabase.from('conversations').insert({
        user_id: user.id,
        role: 'user',
        text: transcript
      });

      // Generate response
      const { coachCore } = await import('./lib/coachCore');
      const { generateSpeech } = await import('./lib/llm');

      const { reply, cards } = await coachCore({
        userId: user.id,
        latestUserMessage: transcript,
        calendarEvents
      });

      // Generate Audio
      const ttsBuffer = await generateSpeech(reply);
      const audioBase64 = Buffer.from(ttsBuffer).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      // Store coach msg
      await supabase.from('conversations').insert({
        user_id: user.id,
        role: 'coach',
        text: reply,
        voice_url: audioUrl
      });

      return res.status(200).json({
        transcript,
        reply,
        voiceUrl: audioUrl,
        cards
      });
    } catch (error: any) {
      console.error('Voice error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Default 404
  return res.status(404).json({ error: "Not found", path: req.url });
}