// src/Components/health/Health.tsx - IMPORT FIX
import React, { useState } from 'react';
import { EnergieTab } from './energie-componenten';
import { WorkoutTab } from './workout-componenten';
import { SlaapTab } from './slaap-componenten';
import { PijnTab } from './pijn-componenten';
import StressTab from './stress-componenten';
import { Zap, Dumbbell, Moon, Heart, Brain, CalendarCheck } from 'lucide-react';
import { DagschemaTab } from './dagschema-componenten';

type TabType = 'energie' | 'workout' | 'slaap' | 'pijn' | 'stress' | 'dagschema';

const TABS = [
  { id: 'energie' as TabType, label: 'Energie', icon: Zap, color: 'text-orange-500' },
  { id: 'workout' as TabType, label: 'Workouts', icon: Dumbbell, color: 'text-green-500' },
  { id: 'slaap' as TabType, label: 'Slaap', icon: Moon, color: 'text-blue-500' },
  { id: 'pijn' as TabType, label: 'Pijn', icon: Heart, color: 'text-red-500' },
  { id: 'stress' as TabType, label: 'Stress', icon: Brain, color: 'text-pink-500' },
  { id: 'dagschema' as TabType, label: 'Dagschema', icon: CalendarCheck, color: 'text-teal-500' },
];

export default function Health() {
  const [activeTab, setActiveTab] = useState<TabType>('energie');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === id
                ? 'bg-[var(--zeus-primary)] text-white shadow-[0_0_15px_var(--zeus-primary-glow)]'
                : 'bg-[var(--zeus-card)] border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]'
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
        {activeTab === 'dagschema' && <DagschemaTab />}
      </div>
    </div>
  );
}