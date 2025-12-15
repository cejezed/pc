import type { CoachEvent, Pattern } from './types';

export function detectPatterns(events: CoachEvent[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Pattern 1: Nutrition & Meal Timing → Energy
    const mealEnergy = detectMealEnergyPattern(events);
    if (mealEnergy) patterns.push(mealEnergy);

    // Pattern 2: Sleep → Anxiety
    const sleepAnxiety = detectSleepAnxietyPattern(events);
    if (sleepAnxiety) patterns.push(sleepAnxiety);

    // Pattern 3: Exercise → Sleep
    const exerciseSleep = detectExerciseSleepPattern(events);
    if (exerciseSleep) patterns.push(exerciseSleep);

    // Pattern 4: Relational Authenticity
    const relationalAuth = detectRelationalAuthenticityPattern(events);
    if (relationalAuth) patterns.push(relationalAuth);

    // Pattern 5: Stress Triggers
    const stressTriggers = detectStressTriggersPattern(events);
    if (stressTriggers) patterns.push(stressTriggers);

    return patterns;
}

// ============ PATTERN 1: Meals → Energy ============

function detectMealEnergyPattern(events: CoachEvent[]): Pattern | null {
    const byDate: Record<string, {
        hasBreakfast: boolean;
        hasLunch: boolean;
        tiredCount: number;
        energyLevel?: number;
    }> = {};

    for (const e of events) {
        if (e.type === 'health_checkin') {
            byDate[e.entryDate] ??= { hasBreakfast: false, hasLunch: false, tiredCount: 0 };
            byDate[e.entryDate].hasBreakfast = !!e.breakfastTaken;
            byDate[e.entryDate].hasLunch = !!e.lunchTaken;
            byDate[e.entryDate].energyLevel = e.energyLevel;
        }
        if (e.type === 'moment' && (e.label === 'tired' || e.label === 'energy')) {
            byDate[e.entryDate] ??= { hasBreakfast: false, hasLunch: false, tiredCount: 0 };
            if (e.label === 'tired') {
                byDate[e.entryDate].tiredCount += 1;
            }
        }
    }

    const withMeals: number[] = [];
    const withoutMeals: number[] = [];

    for (const [_, d] of Object.entries(byDate)) {
        if (d.hasBreakfast && d.hasLunch) {
            withMeals.push(d.energyLevel ?? 0);
        } else {
            withoutMeals.push(d.energyLevel ?? 0);
        }
    }

    if (!withMeals.length || !withoutMeals.length) return null;

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const avgWith = avg(withMeals);
    const avgWithout = avg(withoutMeals);

    // Only report if significant difference (e.g. energy drops when skipping meals)
    if (avgWith - avgWithout < 0.5) return null; // Not significant

    const totalDays = withMeals.length + withoutMeals.length;
    const confidence = Math.min(1, totalDays / 14);

    return {
        id: 'nutrition-meals-energy-' + Date.now(),
        patternId: 'nutrition-meals-energy',
        domain: 'nutrition',
        description: `Je bent merkbaar vaker moe op dagen dat je ontbijt of lunch overslaat. 
                  Energie met vaste eetmomenten: ${avgWith.toFixed(1)}/5 vs zonder: ${avgWithout.toFixed(1)}/5.`,
        confidence,
        evidence: {
            daysWithMeals: withMeals.length,
            daysWithoutMeals: withoutMeals.length,
            avgEnergyWithMeals: avgWith.toFixed(2),
            avgEnergyWithoutMeals: avgWithout.toFixed(2),
            difference: (avgWith - avgWithout).toFixed(2),
        },
        discoveredAt: new Date().toISOString(),
    };
}

// ============ PATTERN 2: Sleep → Anxiety ============

function detectSleepAnxietyPattern(events: CoachEvent[]): Pattern | null {
    const byDate: Record<string, {
        sleepHours?: number;
        anxietyLevel?: number;
        stressMoments: number;
    }> = {};

    for (const e of events) {
        if (e.type === 'health_checkin') {
            byDate[e.entryDate] ??= { stressMoments: 0 };
            byDate[e.entryDate].sleepHours = e.sleepHours;
            byDate[e.entryDate].anxietyLevel = e.anxietyLevel;
        }
        if (e.type === 'moment' && (e.label === 'stress' || e.label === 'anxiety')) {
            byDate[e.entryDate] ??= { stressMoments: 0 };
            byDate[e.entryDate].stressMoments += 1;
        }
    }

    const wellSlept: number[] = [];
    const poorlySlept: number[] = [];

    for (const d of Object.values(byDate)) {
        if (!d.sleepHours || d.anxietyLevel === undefined) continue;
        const anxietyScore = d.anxietyLevel + (d.stressMoments * 1.5);
        if (d.sleepHours >= 7) {
            wellSlept.push(anxietyScore);
        } else {
            poorlySlept.push(anxietyScore);
        }
    }

    if (!wellSlept.length || !poorlySlept.length) return null;

    const avgWell = wellSlept.reduce((a, b) => a + b) / wellSlept.length;
    const avgPoor = poorlySlept.reduce((a, b) => a + b) / poorlySlept.length;
    const diff = avgPoor - avgWell;

    if (diff < 1) return null;

    const totalDays = wellSlept.length + poorlySlept.length;
    const confidence = Math.min(1, totalDays / 14);

    return {
        id: 'sleep-anxiety-' + Date.now(),
        patternId: 'sleep-anxiety',
        domain: 'sleep',
        description: `Je hebt aanzienlijk meer stress en angst op nachten met < 7 uur slaap. 
                  Met goede slaap: ${avgWell.toFixed(1)}/10 spanning vs slechte slaap: ${avgPoor.toFixed(1)}/10.`,
        confidence,
        evidence: {
            wellSleptDays: wellSlept.length,
            poorlySleptDays: poorlySlept.length,
            avgAnxietyWellSlept: avgWell.toFixed(2),
            avgAnxietyPoorlySlept: avgPoor.toFixed(2),
            difference: diff.toFixed(2),
        },
        discoveredAt: new Date().toISOString(),
    };
}

// ============ PATTERN 3: Exercise → Sleep ============

function detectExerciseSleepPattern(events: CoachEvent[]): Pattern | null {
    const byDate: Record<string, {
        exercised: boolean;
        nextDaySleep?: number;
    }> = {};

    // First pass: mark exercise days
    for (const e of events) {
        if (e.type === 'health_checkin') {
            byDate[e.entryDate] ??= { exercised: false };
            byDate[e.entryDate].exercised = !!e.exercised;
        }
    }

    // Second pass: link to next day's sleep
    const dates = Object.keys(byDate).sort();
    for (let i = 0; i < dates.length - 1; i++) {
        const currentDate = dates[i];
        const nextDate = dates[i + 1];
        if (byDate[nextDate]?.nextDaySleep === undefined) {
            // Find sleep for next date
            const nextDayEvent = events.find(ev => ev.type === 'health_checkin' && ev.entryDate === nextDate) as any;
            if (nextDayEvent) {
                byDate[currentDate].nextDaySleep = nextDayEvent.sleepHours;
            }
        }
    }

    const withExercise: number[] = [];
    const withoutExercise: number[] = [];

    for (const d of Object.values(byDate)) {
        if (d.nextDaySleep === undefined) continue;
        if (d.exercised) {
            withExercise.push(d.nextDaySleep);
        } else {
            withoutExercise.push(d.nextDaySleep);
        }
    }

    if (!withExercise.length || !withoutExercise.length) return null;

    const avgWith = withExercise.reduce((a, b) => a + b) / withExercise.length;
    const avgWithout = withoutExercise.reduce((a, b) => a + b) / withoutExercise.length;
    const diff = avgWith - avgWithout;

    if (diff < 0.5) return null;

    const totalDays = withExercise.length + withoutExercise.length;
    const confidence = Math.min(1, totalDays / 14);

    return {
        id: 'exercise-sleep-' + Date.now(),
        patternId: 'exercise-sleep',
        domain: 'health',
        description: `Je slaapt beter (gemiddeld ${avgWith.toFixed(1)}h) op nachten na een trainingsdag 
                  dan op nachten zonder training (${avgWithout.toFixed(1)}h).`,
        confidence,
        evidence: {
            daysWithExercise: withExercise.length,
            daysWithoutExercise: withoutExercise.length,
            avgSleepWithExercise: avgWith.toFixed(2),
            avgSleepWithoutExercise: avgWithout.toFixed(2),
            difference: diff.toFixed(2),
        },
        discoveredAt: new Date().toISOString(),
    };
}

// ============ PATTERN 4: Relational Authenticity ============

function detectRelationalAuthenticityPattern(events: CoachEvent[]): Pattern | null {
    const byPerson: Record<string, {
        authenticMoments: number;
        dimmingMoments: number;
        totalInteractions: number;
    }> = {};

    for (const e of events) {
        if (e.type === 'moment') {
            // Parse context for "with [person]"
            const context = e.context || '';
            const personMatch = context.match(/with\s+([a-zA-Z_]+)/i);
            if (!personMatch) continue;

            const person = personMatch[1].toLowerCase();
            byPerson[person] ??= { authenticMoments: 0, dimmingMoments: 0, totalInteractions: 0 };
            byPerson[person].totalInteractions += 1;

            if (e.label === 'authentic' || e.label === 'connection' || e.label === 'win') {
                byPerson[person].authenticMoments += 1;
            }
            if (e.label === 'dimmed' || e.label === 'inauthentic' || e.label === 'stress') {
                byPerson[person].dimmingMoments += 1;
            }
        }
    }

    // Find person with strongest authenticity pattern
    let strongestPerson = '';
    let strongestRatio = 0;

    for (const [person, counts] of Object.entries(byPerson)) {
        if (counts.totalInteractions < 3) continue;
        const ratio = counts.authenticMoments - counts.dimmingMoments;
        if (Math.abs(ratio) > Math.abs(strongestRatio)) {
            strongestPerson = person;
            strongestRatio = ratio;
        }
    }

    if (!strongestPerson) return null;

    const personData = byPerson[strongestPerson];
    const ratio = personData.authenticMoments / personData.totalInteractions;

    if (ratio > 0.6) {
        const description = `Je voelt je het meest jezelf bij ${strongestPerson}. 
                        Daar ben je authentiek en energiek (${(ratio * 100).toFixed(0)}% van interacties).`;
        return {
            id: 'relational-authenticity-' + Date.now(),
            patternId: 'relational-authenticity',
            domain: 'relationships',
            description,
            confidence: Math.min(1, personData.totalInteractions / 10),
            evidence: {
                person: strongestPerson,
                authenticMoments: personData.authenticMoments,
                dimmingMoments: personData.dimmingMoments,
                totalInteractions: personData.totalInteractions,
                authenticityRatio: ratio.toFixed(2),
            },
            discoveredAt: new Date().toISOString(),
        };
    } else if (ratio < 0.4) {
        const description = `Met ${strongestPerson} dim je jezelf af. 
                        Je bent daar minder jezelf (${(ratio * 100).toFixed(0)}% authentiek, 
                        ${((1 - ratio) * 100).toFixed(0)}% gedimmd).`;
        return {
            id: 'relational-authenticity-dimming-' + Date.now(),
            patternId: 'relational-authenticity-dimming',
            domain: 'relationships',
            description,
            confidence: Math.min(1, personData.totalInteractions / 10),
            evidence: {
                person: strongestPerson,
                authenticMoments: personData.authenticMoments,
                dimmingMoments: personData.dimmingMoments,
                totalInteractions: personData.totalInteractions,
                dimmingRatio: (1 - ratio).toFixed(2),
            },
            discoveredAt: new Date().toISOString(),
        };
    }

    return null;
}

// ============ PATTERN 5: Stress Triggers ============

function detectStressTriggersPattern(events: CoachEvent[]): Pattern | null {
    const contextCounts: Record<string, number> = {};
    const stressMoments: string[] = [];

    for (const e of events) {
        if (e.type === 'moment' && e.label === 'stress') {
            const context = e.context || 'unknown';
            contextCounts[context] = (contextCounts[context] || 0) + 1;
            stressMoments.push(context);
        }
    }

    if (stressMoments.length < 3) return null;

    const topTrigger = Object.entries(contextCounts)
        .sort((a, b) => b[1] - a[1])[0];

    if (!topTrigger || topTrigger[1] < 2) return null;

    const frequency = topTrigger[1] / stressMoments.length;

    return {
        id: 'stress-triggers-' + Date.now(),
        patternId: 'stress-triggers',
        domain: 'stress',
        description: `Je stress-momenten concentreren zich rond: "${topTrigger[0]}". 
                  Dit trigger ${(frequency * 100).toFixed(0)}% van je stress-episodes.`,
        confidence: Math.min(1, topTrigger[1] / 5),
        evidence: {
            topTrigger: topTrigger[0],
            triggerFrequency: topTrigger[1],
            totalStressMoments: stressMoments.length,
            percentageOfTotal: (frequency * 100).toFixed(1),
        },
        discoveredAt: new Date().toISOString(),
    };
}
