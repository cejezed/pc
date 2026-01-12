// Event types
export type CoachEventType =
    | 'health_checkin'
    | 'moment'
    | 'conversation_user'
    | 'conversation_coach'
    | 'evening_reflection';

export interface CoachEventBase {
    type: CoachEventType;
    timestamp: string; // ISO 8601
}

export interface HealthCheckinEvent extends CoachEventBase {
    type: 'health_checkin';
    entryDate: string; // 'YYYY-MM-DD'
    sleepHours?: number;
    sleepQuality?: number;
    energyLevel?: number;
    anxietyLevel?: number;
    exercised?: boolean;
    exerciseType?: string;
    exerciseDurationMinutes?: number;
    breakfastTaken?: boolean;
    lunchTaken?: boolean;
    dinnerTaken?: boolean;
    notes?: string;
}

export interface MomentEvent extends CoachEventBase {
    type: 'moment';
    entryDate: string;
    label: string;
    intensity?: number;
    category?: string;
    context?: string;
    voiceTranscript?: string;
}

export interface EveningReflectionEvent extends CoachEventBase {
    type: 'evening_reflection';
    entryDate: string;
    highlights?: string;
    challenges?: string;
    relational?: string;
    authenticityScore?: number;
    tomorrowFocus?: string;
    voiceTranscript?: string;
}

export interface ConversationUserEvent extends CoachEventBase {
    type: 'conversation_user';
    text: string;
}

export interface ConversationCoachEvent extends CoachEventBase {
    type: 'conversation_coach';
    text: string;
}

export type CoachEvent =
    | HealthCheckinEvent
    | MomentEvent
    | EveningReflectionEvent
    | ConversationUserEvent
    | ConversationCoachEvent;

// Patterns
export interface Pattern {
    id: string;
    patternId: string;
    domain: 'health' | 'nutrition' | 'energy' | 'sleep' | 'relationships' | 'authenticity' | 'stress';
    description: string;
    confidence: number; // 0-1
    evidence: Record<string, unknown>;
    discoveredAt: string;
}

// Coaching Cards
export type CoachingCardType =
    | 'pattern'
    | 'insight'
    | 'growth_edge'
    | 'health'
    | 'relationship'
    | 'authenticity'
    | 'win';

export interface CoachingCard {
    id: string;
    type: CoachingCardType;
    priority: 1 | 2 | 3;

    // Main content
    observation: string;
    reasoning?: string;
    blindspot?: string;
    question?: string;
    suggested_action?: string;
    how_to_implement?: string;

    evidence?: {
        data_points?: number;
        confidence?: number;
    };
}

// Personal Knowledge
export type KnowledgeCategory =
    | 'pattern'
    | 'preference'
    | 'value'
    | 'blindspot'
    | 'goal'
    | 'strength'
    | 'challenge';

export interface PersonalKnowledgeItem {
    id: string;
    category: KnowledgeCategory;
    summary: string;
    confidence: number;
    source?: string;
    lastUpdated: string;
}

// Coach Response
export interface CoachResponse {
    reply: string;
    voiceUrl?: string; // TTS audio
    cards: CoachingCard[];
}
