// src/Components/health/energie-componenten.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { 
  formatDateTime, 
  energyEmoji, 
  energyLabel, 
  moodEmoji,
  type Mood,
  type EnergyLevel 
} from "./helpers";

// Remove the duplicate type and function declarations that were causing conflicts

export function EnergieTab() {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
  const [mood, setMood] = useState<Mood>("neutral");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log({ energyLevel, mood, notes });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Energie & Stemming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Energy Level */}
            <div className="space-y-2">
              <Label>Energie Level</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{energyEmoji(energyLevel)}</span>
                <select 
                  value={energyLevel} 
                  onChange={(e) => setEnergyLevel(Number(e.target.value) as EnergyLevel)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>
                      {level} - {energyLabel(level as EnergyLevel)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label>Stemming</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{moodEmoji(mood)}</span>
                <select 
                  value={mood} 
                  onChange={(e) => setMood(e.target.value as Mood)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="terrible">Verschrikkelijk</option>
                  <option value="bad">Slecht</option>
                  <option value="neutral">Neutraal</option>
                  <option value="good">Goed</option>
                  <option value="great">Geweldig</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notities (optioneel)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hoe voel je je vandaag?"
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
              />
            </div>

            <Button type="submit" className="w-full">
              Opslaan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnergieTab;