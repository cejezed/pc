import React, { useState } from 'react';
import { Settings, Upload, User, Bell, Link } from 'lucide-react';

// Types
export type TabType = 'import-export' | 'profile' | 'notifications' | 'integrations';

type Tab = {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { id: 'import-export', label: 'Import/Export', icon: Upload },
  { id: 'profile', label: 'Profiel', icon: User },
  { id: 'notifications', label: 'Notificaties', icon: Bell },
  { id: 'integrations', label: 'Integraties', icon: Link }
];

type SettingsLayoutProps = {
  children: (activeTab: TabType) => React.ReactNode;
};

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('import-export');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-[#0A2540]" />
        <h1 className="text-3xl font-bold text-[#0A2540]">Instellingen</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-[#2D9CDB] text-[#2D9CDB]'
                  : 'text-gray-600 hover:text-[#2D9CDB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {children(activeTab)}
      </div>
    </div>
  );
};

export default SettingsLayout;