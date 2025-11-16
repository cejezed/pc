// src/features/eten/pages/Recepten.tsx
import React, { useState } from 'react';
import { Plus, Search, Heart, Clock, Link as LinkIcon, BookOpen, Loader2, Camera } from 'lucide-react';
import { useRecipes, useUpdateRecipe, useImportRecipe, useCreateRecipe } from '../hooks';
import { RecipeCard } from '../components/RecipeCard';
import ScanRecipeDialog from '../components/ScanRecipeDialog';
import { COMMON_TAGS } from '../utils';
import type { RecipeFilters } from '../types';

export default function ReceptenPage() {
  const [filters, setFilters] = useState<RecipeFilters>({
    search: '',
    tags: [],
    favouritesOnly: false,
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const { data: recipes = [], isLoading } = useRecipes(filters);
  const updateRecipe = useUpdateRecipe();
  const importRecipe = useImportRecipe();

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recepten</h1>
          <p className="text-gray-600">Jouw persoonlijke receptenbibliotheek</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            Importeer URL
          </button>
          <button
            onClick={() => setShowScanDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Scan Kaart
          </button>
          <button
            onClick={() => {/* TODO: Open create modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw recept
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Search & Favourites */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek recepten..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brikx-teal focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setFilters({ ...filters, favouritesOnly: !filters.favouritesOnly })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              filters.favouritesOnly
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${filters.favouritesOnly ? 'fill-current' : ''}`} />
            Favorieten
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
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
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
        <div className="flex items-center gap-4">
          <Clock className="w-4 h-4 text-gray-600" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Max. bereidingstijd:
            <select
              value={filters.maxPrepTime || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxPrepTime: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="px-3 py-1 border border-gray-300 rounded-lg"
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
                onClick={() => {/* TODO: Navigate to detail */}}
                onToggleFavourite={handleToggleFavourite}
              />
            ))}
          </div>
        </>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Importeer recept van URL</h2>

            <p className="text-sm text-gray-600 mb-4">
              Plak de URL van een recept. We proberen automatisch de ingrediënten en
              bereidingswijze te extraheren.
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

      {/* Scan Recipe Dialog */}
      <ScanRecipeDialog
        isOpen={showScanDialog}
        onClose={() => setShowScanDialog(false)}
        onSuccess={() => {
          // Recipe list will auto-refresh via query invalidation
        }}
      />
    </div>
  );
}
