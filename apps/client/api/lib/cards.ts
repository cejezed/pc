import type { Pattern, CoachingCard } from './types';

export function generateCoachingCards(patterns: Pattern[]): CoachingCard[] {
    const cards: CoachingCard[] = [];

    for (const pattern of patterns) {
        const card = patternToCard(pattern);
        if (card) {
            cards.push(card);
        }
    }

    // Sort by priority
    return cards.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

function patternToCard(pattern: Pattern): CoachingCard | null {
    switch (pattern.patternId) {
        case 'nutrition-meals-energy':
            return {
                id: pattern.id,
                type: 'health',
                priority: pattern.confidence >= 0.8 ? 1 : 2,
                observation: pattern.description,
                reasoning: `Je data laat duidelijk zien: op dagen met ontbijt + lunch heb je 
                    meer energie dan op dagen zonder vaste eetmomenten.`,
                question: `Wat zou veranderen als je lunch rond 12:30 als vaste, niet-onderhandelbare 
                   pauze ziet in plaats van iets wat je "overslaat als het druk is"?`,
                suggested_action: `Plan voor de komende 5 werkdagen: 12:30 lunch, 20-30 minuten, 
                          iets simpels eten. Zie dit als onderdeel van je werk (energiebeheer), 
                          niet als onderbreking.`,
                how_to_implement: `Maak een dagelijks agendapunt "Lunch = energie" van 20–30 minuten. 
                          Kies vooraf wat je ongeveer gaat eten zodat je niet hoeft te beslissen 
                          op dat moment.`,
                evidence: {
                    data_points: (pattern.evidence.daysWithMeals as number ?? 0) + (pattern.evidence.daysWithoutMeals as number ?? 0),
                    confidence: pattern.confidence,
                },
            };

        case 'sleep-anxiety':
            return {
                id: pattern.id,
                type: 'health',
                priority: pattern.confidence >= 0.75 ? 1 : 2,
                observation: pattern.description,
                reasoning: `Je lichaam geeft helder signaal: beter slapen = minder spanning. 
                    Dit is niet willpower, dit is biologie.`,
                blindspot: `Je denkt misschien dat je "teveel nadenkt" of "stress niet kan vermijden". 
                    Reality: je bent gewoon uitgeput van te weinig slaap.`,
                question: `Wat zou het betekenen als slaap jouw #1 gezondheid-prioriteit wordt 
                   (niet wat je "krijgt" als rest)?`,
                suggested_action: `Test: volgende week target 7-8 uur slaap elke nacht. 
                          Track hoe je angst-level voelt.`,
                how_to_implement: `Verplaats bedtijd [X uur eerder]. Schermen uit om [22:00]. 
                          Zie slaap als performance-tool, niet als weelde.`,
                evidence: {
                    data_points: (pattern.evidence.wellSleptDays as number) + (pattern.evidence.poorlySleptDays as number),
                    confidence: pattern.confidence,
                },
            };

        case 'exercise-sleep':
            return {
                id: pattern.id,
                type: 'health',
                priority: 2,
                observation: pattern.description,
                reasoning: `Dit is niet toeval. Beweging = betere slaap. 
                    Dit werkt beter dan slaapmiddelen.`,
                question: `Hoe zou je leven veranderen als je training niet "extra" is, 
                   maar onderdeel van je slaaphygiëne?`,
                suggested_action: `Zorg voor 30min beweging 5x/week. 
                          Dit is niet "optioneel hobby", dit is "sleep medicine".`,
                how_to_implement: `Zet trainingen in je agenda als je slaapmiddel. 
                          Best effect: 6-8 uur voor slaaptijd.`,
                evidence: {
                    data_points: (pattern.evidence.daysWithExercise as number) + (pattern.evidence.daysWithoutExercise as number),
                    confidence: pattern.confidence,
                },
            };

        case 'relational-authenticity':
            return {
                id: pattern.id,
                type: 'relationship',
                priority: 2,
                observation: pattern.description,
                reasoning: `Dit is niet toeval. Met deze persoon/mensen ben je jezelf = je bent beter. 
                    Energie en authenticity gaan samen.`,
                question: `Hoeveel tijd besteed je aan relaties waar je jezelf BENT 
                   vs relaties waar je jezelf DIM?`,
                suggested_action: `Investeer meer in relaties die je authentiek maken. 
                          Dit is geen "social hack", dit is survival.`,
                how_to_implement: `Plan tijd met deze personen. 
                          Let op: hoe voelde je je daarna? Was je opgeladen?`,
                evidence: {
                    data_points: pattern.evidence.totalInteractions as number,
                    confidence: pattern.confidence,
                },
            };

        case 'relational-authenticity-dimming':
            return {
                id: pattern.id,
                type: 'relationship',
                priority: 1,
                observation: pattern.description,
                reasoning: `Dit is een blinde vlek. Je dimmt jezelf en merkt het niet terwijl je het doet. 
                    Dit kost energie.`,
                blindspot: `Je denkt misschien dat je "goed" ben in deze relatie. 
                    Reality: je beschermt jezelf tegen iets dat misschien niet eens gebeurt.`,
                question: `Met deze persoon: wat vrees je eigelijk? Kritiek? Afwijzing? 
                   Is dat werkelijk aan de orde?`,
                suggested_action: `Experiment: volgende keer met deze persoon, bewust jezelf blijven. 
                          Wat gebeurt er ECHT (niet wat je vreest)?`,
                how_to_implement: `Voor de interactie: 'Ik mag jezelf zijn.' 
                          Na: reflecteer: 'Wat was echt? Wat was mijn vrees?'`,
                evidence: {
                    data_points: pattern.evidence.totalInteractions as number,
                    confidence: pattern.confidence,
                },
            };

        case 'stress-triggers':
            return {
                id: pattern.id,
                type: 'health',
                priority: 2,
                observation: pattern.description,
                reasoning: `Je stress is niet random. Het komt van specifieke situaties. 
                    Als je triggers kent, kun je ze aanpakken.`,
                question: `Wat is het patroon hier? Is dit situatie-gebonden (vermijdbaar)? 
                   Of iets wat je moet leren hanteren?`,
                suggested_action: `Map je top 3 stress-triggers. Voor elk: 1 kleine actie die je controle geeft.`,
                how_to_implement: `Trigger: [X]. Kleine actie: [Y]. Test dit 1x deze week.`,
                evidence: {
                    data_points: pattern.evidence.totalStressMoments as number,
                    confidence: pattern.confidence,
                },
            };

        default:
            return null;
    }
}
