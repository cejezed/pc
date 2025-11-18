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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat className="w-8 h-8 text-brikx-teal" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mijn Keuken</h1>
              <p className="text-sm text-gray-600">Plan je maaltijden en boodschappen</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-brikx-teal text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
