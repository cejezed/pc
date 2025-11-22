import React, { useState } from 'react';
import { Send, Zap, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function QuickMoment() {
    const [moment, setMoment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('moments')
                .insert({
                    user_id: session.user.id,
                    content: moment,
                    source: 'quick_capture',
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            setMoment('');
            setLastSaved(new Date());

            // Auto-hide success message after 3s
            setTimeout(() => setLastSaved(null), 3000);
        } catch (error) {
            console.error('Error saving moment:', error);
            alert('Failed to save moment. System error.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="zeus-card rounded-3xl p-8 border border-zeus-border relative overflow-hidden bg-white">
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-zeus-accent/10 rounded-xl border border-zeus-accent/20">
                    <Zap className="w-6 h-6 text-zeus-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zeus-primary tracking-wide">
                        QUICK <span className="text-zeus-accent">CAPTURE</span>
                    </h2>
                    <p className="text-zeus-text-secondary text-xs uppercase tracking-widest opacity-70">
                        Log thoughts • Energy • Mood
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
                <div className="relative group">
                    <textarea
                        value={moment}
                        onChange={(e) => setMoment(e.target.value)}
                        placeholder="Wat houdt je bezig?"
                        className="w-full h-32 bg-zeus-bg text-zeus-text border border-zeus-border rounded-xl p-4 focus:ring-2 focus:ring-zeus-accent focus:border-transparent transition-all duration-300 resize-none placeholder-zeus-text-secondary font-sans text-sm shadow-inner"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-zeus-text-secondary font-mono">
                        {moment.length} CHARS
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-zeus-accent text-xs font-mono flex items-center gap-1 animate-fade-in">
                                <Clock className="w-3 h-3" />
                                OPGESLAGEN
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!moment.trim() || isSubmitting}
                        className="px-6 py-3 bg-zeus-accent text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zeus-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                OPSLAAN...
                            </>
                        ) : (
                            <>
                                OPSLAAN
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
