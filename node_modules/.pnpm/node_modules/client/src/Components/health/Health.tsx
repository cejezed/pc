// src/Components/health/Health.tsx - IMPORT FIX
import React, { useState } from 'react';
import { EnergieTab } from './energie-componenten';
import { WorkoutTab } from './workout-componenten'; // ✅ Was: WorkoutsTab
import { SlaapTab } from './slaap-componenten';
import { PijnTab } from './pijn-componenten';
import StressTab from './stress-componenten';
import { Zap, Dumbbell, Moon, Heart, Brain } from 'lucide-react';

type TabType = 'energie' | 'workout' | 'slaap' | 'pijn' | 'stress';

const TABS = [
  { id: 'energie' as TabType, label: 'Energie', icon: Zap, color: 'text-orange-500' },
  { id: 'workout' as TabType, label: 'Workouts', icon: Dumbbell, color: 'text-green-500' },
  { id: 'slaap' as TabType, label: 'Slaap', icon: Moon, color: 'text-blue-500' },
  { id: 'pijn' as TabType, label: 'Pijn', icon: Heart, color: 'text-red-500' },
  { id: 'stress' as TabType, label: 'Stress', icon: Brain, color: 'text-pink-500' },
];

export default function Health() {
  const [activeTab, setActiveTab] = useState<TabType>('energie');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-brikx-dark mb-2">Health Tracker</h1>
        <p className="text-gray-600">Volg je energie, slaap, workouts en welzijn</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-brikx font-semibold transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-brikx-teal text-white shadow-lg'
                : 'bg-white border border-gray-300 hover:border-brikx-teal text-gray-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-white' : color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'energie' && <EnergieTab />}
        {activeTab === 'workout' && <WorkoutTab />}
        {activeTab === 'slaap' && <SlaapTab />}
        {activeTab === 'pijn' && <PijnTab />}
        {activeTab === 'stress' && <StressTab />}
      </div>
    </div>
  );
}