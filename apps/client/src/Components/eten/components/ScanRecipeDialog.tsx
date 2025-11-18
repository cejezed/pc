// src/Components/eten/components/ScanRecipeDialog.tsx
import React, { useState, useCallback } from 'react';
import { X, Upload, Loader2, Camera, CheckCircle } from 'lucide-react';
import { useCreateRecipe } from '../hooks';
import { useMutation } from '@tanstack/react-query';
import type { ScannedRecipeDraft, ScannedIngredient } from '../types';
import { getAuthToken } from '@/lib/AuthContext';

interface ScanRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ScanStep = 'upload' | 'scanning' | 'review' | 'saving' | 'success';

export default function ScanRecipeDialog({ isOpen, onClose, onSuccess }: ScanRecipeDialogProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<ScannedRecipeDraft | null>(null);

  const createRecipe = useCreateRecipe();

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/recipes/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to scan recipe');
      }

      const data = await response.json();
      return data.recipeDraft as ScannedRecipeDraft;
    },
    onSuccess: (data) => {
      setRecipeDraft(data);
      setStep('review');
    },
    onError: (error: any) => {
      alert(`Scan mislukt: ${error.message}`);
      setStep('upload');
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecteer een afbeelding');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Afbeelding is te groot (max 10MB)');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleScan = () => {
    if (!selectedFile) return;
    setStep('scanning');
    scanMutation.mutate(selectedFile);
  };

  const handleSaveRecipe = async () => {
    if (!recipeDraft) return;

    setStep('saving');

    try {
      await createRecipe.mutateAsync({
        title: recipeDraft.title,
        source_type: 'scan',
        source_url: undefined,
        source_note: recipeDraft.notes,
        default_servings: recipeDraft.default_servings,
        prep_time_min: recipeDraft.prep_time_min ?? undefined,
        instructions: recipeDraft.instructions.join('\n\n'),
        tags: recipeDraft.tags,
        image_url: recipeDraft.image_url,
        ingredients: recipeDraft.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity ?? undefined,
          unit: ing.unit ?? undefined,
          category: ing.category ?? undefined,
          is_optional: ing.is_optional,
        })),
      });

      setStep('success');
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      alert(`Opslaan mislukt: ${error.message}`);
      setStep('review');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setRecipeDraft(null);
    onClose();
  };

  const updateRecipeDraft = (updates: Partial<ScannedRecipeDraft>) => {
    if (!recipeDraft) return;
    setRecipeDraft({ ...recipeDraft, ...updates });
  };

  const updateIngredient = (index: number, updates: Partial<ScannedIngredient>) => {
    if (!recipeDraft) return;
    const newIngredients = [...recipeDraft.ingredients];
    newIngredients[index] = { ...newIngredients[index], ...updates };
    setRecipeDraft({ ...recipeDraft, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    if (!recipeDraft) return;
    const newIngredients = recipeDraft.ingredients.filter((_, i) => i !== index);
    setRecipeDraft({ ...recipeDraft, ingredients: newIngredients });
  };

  const addIngredient = () => {
    if (!recipeDraft) return;
    const newIngredient: ScannedIngredient = {
      name: '',
      quantity: null,
      unit: null,
      category: null,
      is_optional: false,
    };
    setRecipeDraft({
      ...recipeDraft,
      ingredients: [...recipeDraft.ingredients, newIngredient],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-brikx-teal" />
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'upload' && 'Scan Receptkaart'}
              {step === 'scanning' && 'Aan het scannen...'}
              {step === 'review' && 'Review & Bewerk'}
              {step === 'saving' && 'Opslaan...'}
              {step === 'success' && 'Opgeslagen!'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'scanning' || step === 'saving'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-brikx-teal transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Sleep je receptkaart hier of klik om te uploaden
                </p>
                <p className="text-sm text-gray-600">
                  Ondersteund: JPG, PNG, HEIC, WebP (max 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {previewUrl && (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
                  </div>
                  <button
                    onClick={handleScan}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Scan Receptkaart
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-brikx-teal animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900">Recept wordt gescand...</p>
              <p className="text-sm text-gray-600 mt-2">Dit kan even duren</p>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && recipeDraft && (
            <div className="space-y-6">
              {/* Recipe Image */}
              {recipeDraft.image_url && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={recipeDraft.image_url} alt="Recipe" className="w-full h-48 object-cover" />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={recipeDraft.title}
                  onChange={(e) => updateRecipeDraft({ title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                />
              </div>

              {/* Servings & Prep Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aantal personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={recipeDraft.default_servings}
                    onChange={(e) => updateRecipeDraft({ default_servings: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bereidingstijd (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={recipeDraft.prep_time_min || ''}
                    onChange={(e) => updateRecipeDraft({ prep_time_min: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (komma gescheiden)
                </label>
                <input
                  type="text"
                  value={recipeDraft.tags.join(', ')}
                  onChange={(e) => updateRecipeDraft({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                  placeholder="bijv. kip, rijst, snel"
                />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ingrediënten ({recipeDraft.ingredients.length})
                  </label>
                  <button
                    onClick={addIngredient}
                    className="text-sm text-brikx-teal hover:text-brikx-teal-dark font-medium"
                  >
                    + Toevoegen
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recipeDraft.ingredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(index, { name: e.target.value })}
                        placeholder="Naam"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        value={ing.quantity || ''}
                        onChange={(e) => updateIngredient(index, { quantity: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="Hoeveelheid"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        value={ing.unit || ''}
                        onChange={(e) => updateIngredient(index, { unit: e.target.value || null })}
                        placeholder="Eenheid"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm"
                      />
                      <button
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bereidingsstappen
                </label>
                <textarea
                  value={recipeDraft.instructions.join('\n\n')}
                  onChange={(e) => updateRecipeDraft({ instructions: e.target.value.split('\n\n').filter(Boolean) })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                  placeholder="Elke stap op een nieuwe regel (gescheiden door lege regel)"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notities (optioneel)
                </label>
                <textarea
                  value={recipeDraft.notes}
                  onChange={(e) => updateRecipeDraft({ notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
                  placeholder="Bijv. merknaam, versie, etc."
                />
              </div>
            </div>
          )}

          {/* Step 4: Saving */}
          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-brikx-teal animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900">Recept wordt opgeslagen...</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-xl font-bold text-gray-900">Recept opgeslagen!</p>
              <p className="text-sm text-gray-600 mt-2">De pagina wordt automatisch ververst</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSaveRecipe}
              disabled={!recipeDraft?.title}
              className="px-6 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Recept Opslaan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
