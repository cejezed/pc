import React, { useState } from 'react';
import { Save, Mail, Smartphone, Clock, Check } from 'lucide-react';

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

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: {
      budget_alerts: true,
      invoice_due: true,
      subscription_cancel: true,
      weekly_summary: true
    },
    push: {
      affirmation_reminders: true,
      habit_checkins: true,
      task_deadlines: true,
      journal_reminder: true
    },
    quiet_hours: {
      start: '22:00',
      end: '08:00'
    }
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const emailLabels = {
    budget_alerts: 'Budget waarschuwingen',
    invoice_due: 'Factuur vervaldatum',
    subscription_cancel: 'Abonnement opzegtermijn',
    weekly_summary: 'Wekelijkse samenvatting'
  };

  const pushLabels = {
    affirmation_reminders: 'Affirmation reminders',
    habit_checkins: 'Habit check-ins',
    task_deadlines: 'Taak deadlines',
    journal_reminder: 'Journal reminder (20:00)'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* Email Notificaties */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-[#2D9CDB]" />
          <h2 className="text-xl font-bold text-[#0A2540]">Email notificaties</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Ontvang belangrijke updates via email
        </p>

        <div className="space-y-3">
          {Object.entries(notifications.email).map(([key, value]) => (
            <label 
              key={key} 
              className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setNotifications({
                  ...notifications,
                  email: { ...notifications.email, [key]: e.target.checked }
                })}
                className="w-5 h-5 text-[#2D9CDB] rounded focus:ring-[#2D9CDB]"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#2D9CDB] transition-colors">
                {emailLabels[key as keyof typeof emailLabels]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Push Notificaties */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-[#2D9CDB]" />
          <h2 className="text-xl font-bold text-[#0A2540]">Push notificaties</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Herinneringen en alerts op je apparaat
        </p>

        <div className="space-y-3">
          {Object.entries(notifications.push).map(([key, value]) => (
            <label 
              key={key} 
              className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setNotifications({
                  ...notifications,
                  push: { ...notifications.push, [key]: e.target.checked }
                })}
                className="w-5 h-5 text-[#2D9CDB] rounded focus:ring-[#2D9CDB]"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#2D9CDB] transition-colors">
                {pushLabels[key as keyof typeof pushLabels]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#2D9CDB]" />
          <h2 className="text-xl font-bold text-[#0A2540]">Stille uren</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Geen notificaties tijdens deze uren
        </p>

        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Van:</label>
            <input
              type="time"
              value={notifications.quiet_hours.start}
              onChange={(e) => setNotifications({
                ...notifications,
                quiet_hours: { ...notifications.quiet_hours, start: e.target.value }
              })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9CDB] focus:border-transparent"
            />
          </div>

          <span className="text-gray-400">tot</span>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tot:</label>
            <input
              type="time"
              value={notifications.quiet_hours.end}
              onChange={(e) => setNotifications({
                ...notifications,
                quiet_hours: { ...notifications.quiet_hours, end: e.target.value }
              })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9CDB] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-200 pt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2D9CDB] hover:bg-[#1D7AAC] disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>

        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Instellingen opgeslagen!
          </span>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
