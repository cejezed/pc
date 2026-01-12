import { loadRecentEvents } from './loadEvents';
import { detectPatterns } from './patterns';
import { updatePersonalKnowledgeFromPatterns, loadPersonalKnowledge } from './knowledge';
import { generateCoachingCards } from './cards';
import { sanitizeForLLM } from './sanitize';
import { callLLM } from './llm';
import type { CoachResponse } from './types';

export interface CoachCoreInput {
    userId: string;
    latestUserMessage?: string;
    now?: Date;
    calendarEvents?: any[];
}

export async function coachCore(input: CoachCoreInput): Promise<CoachResponse> {
    const now = input.now ?? new Date();

    // 1. Load recent events (Health, Moments, Conversations)
    const events = await loadRecentEvents(input.userId, 14);

    // 2. Detect patterns from these events
    const patterns = detectPatterns(events);

    // 3. Promote significant patterns to long-term personal knowledge
    await updatePersonalKnowledgeFromPatterns(input.userId, patterns);

    // 4. Load relevant long-term knowledge
    const knowledge = await loadPersonalKnowledge(input.userId, 5);

    // 5. Generate proactive coaching cards based on patterns
    const cards = generateCoachingCards(patterns);

    // 6. Generate LLM response if there is a user message
    let reply = '';
    if (input.latestUserMessage) {
        reply = await generateReplyLLM(input.latestUserMessage, patterns, knowledge, input.calendarEvents);
    }

    return { reply, cards };
}

async function generateReplyLLM(
    latestUserMessage: string,
    patterns: any[],
    knowledge: any[],
    calendarEvents?: any[]
): Promise<string> {
    const safeMessage = sanitizeForLLM(latestUserMessage);
    const topPatterns = patterns
        .slice(0, 3)
        .map((p) => sanitizeForLLM(p.description));
    const topKnowledge = knowledge
        .slice(0, 5)
        .map((k) => sanitizeForLLM(k.summary));

    const systemPrompt = `
You are a personal coach for a single user.

RULES:
- You only know what is in this prompt. Do not claim to remember previous conversations.
- Do not reference names, specific dates, or locations (they are already sanitized).
- Use "you" or "the user", not names.
- Focus on patterns, small experiments, and growth.
- Be gentle, curious, grounded.
- Give short responses: 2-4 sentences.
- Suggest ONE small, concrete next step.
- Do not be prescriptive or judgmental.
`;

    const userPrompt = `
User says: "${safeMessage}"

Relevant patterns from their data:
${topPatterns.map((p) => `- ${p}`).join('\n')}

What we know about them long-term:
${topKnowledge.map((k) => `- ${k}`).join('\n')}

${calendarEvents && calendarEvents.length > 0 ? `
Upcoming Calendar Events:
${calendarEvents.map(e => `- ${e.start}: ${e.title}`).join('\n')}
` : ''}

Respond by:
1. Acknowledging the feeling/question briefly
2. Connecting gently to at most one pattern or knowledge item (or calendar event if relevant)
3. Suggesting one small, concrete experiment or next step

Keep it short and human. Be curious, not prescriptive.
`;

    return await callLLM(systemPrompt, userPrompt);
}
