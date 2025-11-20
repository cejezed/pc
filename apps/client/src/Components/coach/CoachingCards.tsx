import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CoachingCard } from '../../lib/types/personalCoach';

export function CoachingCards() {
    const [cards, setCards] = useState<CoachingCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCards();
    }, []);

    async function loadCards() {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Not authenticated');
                return;
            }

            const response = await fetch('/api/coach/cards', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load cards: ${response.statusText}`);
            }

            const data = await response.json();
            setCards(data.cards || []);
        } catch (err: any) {
            console.error('Error loading cards:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500">Inzichten laden...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Fout: {error}</p>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Nog geen inzichten beschikbaar.</p>
                <p className="text-sm mt-2">Voeg wat data toe (slaap, energie, momenten) om patronen te ontdekken.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Jouw Inzichten</h2>
            {cards.map((card) => (
                <CoachingCardItem key={card.id} card={card} />
            ))}
        </div>
    );
}

function CoachingCardItem({ card }: { card: CoachingCard }) {
    const priorityColors = {
        1: 'border-red-300 bg-red-50',
        2: 'border-yellow-300 bg-yellow-50',
        3: 'border-blue-300 bg-blue-50',
    };

    const typeIcons = {
        pattern: '🔍',
        insight: '💡',
        growth_edge: '🌱',
        health: '❤️',
        relationship: '🤝',
        authenticity: '✨',
        win: '🎉',
    };

    return (
        <div className={`border-2 rounded-lg p-4 ${priorityColors[card.priority]}`}>
            <div className="flex items-start gap-3">
                <div className="text-2xl">{typeIcons[card.type]}</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{card.observation}</h3>

                    {card.reasoning && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-700">{card.reasoning}</p>
                        </div>
                    )}

                    {card.blindspot && (
                        <div className="mb-3 p-3 bg-white/50 rounded border border-orange-200">
                            <p className="text-sm font-medium text-orange-800">⚠️ Blinde vlek:</p>
                            <p className="text-sm text-gray-700 mt-1">{card.blindspot}</p>
                        </div>
                    )}

                    {card.question && (
                        <div className="mb-3 p-3 bg-white/50 rounded">
                            <p className="text-sm font-medium text-gray-800">❓ Vraag voor jou:</p>
                            <p className="text-sm text-gray-700 mt-1 italic">{card.question}</p>
                        </div>
                    )}

                    {card.suggested_action && (
                        <div className="mb-3">
                            <p className="text-sm font-medium text-gray-800">💪 Volgende stap:</p>
                            <p className="text-sm text-gray-700 mt-1">{card.suggested_action}</p>
                        </div>
                    )}

                    {card.how_to_implement && (
                        <div className="mb-3 p-3 bg-white/50 rounded border border-green-200">
                            <p className="text-sm font-medium text-green-800">✅ Hoe:</p>
                            <p className="text-sm text-gray-700 mt-1">{card.how_to_implement}</p>
                        </div>
                    )}

                    {card.evidence && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-xs text-gray-500">
                                Gebaseerd op {card.evidence.data_points} datapunten
                                {card.evidence.confidence && ` (${(card.evidence.confidence * 100).toFixed(0)}% zekerheid)`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
