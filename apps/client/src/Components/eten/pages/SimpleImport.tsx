import React, { useState } from 'react';
import { useAuth } from '../../../lib/AuthContext';

export default function SimpleImport() {
    const { user, session } = useAuth();
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [pingResult, setPingResult] = useState<string>('');

    const handlePing = async () => {
        try {
            const res = await fetch('/api/ping');
            if (res.ok) {
                const data = await res.json();
                setPingResult(`Success: ${JSON.stringify(data)}`);
            } else {
                setPingResult(`Error: ${res.status} ${res.statusText}`);
            }
        } catch (err: any) {
            setPingResult(`Network Error: ${err.message}`);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setStatus('loading');
        setMessage('Importing...');

        try {
            const res = await fetch('/api/recipes/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(`Success! Recipe imported: ${data.recipe?.title}`);
            } else {
                setStatus('error');
                setMessage(`Error: ${data.error || res.statusText}`);
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(`Network Error: ${err.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Simple Recipe Import Debugger</h1>

            {/* Ping Test Section */}
            <div className="mb-8 p-4 bg-gray-100 rounded-lg">
                <h2 className="font-semibold mb-2">1. API Connectivity Test</h2>
                <button
                    onClick={handlePing}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Ping /api/ping
                </button>
                {pingResult && (
                    <pre className="mt-2 p-2 bg-black text-green-400 rounded text-sm overflow-auto">
                        {pingResult}
                    </pre>
                )}
            </div>

            {/* Import Form Section */}
            <div className="p-4 bg-white border rounded-lg shadow">
                <h2 className="font-semibold mb-4">2. Import Recipe URL</h2>
                <form onSubmit={handleImport} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipe URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/recipe"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Importing...' : 'Import Recipe'}
                    </button>

                    {message && (
                        <div className={`p-3 rounded ${status === 'success' ? 'bg-green-100 text-green-800' :
                                status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                            }`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
