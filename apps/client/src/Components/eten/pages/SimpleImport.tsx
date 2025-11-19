// src/Components/eten/pages/SimpleImport.tsx
import React, { useState } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SimpleImport() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/recipes/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Import failed: ${response.statusText}`);
            }

            setSuccess(`Recept "${data.title}" succesvol geïmporteerd!`);
            setTimeout(() => navigate('/recepten'), 2000);
        } catch (err: any) {
            setError(err.message || 'Fout bij importeren');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Recept Importeren (URL)</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recept URL
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.ah.nl/allerhande/recept/..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Importeren...' : 'Importeer Recept'}
                        </button>
                    </form>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Ondersteunde websites:</h3>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li>Albert Heijn (Allerhande)</li>
                        <li>Jumbo</li>
                        <li>Leuke Recepten</li>
                        <li>24Kitchen</li>
                        <li>En vele andere sites met recepten...</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
