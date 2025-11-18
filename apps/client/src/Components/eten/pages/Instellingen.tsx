// src/Components/eten/pages/Instellingen.tsx
import React, { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { useDietSettings, useSaveDietSettings } from '../hooks';
import type { DietType } from '../types';

export default function InstellingenPage() {
  const { data: settings } = useDietSettings();
  const saveSettings = useSaveDietSettings();

  const [defaultServings, setDefaultServings] = useState(2);
  const [dietType, setDietType] = useState<DietType>('geen');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [maxCooktime, setMaxCooktime] = useState<number | null>(null);

  const [newAllergy, setNewAllergy] = useState('');
  const [newExcluded, setNewExcluded] = useState('');

  useEffect(() => {
    if (settings) {
      setDefaultServings(settings.default_servings);
      setDietType(settings.diet_type);
      setAllergies(settings.allergies || []);
      setExcludedIngredients(settings.excluded_ingredients || []);
      setMaxCooktime(settings.max_cooktime_weekdays);
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings.mutateAsync({
      default_servings: defaultServings,
      diet_type: dietType,
      allergies,
      excluded_ingredients: excludedIngredients,
      max_cooktime_weekdays: maxCooktime,
    });
    alert('Instellingen opgeslagen!');
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(a => a !== allergy));
  };

  const addExcluded = () => {
    if (newExcluded.trim() && !excludedIngredients.includes(newExcluded.trim())) {
      setExcludedIngredients([...excludedIngredients, newExcluded.trim()]);
      setNewExcluded('');
    }
  };

  const removeExcluded = (ingredient: string) => {
    setExcludedIngredients(excludedIngredients.filter(i => i !== ingredient));
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-sm sm:text-base text-gray-600">Pas je dieet voorkeuren aan</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Default Servings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Standaard aantal personen
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={defaultServings}
            onChange={(e) => setDefaultServings(parseInt(e.target.value))}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
          />
        </div>

        {/* Diet Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dieet type
          </label>
          <select
            value={dietType}
            onChange={(e) => setDietType(e.target.value as DietType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
          >
            <option value="geen">Geen voorkeur</option>
            <option value="vega">Vegetarisch</option>
            <option value="vegan">Veganistisch</option>
            <option value="glutenvrij">Glutenvrij</option>
            <option value="lactosevrij">Lactosevrij</option>
          </select>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allergieën
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Recepten met deze ingrediënten krijgen een waarschuwing
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
              placeholder="Bijv. pinda's, gluten, lactose..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm sm:text-base"
            />
            <button
              onClick={addAllergy}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Toevoegen</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
              >
                {allergy}
                <button
                  onClick={() => removeAllergy(allergy)}
                  className="hover:text-red-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Excluded Ingredients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Uitgesloten ingrediënten
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Ingrediënten die je gewoon niet lust (geen allergie)
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={newExcluded}
              onChange={(e) => setNewExcluded(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExcluded()}
              placeholder="Bijv. koriander, olijven..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm sm:text-base"
            />
            <button
              onClick={addExcluded}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Toevoegen</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {excludedIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
              >
                {ingredient}
                <button
                  onClick={() => removeExcluded(ingredient)}
                  className="hover:text-gray-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Max Cooktime */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximale kooktijd op weekdagen (optioneel)
          </label>
          <select
            value={maxCooktime || ''}
            onChange={(e) => setMaxCooktime(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
          >
            <option value="">Geen limiet</option>
            <option value="15">15 minuten</option>
            <option value="20">20 minuten</option>
            <option value="25">25 minuten</option>
            <option value="30">30 minuten</option>
            <option value="45">45 minuten</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveSettings.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saveSettings.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Opslaan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Instellingen opslaan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
