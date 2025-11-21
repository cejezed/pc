import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Upload,
  Download,
  User,
  Bell,
  Link as LinkIcon,
  Save,
  FileText,
  Calendar,
  Check,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Types
type TabType = 'import-export' | 'profile' | 'notifications' | 'integrations';

type DataType =
  | 'time-entries'
  | 'projects'
  | 'invoices'
  | 'ideas'
  | 'tasks'
  | 'habits'
  | 'journal'
  | 'goals';

type ExportFormat = 'csv' | 'json' | 'excel';

type ProfileData = {
  company_name: string;
  kvk_number: string;
  btw_number: string;
  address: string;
  iban: string;
  logo_url: string;
  name: string;
  email: string;
  phone: string;
};

type NotificationSettings = {
  email: {
    budget_alerts: boolean;
    invoice_due: boolean;
    subscription_cancel: boolean;
    weekly_summary: boolean;
  };
  push: {
    affirmation_reminders: boolean;
    habit_checkins: boolean;
    task_deadlines: boolean;
    journal_reminder: boolean;
  };
  quiet_hours: {
    start: string;
    end: string;
  };
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabType>('import-export');

  // Import/Export state
  const [importDataType, setImportDataType] = useState<DataType>('time-entries');
  const [exportDataType, setExportDataType] = useState<DataType>('time-entries');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportDateFrom, setExportDateFrom] = useState('2024-01-01');
  const [exportDateTo, setExportDateTo] = useState('2024-12-31');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    company_name: 'Brikx Architecture',
    kvk_number: '12345678',
    btw_number: 'NL123456789B01',
    address: 'Hoofdstraat 123, 1234 AB Amsterdam',
    iban: 'NL12ABCD0123456789',
    logo_url: '',
    name: 'Jan Brikx',
    email: 'jan@brikx.nl',
    phone: '+31 6 12345678',
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      budget_alerts: true,
      invoice_due: true,
      subscription_cancel: true,
      weekly_summary: true,
    },
    push: {
      affirmation_reminders: true,
      habit_checkins: true,
      task_deadlines: true,
      journal_reminder: true,
    },
    quiet_hours: {
      start: '22:00',
      end: '08:00',
    },
  });

  // Integrations state
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [calendarUrl, setCalendarUrl] = useState('https://calendar.google.com/calendar/ical/...');

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!uploadedFile) return;

    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
      setUploadedFile(null);
    }, 2000);
  };

  const handleExport = () => {
    const filename = `${exportDataType}-export-${new Date().toISOString().split('T')[0]
      }.${exportFormat}`;
    alert(`Export gestart: ${filename}`);
  };

  const handleBackupDownload = () => {
    alert('Volledige backup wordt gedownload...');
  };

  const handleProfileSave = () => {
    alert('Profiel opgeslagen!');
  };

  const handleNotificationsSave = () => {
    alert('Notificatie instellingen opgeslagen!');
  };

  const dataTypeLabels: Record<DataType, string> = {
    'time-entries': 'Uren',
    projects: 'Projecten',
    invoices: 'Facturen',
    ideas: 'Ideeën',
    tasks: 'Taken',
    habits: 'Gewoontes',
    journal: 'Dagboek',
    goals: 'Doelen',
  };

  const tabs = [
    { id: 'import-export', label: 'Import/Export', icon: Upload },
    { id: 'profile', label: 'Profiel', icon: User },
    { id: 'notifications', label: 'Notificaties', icon: Bell },
    { id: 'integrations', label: 'Integraties', icon: LinkIcon },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-[var(--zeus-text)]" />
        <h1 className="text-3xl font-bold text-[var(--zeus-text)]">Instellingen</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--zeus-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${activeTab === tab.id
                  ? 'border-b-2 border-[var(--zeus-primary)] text-[var(--zeus-primary)]'
                  : 'text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div className="space-y-6">
          {/* Import Section */}
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-[var(--zeus-primary)]" />
              <h2 className="text-xl font-bold text-[var(--zeus-text)]">CSV Importeren</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Selecteer data type:
                </label>
                <select
                  value={importDataType}
                  onChange={(e) => setImportDataType(e.target.value as DataType)}
                  className="w-full max-w-md bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                >
                  {Object.entries(dataTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Upload CSV:
                </label>
                <div className="border-2 border-dashed border-[var(--zeus-border)] rounded-lg p-8 text-center hover:border-[var(--zeus-primary)] transition-colors group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-[var(--zeus-text-secondary)] group-hover:text-[var(--zeus-primary)] mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-medium text-[var(--zeus-text)]">
                      {uploadedFile ? uploadedFile.name : 'Sleep bestand of klik om te uploaden'}
                    </p>
                    <p className="text-xs text-[var(--zeus-text-secondary)] mt-1">CSV formaat</p>
                  </label>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">LET OP:</p>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                      <li>CSV moet headers bevatten</li>
                      <li>Met id = update bestaande rij, zonder id = nieuwe rij</li>
                      <li>Download eerst een export als template</li>
                    </ul>
                  </div>
                </div>
              </div>

              {importSuccess && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-200">
                    Import succesvol voltooid!
                  </span>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!uploadedFile || importing}
                className="btn-zeus-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importeren
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-[var(--zeus-primary)]" />
              <h2 className="text-xl font-bold text-[var(--zeus-text)]">Export</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Selecteer data type:
                </label>
                <select
                  value={exportDataType}
                  onChange={(e) => setExportDataType(e.target.value as DataType)}
                  className="w-full max-w-md bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                >
                  {Object.entries(dataTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                    Van:
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                    Tot:
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">
                  Formaat:
                </label>
                <div className="flex gap-4">
                  {(['csv', 'json', 'excel'] as ExportFormat[]).map((format) => (
                    <label key={format} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                        className="w-4 h-4 text-[var(--zeus-primary)] focus:ring-[var(--zeus-primary)] bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)]"
                      />
                      <span className="text-sm font-medium text-[var(--zeus-text)] uppercase">
                        {format}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-900/20"
              >
                <Download className="w-4 h-4" />
                Download Export
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-[var(--zeus-primary)]" />
              <h2 className="text-xl font-bold text-[var(--zeus-text)]">Backup & Restore</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--zeus-text-secondary)] mb-3">Volledige backup:</p>
                <button
                  onClick={handleBackupDownload}
                  className="bg-[var(--zeus-bg-secondary)] hover:bg-[var(--zeus-bg-secondary)]/80 border border-[var(--zeus-border)] text-[var(--zeus-text)] px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Alle Data (ZIP)
                </button>
                <p className="text-xs text-[var(--zeus-text-secondary)] mt-2">Laatste backup: 25 Sep 2024 14:32</p>
              </div>

              <div className="border-t border-[var(--zeus-border)] pt-4">
                <p className="text-sm font-medium text-[var(--zeus-text-secondary)] mb-3">
                  Restore from backup:
                </p>
                <input
                  type="file"
                  accept=".zip"
                  className="block w-full text-sm text-[var(--zeus-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--zeus-primary)] file:text-white hover:file:bg-[var(--zeus-primary)]/80"
                />
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">
                    Dit overschrijft alle huidige data! Maak eerst een backup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--zeus-text)] mb-4">
              Bedrijfsgegevens (voor facturen)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Bedrijfsnaam</label>
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">KVK nummer</label>
                <input
                  type="text"
                  value={profile.kvk_number}
                  onChange={(e) => setProfile({ ...profile, kvk_number: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">BTW nummer</label>
                <input
                  type="text"
                  value={profile.btw_number}
                  onChange={(e) => setProfile({ ...profile, btw_number: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">IBAN</label>
                <input
                  type="text"
                  value={profile.iban}
                  onChange={(e) => setProfile({ ...profile, iban: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Adres</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-[var(--zeus-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--zeus-primary)] file:text-white hover:file:bg-[var(--zeus-primary)]/80"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--zeus-border)] pt-6">
            <h2 className="text-xl font-bold text-[var(--zeus-text)] mb-4">Persoonlijk</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Naam</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleProfileSave}
            className="btn-zeus-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--zeus-text)] mb-4">Email notificaties</h2>
            <div className="space-y-3">
              {Object.entries(notifications.email).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, [key]: e.target.checked },
                      })
                    }
                    className="w-5 h-5 text-[var(--zeus-primary)] rounded focus:ring-[var(--zeus-primary)] bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)]"
                  />
                  <span className="text-sm font-medium text-[var(--zeus-text-secondary)] group-hover:text-[var(--zeus-primary)] transition-colors">
                    {key === 'budget_alerts' && 'Budget waarschuwingen'}
                    {key === 'invoice_due' && 'Factuur vervaldatum'}
                    {key === 'subscription_cancel' && 'Abonnement opzegtermijn'}
                    {key === 'weekly_summary' && 'Weekly summary'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--zeus-border)] pt-6">
            <h2 className="text-xl font-bold text-[var(--zeus-text)] mb-4">Push notificaties</h2>
            <div className="space-y-3">
              {Object.entries(notifications.push).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        push: { ...notifications.push, [key]: e.target.checked },
                      })
                    }
                    className="w-5 h-5 text-[var(--zeus-primary)] rounded focus:ring-[var(--zeus-primary)] bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)]"
                  />
                  <span className="text-sm font-medium text-[var(--zeus-text-secondary)] group-hover:text-[var(--zeus-primary)] transition-colors">
                    {key === 'affirmation_reminders' && 'Affirmation reminders'}
                    {key === 'habit_checkins' && 'Habit check-ins'}
                    {key === 'task_deadlines' && 'Taak deadlines'}
                    {key === 'journal_reminder' && 'Journal reminder (20:00)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--zeus-border)] pt-6">
            <h2 className="text-xl font-bold text-[var(--zeus-text)] mb-4">Quiet hours</h2>
            <div className="flex items-center gap-4">
              <input
                type="time"
                value={notifications.quiet_hours.start}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    quiet_hours: { ...notifications.quiet_hours, start: e.target.value },
                  })
                }
                className="bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              />
              <span className="text-[var(--zeus-text-secondary)]">tot</span>
              <input
                type="time"
                value={notifications.quiet_hours.end}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    quiet_hours: { ...notifications.quiet_hours, end: e.target.value },
                  })
                }
                className="bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleNotificationsSave}
            className="btn-zeus-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[var(--zeus-primary)]" />
                <div>
                  <h2 className="text-xl font-bold text-[var(--zeus-text)]">Google Calendar</h2>
                  <p className="text-sm text-[var(--zeus-text-secondary)]">Sync je agenda met Brikx</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${calendarConnected ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border border-[var(--zeus-border)]'
                  }`}
              >
                {calendarConnected ? '✓ Geactiveerd' : 'Niet verbonden'}
              </span>
            </div>

            {calendarConnected && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--zeus-text-secondary)] mb-2">ICS URL:</label>
                  <input
                    type="text"
                    value={calendarUrl}
                    onChange={(e) => setCalendarUrl(e.target.value)}
                    className="w-full bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] transition-all"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="btn-zeus-primary text-sm">
                    Test Verbinding
                  </button>
                  <button
                    onClick={() => setCalendarConnected(false)}
                    className="bg-[var(--zeus-bg-secondary)] hover:bg-[var(--zeus-bg-secondary)]/80 border border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    Ontkoppelen
                  </button>
                </div>
              </div>
            )}

            {!calendarConnected && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCalendarConnected(true)}
                  className="btn-zeus-primary text-sm"
                >
                  Opnieuw verbinden
                </button>
                <span className="text-sm text-[var(--zeus-text-secondary)]">
                  Verbind je Google Calendar via ICS.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
