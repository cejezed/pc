// src/Components/eten/index.tsx
// Main entry point for Mijn Keuken module

import React, { useState } from 'react';
import { ChefHat, Calendar, ShoppingCart, Settings, BookOpen } from 'lucide-react';
import ReceptenPage from './pages/Recepten';
import WeekplannerPage from './pages/Weekplanner';
import BoodschappenPage from './pages/Boodschappen';
import InstellingenPage from './pages/Instellingen';

type TabType = 'week' | 'recepten' | 'boodschappen' | 'instellingen';

const TABS = [
  { id: 'week' as TabType, label: 'Weekplanner', icon: Calendar },
  { id: 'recepten' as TabType, label: 'Recepten', icon: BookOpen },
  { id: 'boodschappen' as TabType, label: 'Boodschappen', icon: ShoppingCart },
  { id: 'instellingen' as TabType, label: 'Instellingen', icon: Settings },
];

export default function MijnKeuken() {
  const [activeTab, setActiveTab] = useState<TabType>('week');

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)]">
      {/* Tabs */}
      <div className="bg-[var(--zeus-card)] border-b border-[var(--zeus-border)] sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === id
                    ? 'bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]'
                    : 'bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[calc(100vh-200px)]">
        {activeTab === 'week' && <WeekplannerPage />}
        {activeTab === 'recepten' && <ReceptenPage />}
        {activeTab === 'boodschappen' && <BoodschappenPage />}
        {activeTab === 'instellingen' && <InstellingenPage />}
      </div>
    </div>
  );
}
