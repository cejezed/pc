// src/Components/eten/components/ScanRecipeDialog.tsx
import React, { useState, useCallback } from 'react';
import { X, Upload, Loader2, Camera, CheckCircle } from 'lucide-react';
import { useCreateRecipe, parseErrorResponse } from '../hooks';
import { useMutation } from '@tanstack/react-query';
import type { ScannedRecipeDraft, ScannedIngredient } from '../types';
import { getAuthToken } from '@/lib/AuthContext';

interface ScanRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ScanStep = 'upload' | 'scanning' | 'review' | 'saving' | 'success';

const MAX_FILE_SIZE_MB = 10;

export default function ScanRecipeDialog({
  isOpen,
  onClose,
  onSuccess,
}: ScanRecipeDialogProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<ScannedRecipeDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createRecipe = useCreateRecipe();

  const resetState = () => {
    setStep('upload');
    setFileName(null);
    setPreviewUrl(null);
    setRecipeDraft(null);
    setErrorMessage(null);
  };

  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/recipes/scan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const message = await parseErrorResponse(response, 'Failed to scan recipe');
        throw new Error(message);
      }

      const data = await response.json();
      return data.recipeDraft as ScannedRecipeDraft;
    },
    onSuccess: (data) => {
      setRecipeDraft(data);
      setStep('review');
      setErrorMessage(null);
    },
    onError: (error: any) => {
      setErrorMessage(error?.message || 'Scan mislukt');
      alert(`Scan mislukt: ${error.message}`);
      setStep('upload');
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecteer een afbeelding');
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      alert(`Bestand is te groot (max ${MAX_FILE_SIZE_MB}MB)`);
      return;
    }

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('scanning');
    scanMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSaveRecipe = async () => {
    if (!recipeDraft) return;
    setStep('saving');

    try {
      // Map de ScannedRecipeDraft naar het API-type CreateRecipeInput
      await createRecipe.mutateAsync({
        title: recipeDraft.title,
        source_type: 'scan',
        default_servings: recipeDraft.default_servings,
        prep_time_min: recipeDraft.prep_time_min ?? undefined,
        instructions: recipeDraft.instructions.join('\n'),
        tags: recipeDraft.tags,
        image_url: recipeDraft.image_url,
        ingredients: recipeDraft.ingredients.map(
          (ing: ScannedIngredient, index: number) => ({
            name: ing.name,
            // null → undefined zodat het klopt met CreateIngredientInput
            quantity: ing.quantity ?? undefined,
            unit: ing.unit ?? undefined,
            category: ing.category ?? undefined,
            is_optional: ing.is_optional,
            sort_order: index,
          })
        ),
      });

      setStep('success');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Failed to save recipe from scan:', error);
      alert(error?.message || 'Opslaan van recept mislukt');
      setStep('review');
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brikx-teal" />
            <h2 className="text-lg font-semibold text-gray-900">
              Scan receptkaart
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-brikx-teal hover:bg-brikx-teal/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="w-10 h-10 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  Sleep een foto van je receptkaart hierheen
                </p>
                <p className="text-xs text-gray-500">
                  of klik om een bestand te kiezen (JPEG, PNG – max {MAX_FILE_SIZE_MB}
                  MB)
                </p>
              </div>
              <label className="mt-2 inline-flex items-center px-3 py-2 bg-brikx-teal text-white text-sm rounded-lg cursor-pointer hover:bg-brikx-teal-dark">
                <span>Bestand kiezen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </label>
            </div>
          )}

          {step === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-8 h-8 text-brikx-teal animate-spin" />
              <div className="text-center">
                <p className="font-medium text-gray-900">
                  Recept wordt gescand...
                </p>
                {fileName && (
                  <p className="text-xs text-gray-500 mt-1">{fileName}</p>
                )}
              </div>
            </div>
          )}

          {step === 'review' && recipeDraft && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previewUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Foto
                  </p>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={previewUrl}
                      alt="Receptkaart"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Titel
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {recipeDraft.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Porties
                  </p>
                  <p className="text-sm text-gray-900">
                    {recipeDraft.default_servings}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recipeDraft.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Ingrediënten
                  </p>
                  <ul className="text-xs text-gray-700 space-y-0.5 max-h-32 overflow-y-auto border border-gray-100 rounded-md p-2">
                    {recipeDraft.ingredients.map((ing, idx) => (
                      <li key={idx}>
                        {ing.quantity ?? ''} {ing.unit ?? ''} {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="rounded-full bg-green-50 p-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-gray-900">
                Recept opgeslagen in je bibliotheek!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Sluiten
          </button>

          {step === 'review' && (
            <button
              onClick={handleSaveRecipe}
              className="px-4 py-2 text-sm bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark"
            >
              Recept opslaan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
