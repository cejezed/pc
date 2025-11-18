// src/Components/eten/pages/Recepten.tsx
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Heart,
  Clock,
  Link as LinkIcon,
  BookOpen,
  Loader2,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import {
  useRecipes,
  useUpdateRecipe,
  useImportRecipe,
  useCreateRecipe,
} from '../hooks';
import { RecipeCard } from '../components/RecipeCard';
import ScanRecipeDialog from '../components/ScanRecipeDialog';
import { COMMON_TAGS } from '../utils';
import type {
  RecipeFilters,
  CreateRecipeFromScanInput,
  ScannedRecipeDraft,
  ScannedIngredient,
} from '../types';

export default function ReceptenPage() {
  const [filters, setFilters] = useState<RecipeFilters>({
    search: '',
    tags: [],
    favouritesOnly: false,
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  // Nieuw: modal + state voor handmatige scaninput
  const [showScanInputModal, setShowScanInputModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanInputError, setScanInputError] = useState<string | null>(null);

  // Nieuw: afbeelding-upload voor handmatige scaninput
  const [scanImageFile, setScanImageFile] = useState<File | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);

  const { data: recipes = [], isLoading } = useRecipes(filters);
  const updateRecipe = useUpdateRecipe();
  const importRecipe = useImportRecipe();
  const createRecipe = useCreateRecipe();

  const handleToggleFavourite = (id: string, isFavourite: boolean) => {
    updateRecipe.mutate({
      id,
      is_favourite: isFavourite,
    });
  };

  const handleToggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;

    try {
      await importRecipe.mutateAsync({ url: importUrl });
      setImportUrl('');
      setShowImportModal(false);
      alert('Recept succesvol geïmporteerd!');
    } catch (error: any) {
      alert(`Import mislukt: ${error.message}`);
    }
  };

  // helper om een File -> data URL te lezen
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Afbeelding kon niet gelezen worden'));
      reader.readAsDataURL(file);
    });
  };

  // Nieuw: importeren van handmatige scaninput (JSON) + optionele afbeelding
  const handleImportScanInput = async () => {
    if (!scanInput.trim()) return;

    setScanInputError(null);

    try {
      const parsed: any = JSON.parse(scanInput);

      let draft: ScannedRecipeDraft;
      let ingredients: ScannedIngredient[];

      // Variant 1: volledige CreateRecipeFromScanInput
      if (parsed.recipe && parsed.ingredients) {
        const fromScan = parsed as CreateRecipeFromScanInput;

        const instructionsArray = Array.isArray(fromScan.recipe.instructions)
          ? fromScan.recipe.instructions
          : String(fromScan.recipe.instructions)
              .split(/\n{2,}/)
              .map((s) => s.trim())
              .filter(Boolean);

        draft = {
          title: fromScan.recipe.title,
          default_servings: fromScan.recipe.default_servings,
          prep_time_min: fromScan.recipe.prep_time_min,
          tags: fromScan.recipe.tags ?? [],
          instructions: instructionsArray,
          notes: fromScan.recipe.notes,
          image_url: fromScan.recipe.image_url,
          ingredients: parsed.ingredients,
        };

        ingredients = fromScan.ingredients;
      } else {
        // Variant 2: direct een ScannedRecipeDraft
        draft = parsed as ScannedRecipeDraft;
        ingredients = draft.ingredients;
      }

      // Afbeelding: als er een bestand is gekozen, gebruik data-URL, anders de URL uit de draft
      let imageUrl = draft.image_url;
      if (scanImageFile) {
        imageUrl = await readFileAsDataUrl(scanImageFile);
      }

      await createRecipe.mutateAsync({
        title: draft.title,
        source_type: 'scan',
        source_url: undefined,
        source_note: draft.notes,
        default_servings: draft.default_servings,
        prep_time_min: draft.prep_time_min ?? undefined,
        instructions: draft.instructions.join('\n\n'),
        tags: draft.tags ?? [],
        image_url: imageUrl,
        ingredients: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity ?? undefined,
          unit: ing.unit ?? undefined,
          category: ing.category ?? undefined,
          is_optional: ing.is_optional,
        })),
      });

      setShowScanInputModal(false);
      setScanInput('');
      setScanInputError(null);
      setScanImageFile(null);
      setScanImagePreview(null);
      alert('Recept succesvol aangemaakt!');
    } catch (error: any) {
      console.error(error);
      setScanInputError(
        error?.message ||
          'Import mislukt: controleer of de JSON-structuur klopt (geen "const ..." eromheen).'
      );
    }
  };

  const handleResetScanInputModal = () => {
    setShowScanInputModal(false);
    setScanInput('');
    setScanInputError(null);
    setScanImageFile(null);
    setScanImagePreview(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setScanImageFile(null);
      setScanImagePreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Selecteer een geldig afbeeldingsbestand');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Afbeelding is te groot (max 10MB)');
      return;
    }

    setScanImageFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setScanImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Recepten
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Jouw persoonlijke receptenbibliotheek
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Importeer URL</span>
            <span className="sm:hidden">URL</span>
          </button>
          <button
            onClick={() => setShowScanDialog(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Kaart</span>
            <span className="sm:hidden">Scan</span>
          </button>
          {/* Nieuw: scaninput plakken */}
          <button
            onClick={() => setShowScanInputModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Plak scaninput</span>
            <span className="sm:hidden">Scan JSON</span>
          </button>
          <button
            onClick={() => {
              /* TODO: Open create modal */
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nieuw recept</span>
            <span className="sm:hidden">Nieuw</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Search & Favourites */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek recepten..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <button
            onClick={() =>
              setFilters({
                ...filters,
                favouritesOnly: !filters.favouritesOnly,
              })
            }
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm ${
              filters.favouritesOnly
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                filters.favouritesOnly ? 'fill-current' : ''
              }`}
            />
            <span className="hidden sm:inline">Favorieten</span>
          </button>
        </div>

        {/* Tags */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Filters:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.slice(0, 12).map((tag) => {
              const isActive = filters.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors ${
                    isActive
                      ? 'bg-brikx-teal text-white border-brikx-teal'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-brikx-teal'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Max cook time */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Clock className="w-4 h-4 text-gray-600 hidden sm:block" />
          <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-700">
            <span>Max. bereidingstijd:</span>
            <select
              value={filters.maxPrepTime || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxPrepTime: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Alle</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 uur</option>
            </select>
          </label>
        </div>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brikx-teal" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nog geen recepten
          </h3>
          <p className="text-gray-600 mb-4">
            Begin met het toevoegen van je favoriete recepten!
          </p>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark"
          >
            <Plus className="w-4 h-4" />
            Voeg je eerste recept toe
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-2">
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recepten'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => {
                  /* TODO: Navigate to detail */
                }}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        </>
      )}

      {/* Import Modal (URL) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Importeer recept van URL
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Plak de URL van een recept. We proberen automatisch de
              ingrediënten en bereidingswijze te extraheren.
            </p>

            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={importRecipe.isPending}
              >
                Annuleren
              </button>
              <button
                onClick={handleImport}
                disabled={!importUrl.trim() || importRecipe.isPending}
                className="px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importRecipe.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  'Importeer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nieuw: Scaninput Modal (JSON + afbeelding-upload) */}
      {showScanInputModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Importeer scaninput</h2>
              <button
                onClick={handleResetScanInputModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Plak hier geldige{' '}
              <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                JSON
              </span>{' '}
              van een{' '}
              <code className="font-mono text-xs">CreateRecipeFromScanInput</code>{' '}
              of{' '}
              <code className="font-mono text-xs">ScannedRecipeDraft</code>.
              Gebruik <strong>geen</strong> TypeScript-snippet met{' '}
              <code className="font-mono text-xs">const ... =</code>.
            </p>

            <textarea
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full h-56 font-mono text-xs sm:text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
              placeholder='{"recipe": { ... }, "ingredients": [ ... ]}'
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Omslagafbeelding (optioneel)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brikx-teal file:text-white hover:file:bg-brikx-teal-dark"
              />
              <p className="text-xs text-gray-500">
                Als je hier een afbeelding kiest, wordt deze als data-URL
                opgeslagen in het recept en gebruikt als omslag.
              </p>

              {scanImagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={scanImagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
            </div>

            {scanInputError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {scanInputError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleResetScanInputModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={createRecipe.isPending}
              >
                Annuleren
              </button>
              <button
                onClick={handleImportScanInput}
                disabled={!scanInput.trim() || createRecipe.isPending}
                className="px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createRecipe.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Maak recept
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Recipe Dialog (foto van kaart → scan) */}
      <ScanRecipeDialog
        isOpen={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        onSuccess={() => {
          // Recipe list refresht via query invalidation
        }}
      />
    </div>
  );
}
