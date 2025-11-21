// src/Components/eten/pages/Instellingen.tsx
import React, { useState } from 'react';
import { Save, Trash2, Plus, AlertTriangle, Settings } from 'lucide-react';
import { useDietSettings, useSaveDietSettings } from '../hooks';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

export default function InstellingenPage() {
  const { data: settings, isLoading } = useDietSettings();
  const updateSettings = useSaveDietSettings();

  const [newCategory, setNewCategory] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Settings are automatically saved via React Query mutation
    // but we can add a manual save button if needed
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--zeus-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--zeus-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] text-[var(--zeus-text-secondary)] p-4 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--zeus-card)] p-6 rounded-2xl border border-[var(--zeus-border)] shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--zeus-primary)] to-transparent opacity-50"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--zeus-text)] tracking-tight mb-1 drop-shadow-[0_2px_10px_var(--zeus-primary-glow)] flex items-center gap-3">
              <Settings className="w-8 h-8 text-[var(--zeus-primary)]" />
              INSTELLINGEN <span className="text-[var(--zeus-primary)]">ZEUS-X</span>
            </h1>
            <p className="text-[var(--zeus-text-secondary)] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--zeus-accent)] animate-pulse"></span>
              Configureer je keuken
            </p>
          </div>
        </div>

        <Card className="zeus-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[var(--zeus-text)]">Algemeen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="defaultServings" className="text-sm font-medium text-[var(--zeus-text-secondary)]">
                Standaard aantal personen
              </label>
              <Input
                id="defaultServings"
                type="number"
                min="1"
                defaultValue={settings?.default_servings || 2}
                onChange={(e) => updateSettings.mutate({ default_servings: parseInt(e.target.value) })}
                className="zeus-input max-w-[200px]"
              />
              <p className="text-xs text-[var(--zeus-text-secondary)]">
                Dit aantal wordt gebruikt als standaard bij nieuwe recepten.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="zeus-card border-red-900/50 bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Gevarenzone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-400">
              Deze acties kunnen niet ongedaan worden gemaakt. Wees voorzichtig.
            </p>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Alle data wissen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
