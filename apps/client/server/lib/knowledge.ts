import { createClient } from '@supabase/supabase-js';
import type { Pattern, PersonalKnowledgeItem } from './types';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updatePersonalKnowledgeFromPatterns(
    userId: string,
    patterns: Pattern[]
): Promise<void> {
    // For each pattern, promote to knowledge if confidence high enough
    for (const pattern of patterns) {
        if (pattern.confidence < 0.65) continue;

        const category = patternToKnowledgeCategory(pattern.patternId);
        if (!category) continue;

        const summary = generateKnowledgeSummary(pattern);

        // Check if exists
        const { data: existing } = await supabase
            .from('personal_knowledge')
            .select('*')
            .eq('user_id', userId)
            .eq('category', category)
            .ilike('summary', `%${pattern.patternId}%`)
            .single();

        if (existing) {
            // Update
            await supabase
                .from('personal_knowledge')
                .update({
                    summary,
                    confidence: Math.max(existing.confidence, pattern.confidence),
                    last_updated: new Date().toISOString().slice(0, 10),
                })
                .eq('id', existing.id);
        } else {
            // Insert
            await supabase.from('personal_knowledge').insert({
                user_id: userId,
                category,
                summary,
                confidence: pattern.confidence,
                source: pattern.patternId,
                last_updated: new Date().toISOString().slice(0, 10),
            });
        }
    }
}

function patternToKnowledgeCategory(
    patternId: string
): PersonalKnowledgeItem['category'] | null {
    const map: Record<string, PersonalKnowledgeItem['category']> = {
        'nutrition-meals-energy': 'pattern',
        'sleep-anxiety': 'pattern',
        'exercise-sleep': 'pattern',
        'relational-authenticity': 'pattern',
        'relational-authenticity-dimming': 'blindspot',
        'stress-triggers': 'pattern',
    };
    return map[patternId] || null;
}

function generateKnowledgeSummary(pattern: Pattern): string {
    switch (pattern.patternId) {
        case 'nutrition-meals-energy':
            return `User functioneert duidelijk beter qua energie als ontbijt en lunch vaste onderdelen van de dag zijn. 
              Dagen zonder vaste eetmomenten leiden tot meer moeheid.`;
        case 'sleep-anxiety':
            return `User heeft aanzienlijk meer stress en angst op nachten met minder dan 7 uur slaap. 
              Goed slapen is cruciaal voor emotioneel evenwicht.`;
        case 'exercise-sleep':
            return `User slaapt beter op nachten na training. 
              Regelmatig bewegen is de meest effectieve slaapmiddel.`;
        case 'relational-authenticity':
            return `User voelt zich het meest jezelf en energiek met bepaalde mensen. 
              Dit zijn de relaties waar groei en vervulling gebeurt.`;
        case 'relational-authenticity-dimming':
            return `User dim jezelf af met bepaalde mensen, vooral met partnerrelaties. 
              Dit is een blinde vlek: je merkten niet op als je het doet.`;
        case 'stress-triggers':
            return `User stress concentreert zich rond specifieke triggers. 
              Herkennen en aanpakken van deze triggers kan stress significant verminderen.`;
        default:
            return pattern.description;
    }
}

export async function loadPersonalKnowledge(
    userId: string,
    limit: number = 10
): Promise<PersonalKnowledgeItem[]> {
    const { data } = await supabase
        .from('personal_knowledge')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false })
        .limit(limit);

    return (data || []).map((k) => ({
        id: k.id,
        category: k.category,
        summary: k.summary,
        confidence: k.confidence,
        source: k.source,
        lastUpdated: k.last_updated,
    }));
}
