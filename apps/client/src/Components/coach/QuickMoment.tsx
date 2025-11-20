import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Zap, Heart, Frown, Smile, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

type MomentLabel = 'tired' | 'energy' | 'stress' | 'win' | 'authentic' | 'dimmed';

interface MomentOption {
    label: MomentLabel;
    icon: React.ReactNode;
    color: string;
    displayName: string;
}

const momentOptions: MomentOption[] = [
    { label: 'tired', icon: <Frown className="w-5 h-5" />, color: 'bg-gray-100 hover:bg-gray-200 text-gray-700', displayName: 'Moe' },
    { label: 'energy', icon: <Zap className="w-5 h-5" />, color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700', displayName: 'Energie' },
    { label: 'stress', icon: <AlertCircle className="w-5 h-5" />, color: 'bg-red-100 hover:bg-red-200 text-red-700', displayName: 'Stress' },
    { label: 'win', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-100 hover:bg-green-200 text-green-700', displayName: 'Win' },
    { label: 'authentic', icon: <Heart className="w-5 h-5" />, color: 'bg-pink-100 hover:bg-pink-200 text-pink-700', displayName: 'Authentiek' },
    { label: 'dimmed', icon: <Smile className="w-5 h-5 opacity-50" />, color: 'bg-purple-100 hover:bg-purple-200 text-purple-700', displayName: 'Gedimmed' },
];

export function QuickMoment() {
    const [selectedLabel, setSelectedLabel] = useState<MomentLabel | null>(null);
    const [intensity, setIntensity] = useState<number>(3);
    const [context, setContext] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSave() {
        if (!selectedLabel) return;

        try {
            setSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Niet ingelogd');
                return;
            }

            const response = await fetch('/api/moment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    label: selectedLabel,
                    intensity,
                    context: context.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Fout bij opslaan moment');
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedLabel(null);
                setIntensity(3);
                setContext('');
            }, 1500);
        } catch (error) {
            console.error('Error saving moment:', error);
            alert('Fout bij opslaan. Probeer opnieuw.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Snel Moment Vastleggen</h2>

            {/* Moment Type Selection */}
            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Hoe voel je je nu?</p>
                <div className="grid grid-cols-3 gap-2">
                    {momentOptions.map((option) => (
                        <button
                            key={option.label}
                            onClick={() => setSelectedLabel(option.label)}
                            className={`p-3 rounded-lg border-2 transition-all ${selectedLabel === option.label
                                    ? 'border-brikx-teal bg-teal-50'
                                    : 'border-transparent'
                                } ${option.color}`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                {option.icon}
                                <span className="text-xs font-medium">{option.displayName}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Intensity Slider */}
            {selectedLabel && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Intensiteit: {intensity}/5</p>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={intensity}
                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brikx-teal"
                    />
                </div>
            )}

            {/* Context Input */}
            {selectedLabel && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Context (optioneel)</p>
                    <input
                        type="text"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="bijv. 'with partner', 'after workout', 'during meeting'"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Tip: gebruik "with [naam]" voor relatie-patronen
                    </p>
                </div>
            )}

            {/* Save Button */}
            {selectedLabel && (
                <button
                    onClick={handleSave}
                    disabled={saving || success}
                    className="w-full py-3 bg-brikx-teal text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {success ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Opgeslagen!
                        </>
                    ) : saving ? (
                        'Opslaan...'
                    ) : (
                        'Moment Vastleggen'
                    )}
                </button>
            )}
        </div>
    );
}
