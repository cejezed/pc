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
  useRecipe,
  useUpdateRecipe,
  useImportRecipe,
  useCreateRecipe,
} from '../hooks';
import { RecipeCard } from '../components/RecipeCard';
import ScanRecipeDialog from '../components/ScanRecipeDialog';
import { detectIngredientTags } from '../utils';
import type {
  RecipeFilters,
  CreateRecipeFromScanInput,
  ScannedRecipeDraft,
  ScannedIngredient,
} from '../types';

import RecipeDetailDialog from '../components/RecipeDetailDialog';
import type { RecipeWithIngredients } from '../types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';

export default function ReceptenPage() {
  const [filters, setFilters] = useState<RecipeFilters>({
    search: '',
    tags: [],
    favouritesOnly: false,
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  // Modal + state voor handmatige scaninput
  const [showScanInputModal, setShowScanInputModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanInputError, setScanInputError] = useState<string | null>(null);

  // Afbeelding-upload voor handmatige scaninput
  const [scanImageFile, setScanImageFile] = useState<File | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);

  // Selected recipe ID for detail/edit view
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // Fetch full details for selected recipe
  const { data: selectedRecipe } = useRecipe(selectedRecipeId || undefined);

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

  // Helper: File -> data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () =>
        reject(new Error('Afbeelding kon niet gelezen worden'));
      reader.readAsDataURL(file);
    });
  };

  // Helper: veilig JSON-blok uit de input halen (ook als er tekst/HTML omheen staat)
  const safeJsonParse = (raw: string) => {
    const text = raw.trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error('RAW INPUT THAT FAILED:', text);
      throw new Error(
        "Kon geen geldig JSON-blok vinden. Zorg dat er ergens `{ ... }` staat."
      );
    }

    const jsonBlock = text.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(jsonBlock);
    } catch (err: any) {
      console.error('JSON BLOCK THAT FAILED TO PARSE:', jsonBlock);
      throw new Error('JSON is ongeldig: ' + err.message);
    }
  };

  // Importeren van handmatige scaninput (JSON) + optionele afbeelding
  const handleImportScanInput = async () => {
    if (!scanInput.trim()) return;

    setScanInputError(null);

    try {
      const parsed: any = safeJsonParse(scanInput);

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
          ingredients: fromScan.ingredients,
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

      // Auto-tags op basis van ingrediënten
      const autoTags = detectIngredientTags(ingredients);
      const finalTags = Array.from(
        new Set([...(draft.tags ?? []), ...autoTags])
      );

      await createRecipe.mutateAsync({
        title: draft.title,
        source_type: 'scan',
        source_url: undefined,
        source_note: draft.notes,
        default_servings: draft.default_servings,
        prep_time_min: draft.prep_time_min ?? undefined,
        instructions: draft.instructions.join('\n\n'),
        tags: finalTags,
        image_url: imageUrl,
        ingredients: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity ?? undefined,
          unit: ing.unit ?? undefined,
          category: ing.category ?? undefined,
          is_optional: ing.is_optional,
        })),
      });

      handleResetScanInputModal();
      alert('Recept succesvol aangemaakt!');
    } catch (error: any) {
      console.error(error);
      setScanInputError(
        (error?.message || 'Import mislukt.') +
        ' Tip: plak de JSON exact zoals gekregen, zonder extra tekst.'
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--zeus-text)]">
            Recepten
          </h1>
          <p className="text-sm sm:text-base text-[var(--zeus-text-secondary)]">
            Jouw persoonlijke receptenbibliotheek
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="zeus-button-secondary"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importeer URL</span>
            <span className="sm:hidden">URL</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowScanDialog(true)}
            className="zeus-button-secondary"
          >
            <Camera className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Scan Kaart</span>
            <span className="sm:hidden">Scan</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowScanInputModal(true)}
            className="zeus-button-secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Plak JSON</span>
            <span className="sm:hidden">JSON</span>
          </Button>

          <Button
            onClick={async () => {
              const title = window.prompt('Naam van het nieuwe recept:');
              if (title) {
                try {
                  const newRecipe = await createRecipe.mutateAsync({
                    title,
                    source_type: 'manual',
                    instructions: '',
                    ingredients: [],
                    tags: [],
                    default_servings: 2,
                    prep_time_min: 15
                  });
                  // Open detail view immediately
                  setSelectedRecipeId(newRecipe.id);
                } catch (e: any) {
                  alert('Fout bij aanmaken: ' + e.message);
                }
              }
            }}
            className="btn-zeus-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nieuw recept</span>
            <span className="sm:hidden">Nieuw</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="zeus-card p-3 sm:p-4 space-y-4">
        {/* Search & Main Toggles */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--zeus-text-secondary)]" />
            <Input
              type="text"
              placeholder="Zoek recepten..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 zeus-input"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  favouritesOnly: !filters.favouritesOnly,
                })
              }
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm whitespace-nowrap ${filters.favouritesOnly
                ? 'bg-red-900/20 border-red-800/50 text-red-400'
                : 'bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]'
                }`}
            >
              <Heart
                className={`w-4 h-4 ${filters.favouritesOnly ? 'fill-current' : ''
                  }`}
              />
              <span>Favorieten</span>
            </button>

            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  maxPrepTime: filters.maxPrepTime === 30 ? undefined : 30,
                })
              }
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors text-sm whitespace-nowrap ${filters.maxPrepTime === 30
                ? 'bg-orange-900/20 border-orange-800/50 text-orange-400'
                : 'bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)] text-[var(--zeus-text-secondary)] hover:bg-[var(--zeus-card-hover)]'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>Snel (&lt; 30 min)</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <p className="text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase tracking-wider mb-2">
            Categorieën
          </p>
          <div className="flex flex-wrap gap-2">
            {['ontbijt', 'lunch', 'avond', 'toetje'].map((cat) => {
              const tag = `cat:${cat}`;
              const isActive = filters.tags?.includes(tag);
              const label = cat.charAt(0).toUpperCase() + cat.slice(1);

              return (
                <button
                  key={cat}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${isActive
                    ? 'bg-[var(--zeus-primary)] text-white border-[var(--zeus-primary)] shadow-[0_0_10px_var(--zeus-primary-glow)]'
                    : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] hover:text-[var(--zeus-text)]'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ingredient Filters */}
        <div>
          <p className="text-xs font-semibold text-[var(--zeus-text-secondary)] uppercase tracking-wider mb-2">
            Ingrediënten & Type
          </p>
          <div className="flex flex-wrap gap-2">
            {['Kip', 'Varken', 'Rund', 'Vlees', 'Vis', 'Hamburger', 'Soep', 'Pasta'].map((tag) => {
              const isActive = filters.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${isActive
                    ? 'bg-[var(--zeus-primary)] text-white border-[var(--zeus-primary)] shadow-[0_0_10px_var(--zeus-primary-glow)]'
                    : 'bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] hover:text-[var(--zeus-text)]'
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--zeus-primary)]" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="zeus-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-[var(--zeus-text-secondary)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-2">
            Nog geen recepten
          </h3>
          <p className="text-[var(--zeus-text-secondary)] mb-4">
            Begin met het toevoegen van je favoriete recepten!
          </p>
          <Button
            onClick={() => setShowImportModal(true)}
            className="btn-zeus-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Voeg je eerste recept toe
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-[var(--zeus-text-secondary)] mb-2">
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recepten'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipeId(recipe.id)}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        </>
      )}

      {/* Import Modal (URL) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="zeus-modal max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--zeus-text)]">
              Importeer recept van URL
            </h2>

            <p className="text-sm text-[var(--zeus-text-secondary)] mb-4">
              Plak de URL van een recept. We proberen automatisch de
              ingrediënten en bereidingswijze te extraheren.
            </p>

            <Input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://..."
              className="zeus-input mb-4"
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl('');
                }}
                className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-bg-secondary)]"
                disabled={importRecipe.isPending}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importUrl.trim() || importRecipe.isPending}
                className="btn-zeus-primary"
              >
                {importRecipe.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importeren...
                  </>
                ) : (
                  'Importeer'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scaninput Modal (JSON + afbeelding-upload) */}
      {showScanInputModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="zeus-modal max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-[var(--zeus-text)]">Importeer scaninput</h2>
              <button
                onClick={handleResetScanInputModal}
                className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--zeus-text-secondary)]">
              Plak hier geldige{' '}
              <span className="font-mono text-xs bg-[var(--zeus-bg-secondary)] px-1 py-0.5 rounded text-[var(--zeus-text)]">
                JSON
              </span>{' '}
              van een{' '}
              <code className="font-mono text-xs text-[var(--zeus-primary)]">CreateRecipeFromScanInput</code>{' '}
              of{' '}
              <code className="font-mono text-xs text-[var(--zeus-primary)]">ScannedRecipeDraft</code>.
              Gebruik <strong>geen</strong> TypeScript-snippet met{' '}
              <code className="font-mono text-xs text-[var(--zeus-primary)]">const ... =</code>. Tekst
              vóór/na het JSON-blok wordt automatisch weggefilterd.
            </p>

            <textarea
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full h-56 font-mono text-xs sm:text-sm zeus-input p-3"
              placeholder='{"recipe": { ... }, "ingredients": [ ... ]}'
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--zeus-text)]">
                Omslagafbeelding (optioneel)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-[var(--zeus-text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--zeus-primary)] file:text-white hover:file:bg-[var(--zeus-primary-hover)]"
              />
              <p className="text-xs text-[var(--zeus-text-secondary)]">
                Als je hier een afbeelding kiest, wordt deze als data-URL
                opgeslagen in het recept en gebruikt als omslag.
              </p>

              {scanImagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-[var(--zeus-border)]">
                  <img
                    src={scanImagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
            </div>

            {scanInputError && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                {scanInputError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={handleResetScanInputModal}
                className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-bg-secondary)]"
                disabled={createRecipe.isPending}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleImportScanInput}
                disabled={!scanInput.trim() || createRecipe.isPending}
                className="btn-zeus-primary"
              >
                {createRecipe.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Maak recept
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Recipe Dialog (foto van kaart → scan) */}
      <ScanRecipeDialog
        isOpen={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        onSuccess={() => {
          // Recipe list refresh via query invalidation
        }}
      />

      {/* Detail/Edit Dialog */}
      {selectedRecipeId && selectedRecipe && (
        <RecipeDetailDialog
          recipe={selectedRecipe}
          isOpen={true}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </div>
  );
}
