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
        <div className="zeus-card rounded-3xl p-8 border border-[#2d3436] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#FF6B00] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-[#FF6B00]/10 rounded-xl border border-[#FF6B00]/20">
                    <Zap className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white font-['Orbitron',sans-serif] tracking-wide">
                        QUICK <span className="text-[#FF6B00]">CAPTURE</span>
                    </h2>
                    <p className="text-[#C5C6C7] text-xs uppercase tracking-widest opacity-70">
                        Log thoughts • Energy • Mood
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
                <div className="relative group">
                    <textarea
                        value={moment}
                        onChange={(e) => setMoment(e.target.value)}
                        placeholder="Input data stream..."
                        className="w-full h-32 bg-[#0B0C10] text-[#C5C6C7] border border-[#2d3436] rounded-xl p-4 focus:ring-0 focus:border-[#FF6B00] transition-all duration-300 resize-none placeholder-gray-700 font-mono text-sm shadow-inner group-hover:border-[#FF6B00]/50"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 font-mono">
                        {moment.length} CHARS
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        {lastSaved && (
                            <span className="text-[#66FCF1] text-xs font-mono flex items-center gap-1 animate-fade-in">
                                <Clock className="w-3 h-3" />
                                DATA SAVED
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!moment.trim() || isSubmitting}
                        className="px-6 py-3 bg-[#FF6B00] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#ff8533] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(255,107,0,0.2)] hover:shadow-[0_0_25px_rgba(255,107,0,0.4)] flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                UPLOADING...
                            </>
                        ) : (
                            <>
                                SAVE ENTRY
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
