import React, { useState } from 'react';
import { Calendar, Database, Link, Check, X, AlertCircle, ExternalLink } from 'lucide-react';

const IntegrationsTab = () => {
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [calendarUrl, setCalendarUrl] = useState('https://calendar.google.com/calendar/ical/example@gmail.com/private-abc123/basic.ics');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setTestResult('success');
      setTimeout(() => setTestResult(null), 3000);
    }, 1500);
  };

  const handleDisconnect = () => {
    if (confirm('Weet je zeker dat je de verbinding wilt verbreken?')) {
      setCalendarConnected(false);
      setCalendarUrl('');
    }
  };

  const handleConnect = () => {
    setCalendarConnected(true);
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A2540]">Google Calendar</h2>
              <p className="text-sm text-gray-500">Sync je agenda met Brikx</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
            calendarConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {calendarConnected ? (
              <>
                <Check className="w-3 h-3" />
                Geactiveerd
              </>
            ) : (
              'Niet verbonden'
            )}
          </span>
        </div>

        {calendarConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ICS URL:
              </label>
              <input
                type="text"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9CDB] focus:border-transparent"
                placeholder="https://calendar.google.com/calendar/ical/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Vind je ICS URL in Google Calendar instellingen → Integraties
              </p>
            </div>

            {testResult === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Verbinding succesvol getest!</span>
              </div>
            )}

            {testResult === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">Verbinding mislukt. Controleer de URL.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-[#2D9CDB] hover:bg-[#1D7AAC] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                {testing ? 'Testen...' : 'Test Verbinding'}
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">
              Verbind je Google Calendar om je agenda te synchroniseren
            </p>
            <button
              onClick={handleConnect}
              className="bg-[#2D9CDB] hover:bg-[#1D7AAC] text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              <Link className="w-4 h-4" />
              Verbind Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Supabase */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0A2540]">Supabase</h2>
              <p className="text-sm text-gray-500">Database & Authentication</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Verbonden
          </span>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-800 mb-1">All systems operational</p>
              <p className="text-green-700">
                Je database is verbonden en actief. Alle data wordt veilig opgeslagen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toekomstige Integraties */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-[#2D9CDB]" />
          <h2 className="text-xl font-bold text-[#0A2540]">Toekomstige integraties</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Binnenkort beschikbaar
        </p>

        <div className="space-y-3">
          {[
            { name: 'Exact Online', desc: 'Facturatie sync', icon: '💼' },
            { name: 'Moneybird', desc: 'Boekhoud software', icon: '📊' },
            { name: 'Zapier', desc: 'Webhooks & automations', icon: '⚡' }
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{integration.name}</p>
                  <p className="text-xs text-gray-500">{integration.desc}</p>
                </div>
              </div>
              <button
                disabled
                className="px-4 py-1.5 bg-gray-200 text-gray-400 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Binnenkort
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API & Webhooks */}
      <div className="bg-gradient-to-br from-[#0A2540] to-[#0A3552] rounded-xl border border-[#1D3A5C] p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-5 h-5 text-[#2D9CDB]" />
          <h2 className="text-xl font-bold">API & Webhooks</h2>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Voor developers: Bouw je eigen integraties met de Brikx API
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D9CDB] hover:bg-[#1D7AAC] rounded-lg text-sm font-semibold transition-all"
        >
          Bekijk API Documentatie
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default IntegrationsTab;
