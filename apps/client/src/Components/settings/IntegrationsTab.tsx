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
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--zeus-primary)]/20 rounded-lg">
              <Calendar className="w-6 h-6 text-[var(--zeus-primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--zeus-text)]">Google Calendar</h2>
              <p className="text-sm text-[var(--zeus-text-secondary)]">Sync je agenda met Brikx</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${calendarConnected
              ? 'bg-green-900/20 text-green-400 border border-green-500/30'
              : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]'
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
              <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                ICS URL:
              </label>
              <input
                type="text"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                placeholder="https://calendar.google.com/calendar/ical/..."
              />
              <p className="text-xs text-[var(--zeus-text-secondary)] mt-1">
                Vind je ICS URL in Google Calendar instellingen → Integraties
              </p>
            </div>

            {testResult === 'success' && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-200">Verbinding succesvol getest!</span>
              </div>
            )}

            {testResult === 'error' && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-200">Verbinding mislukt. Controleer de URL.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="btn-zeus-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testen...' : 'Test Verbinding'}
              </button>
              <button
                onClick={handleDisconnect}
                className="btn-zeus-secondary"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--zeus-text-secondary)] mb-4">
              Verbind je Google Calendar om je agenda te synchroniseren
            </p>
            <button
              onClick={handleConnect}
              className="btn-zeus-primary flex items-center gap-2 mx-auto"
            >
              <Link className="w-4 h-4" />
              Verbind Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Supabase */}
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <Database className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--zeus-text)]">Supabase</h2>
              <p className="text-sm text-[var(--zeus-text-secondary)]">Database & Authentication</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-900/20 text-green-400 border border-green-500/30 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Verbonden
          </span>
        </div>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-200 mb-1">All systems operational</p>
              <p className="text-green-300/80">
                Je database is verbonden en actief. Alle data wordt veilig opgeslagen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toekomstige Integraties */}
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-[var(--zeus-primary)]" />
          <h2 className="text-xl font-bold text-[var(--zeus-text)]">Toekomstige integraties</h2>
        </div>
        <p className="text-sm text-[var(--zeus-text-secondary)] mb-4">
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
              className="flex items-center justify-between p-4 bg-[var(--zeus-bg-secondary)] rounded-lg border border-[var(--zeus-border)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--zeus-text)]">{integration.name}</p>
                  <p className="text-xs text-[var(--zeus-text-secondary)]">{integration.desc}</p>
                </div>
              </div>
              <button
                disabled
                className="px-4 py-1.5 bg-[var(--zeus-border)] text-[var(--zeus-text-secondary)] rounded-lg text-sm font-semibold cursor-not-allowed opacity-50"
              >
                Binnenkort
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API & Webhooks */}
      <div className="bg-gradient-to-br from-[var(--zeus-bg-secondary)] to-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 text-[var(--zeus-text)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--zeus-primary)]/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-5 h-5 text-[var(--zeus-primary)]" />
            <h2 className="text-xl font-bold">API & Webhooks</h2>
          </div>
          <p className="text-sm text-[var(--zeus-text-secondary)] mb-4">
            Voor developers: Bouw je eigen integraties met de Brikx API
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 btn-zeus-primary text-sm"
          >
            Bekijk API Documentatie
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;
