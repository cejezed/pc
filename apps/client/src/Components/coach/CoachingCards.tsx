import React, { useEffect, useState } from 'react';
import { Lightbulb, ArrowRight, Brain, Target, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CoachingCard {
    id: string;
    title: string;
    type: 'insight' | 'question' | 'action';
    content: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
}

export function CoachingCards() {
    const [cards, setCards] = useState<CoachingCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch('/api/coach/cards', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setCards(data.cards || []);
                }
            } catch (error) {
                console.error('Error fetching cards:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCards();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zeus-accent" />
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="text-center p-8 zeus-card rounded-3xl border border-zeus-border">
                <Brain className="w-12 h-12 text-zeus-text-secondary mx-auto mb-4" />
                <p className="text-zeus-text-secondary">Nog geen inzichten beschikbaar. Blijf je data bijhouden!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card) => (
                <div
                    key={card.id}
                    className="zeus-card rounded-3xl p-6 border border-zeus-border relative overflow-hidden group hover:border-zeus-accent/50 transition-colors duration-300"
                >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-zeus-accent opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`p-3 rounded-2xl ${card.type === 'insight' ? 'bg-zeus-accent/10 text-zeus-accent' :
                                card.type === 'action' ? 'bg-green-500/10 text-green-500' :
                                    'bg-purple-500/10 text-purple-500'
                            }`}>
                            {card.type === 'insight' && <Lightbulb className="w-6 h-6" />}
                            {card.type === 'action' && <Target className="w-6 h-6" />}
                            {card.type === 'question' && <Brain className="w-6 h-6" />}
                        </div>
                        {card.priority === 'high' && (
                            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-mono rounded border border-red-200 uppercase tracking-wider">
                                Hoge Prioriteit
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-zeus-primary mb-2 font-['Orbitron',sans-serif] tracking-wide relative z-10">
                        {card.title}
                    </h3>

                    <p className="text-zeus-text text-sm mb-4 leading-relaxed relative z-10">
                        {card.content}
                    </p>

                    <div className="bg-zeus-bg p-4 rounded-xl border border-zeus-border relative z-10">
                        <p className="text-xs text-zeus-text-secondary font-mono uppercase tracking-wider mb-1">Analyse</p>
                        <p className="text-xs text-zeus-text-secondary italic">"{card.reasoning}"</p>
                    </div>

                    {card.type === 'action' && (
                        <button className="mt-4 w-full py-3 bg-zeus-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zeus-accent/90 transition-colors shadow-lg flex items-center justify-center gap-2 relative z-10">
                            Start Actie <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
