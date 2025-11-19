// src/Components/eten/pages/Boodschappen.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Printer, Check, Plus, X } from 'lucide-react';
import { useGenerateShoppingList } from '../hooks';
import {
  useShoppingList,
  useCheckedItems,
  useToggleCheckedItem,
  useManualItems,
  useAddManualItem,
  useToggleManualItem,
  useRemoveManualItem,
  useFrequentItems,
  useTrackFrequentItem,
  useClearCheckedItems,
} from '../hooks/useShoppingListData';
import { getWeekDates, formatDate, formatDateNL, getCategoryLabel } from '../utils';
import type { ShoppingListItem, IngredientCategory } from '../types';

export default function BoodschappenPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekDates()[0]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('other');

  const weekDates = useMemo(
    () => getWeekDates(currentWeekStart),
    [currentWeekStart]
  );
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  // Supabase hooks
  const { data: shoppingListData } = useShoppingList(weekStart);
  const shoppingListId = shoppingListData?.id;

  const { data: checkedItemKeys = [] } = useCheckedItems(shoppingListId);
  const { data: manualItems = [] } = useManualItems(shoppingListId);
  const { data: frequentItemsData = [] } = useFrequentItems(10);

  const toggleCheckedMutation = useToggleCheckedItem();
  const addManualMutation = useAddManualItem();
  const toggleManualMutation = useToggleManualItem();
  const removeManualMutation = useRemoveManualItem();
  const trackFrequentMutation = useTrackFrequentItem();
  const clearCheckedMutation = useClearCheckedItems();

  const {
    data: shoppingList,
    isLoading,
    error,
  } = useGenerateShoppingList({
    weekStart,
    weekEnd,
  });

  // Convert checkedItemKeys array to Set for easier lookup
  const checkedItems = useMemo(() => new Set(checkedItemKeys), [checkedItemKeys]);

  // Convert frequentItemsData to Record for suggestions
  const frequentItems = useMemo(() => {
    const record: Record<string, number> = {};
    frequentItemsData.forEach(item => {
      record[item.item_name] = item.frequency;
    });
    return record;
  }, [frequentItemsData]);

  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const toggleItem = (itemKey: string) => {
    if (!shoppingListId) return;
    toggleCheckedMutation.mutate({
      shoppingListId,
      itemKey,
      isChecked: checkedItems.has(itemKey),
    });
  };

  const toggleManualItem = (id: string, currentChecked: boolean) => {
    if (!shoppingListId) return;
    toggleManualMutation.mutate({
      id,
      checked: !currentChecked,
      shoppingListId,
    });
  };

  const addManualItem = (itemName?: string, itemCategory?: IngredientCategory) => {
    if (!shoppingListId) return;

    const name = itemName || newItemName.trim();
    const category = itemCategory || newItemCategory;

    if (name) {
      // Check if item already exists (unchecked)
      const existingItem = manualItems.find(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() && !item.checked
      );

      if (existingItem) {
        // Item already in list, just clear input
        setNewItemName('');
        return;
      }

      addManualMutation.mutate({
        shoppingListId,
        name,
        category,
      });

      // Track frequency
      trackFrequentMutation.mutate(name);

      setNewItemName('');
    }
  };

  const removeManualItem = (id: string) => {
    if (!shoppingListId) return;
    removeManualMutation.mutate({ id, shoppingListId });
  };

  const clearAllChecked = () => {
    if (!shoppingListId) return;
    if (confirm('Alle afgevinkte items verwijderen?')) {
      const checkedManualItemIds = manualItems
        .filter(item => item.checked)
        .map(item => item.id);

      clearCheckedMutation.mutate({
        shoppingListId,
        checkedItemKeys: Array.from(checkedItems),
        checkedManualItemIds,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ Merge generated and manual items by category zonder shoppingList.grouped te muteren
  const allItemsByCategory = useMemo(() => {
    const baseGrouped = shoppingList?.grouped || {};
    const grouped: Record<string, ShoppingListItem[]> = {};

    // Kopie van baseGrouped
    for (const [cat, items] of Object.entries(baseGrouped)) {
      grouped[cat] = [...items];
    }

    // Add manual items to their categories
    manualItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push({
        name: item.name,
        quantity: 0,
        unit: '',
        category: item.category,
        recipe_ids: [],
        recipe_titles: [],
        checked: item.checked,
      });
    });

    return grouped;
  }, [shoppingList, manualItems]);

  // Get top frequent items
  const topFrequentItems = useMemo(() => {
    return Object.entries(frequentItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([name]) => name);
  }, [frequentItems]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brikx-teal"></div>
        </div>
      </div>
    );
  }

  // Show error, but allow manual items to work
  if (error) {
    console.error('Shopping list API error:', error);
    // Continue anyway - manual items will still work
  }

  const categories = Object.keys(allItemsByCategory);


  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            🛒 Boodschappenlijst
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Voeg handmatig items toe of laat ze automatisch genereren uit je
            weekplanning
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors print:hidden text-sm"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Print lijst</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg print:hidden">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Kan recepten niet laden uit weekplanner
              </h3>
              <p className="text-xs text-yellow-700">
                De API is momenteel niet bereikbaar. Je kunt nog steeds
                handmatig items toevoegen aan je boodschappenlijst.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 print:hidden backdrop-blur-sm">
        <button
          onClick={handlePrevWeek}
          className="p-2.5 hover:bg-gradient-to-r hover:from-brikx-teal/10 hover:to-blue-50 rounded-xl transition-all hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="text-center">
          <p className="font-bold text-lg bg-gradient-to-r from-brikx-teal to-blue-600 bg-clip-text text-transparent">
            {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
          </p>
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2.5 hover:bg-gradient-to-r hover:from-brikx-teal/10 hover:to-blue-50 rounded-xl transition-all hover:scale-105"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Add Manual Item - More Prominent */}
      <div className="bg-gradient-to-br from-brikx-teal/5 via-blue-50/80 to-purple-50/60 rounded-2xl border border-brikx-teal/20 p-5 sm:p-7 print:hidden shadow-xl shadow-brikx-teal/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-brikx-teal to-blue-500 rounded-xl shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Voeg item toe aan je lijst
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
          Voeg handmatig items toe of plan maaltijden in de weekplanner om
          ingrediënten automatisch toe te voegen
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
            placeholder="Wat moet je halen? Bijv. Melk, Brood, Eieren..."
            className="flex-1 px-5 py-3.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm sm:text-base shadow-sm hover:shadow-md transition-shadow"
          />
          <select
            value={newItemCategory}
            onChange={(e) =>
              setNewItemCategory(e.target.value as IngredientCategory)
            }
            className="px-5 py-3.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-transparent text-sm sm:text-base shadow-sm hover:shadow-md transition-shadow"
          >
            <option value="produce">🥬 Groente & Fruit</option>
            <option value="meat">🥩 Vlees & Vis</option>
            <option value="dairy">🥛 Zuivel</option>
            <option value="pantry">🥫 Voorraad</option>
            <option value="spices">🌿 Kruiden</option>
            <option value="frozen">🧊 Diepvries</option>
            <option value="other">📦 Overig</option>
          </select>
          <button
            onClick={() => addManualItem()}
            disabled={!newItemName.trim()}
            className="flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-brikx-teal to-blue-500 text-white rounded-xl hover:from-brikx-teal/90 hover:to-blue-600 transition-all text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
          >
            <Plus className="w-5 h-5" />
            <span>Toevoegen</span>
          </button>
        </div>
      </div>

      {/* Shopping List - Tile Layout */}
      {categories.length === 0 &&
        manualItems.filter((m) => !m.checked).length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300 p-12 sm:p-16 text-center shadow-inner">
          <div className="text-7xl mb-6 animate-pulse">🛒</div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
            Je boodschappenlijst is leeg
          </h3>
          <p className="text-gray-600 mb-5 max-w-md mx-auto leading-relaxed">
            Voeg items toe met het formulier hierboven, of ga naar de
            weekplanner om maaltijden in te plannen.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700 border border-blue-200">
            <span className="text-lg">💡</span>
            <span className="font-medium">
              Items uit geplande recepten worden automatisch toegevoegd!
            </span>
          </div>
        </div>
      ) : categories.filter((category) => {
        const items = allItemsByCategory[category] || [];
        const uncheckedItems = items.filter((item) => {
          const itemKey = `${item.name}-${item.unit}-${category}`;
          const isChecked = checkedItems.has(itemKey) || item.checked;
          return !isChecked;
        });
        return uncheckedItems.length > 0;
      }).length === 0 ? (
        <div className="bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/50 rounded-2xl border border-green-200 p-12 sm:p-16 text-center shadow-xl shadow-green-200/40">
          <div className="inline-block p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg animate-bounce">
            <div className="text-6xl">🎉</div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-3">
            Alle boodschappen gehaald!
          </h3>
          <p className="text-gray-700 mb-6 text-lg max-w-md mx-auto leading-relaxed">
            Je lijst is compleet. Veel kookplezier!
          </p>
          <button
            onClick={clearAllChecked}
            className="px-8 py-3.5 bg-gradient-to-r from-brikx-teal to-emerald-500 text-white rounded-xl hover:from-brikx-teal/90 hover:to-emerald-600 transition-all text-sm sm:text-base font-bold shadow-lg hover:shadow-xl hover:scale-105"
          >
            Lijst opschonen
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const items = allItemsByCategory[category] || [];
            const uncheckedItems = items.filter((item) => {
              const itemKey = `${item.name}-${item.unit}-${category}`;
              const isChecked = checkedItems.has(itemKey) || item.checked;
              return !isChecked;
            });

            // Skip category if no unchecked items
            if (uncheckedItems.length === 0) return null;

            return (
              <div key={category}>
                {/* Category Header */}
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  {getCategoryLabel(category as any)}
                </h2>

                {/* Items Grid - Bring! Style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {uncheckedItems.map((item, index) => {
                    const itemKey = `${item.name}-${item.unit}-${category}`;
                    const isManual =
                      !item.recipe_ids || item.recipe_ids.length === 0;

                    return (
                      <div
                        key={`${itemKey}-${index}`}
                        onClick={() => {
                          if (isManual) {
                            const manualItem = manualItems.find(
                              (m) =>
                                m.name === item.name &&
                                m.category === category
                            );
                            if (manualItem) {
                              toggleManualItem(manualItem.id, manualItem.checked);
                            }
                          } else {
                            toggleItem(itemKey);
                          }
                        }}
                        className="relative group cursor-pointer rounded-2xl p-5 transition-all bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 hover:border-brikx-teal hover:shadow-xl hover:shadow-brikx-teal/10 hover:-translate-y-1 active:scale-95"
                      >
                        {/* Delete button for manual items */}
                        {isManual && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const manualItem = manualItems.find(
                                (m) =>
                                  m.name === item.name &&
                                  m.category === category
                              );
                              if (manualItem) {
                                removeManualItem(manualItem.id);
                              }
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {/* Item name */}
                        <div className="text-center text-gray-900">
                          <p className="font-medium text-sm mb-1">
                            {item.name}
                          </p>
                          {item.quantity > 0 && (
                            <p className="text-xs text-gray-600">
                              {item.quantity} {item.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border border-blue-200/50 rounded-2xl p-5 sm:p-6 print:hidden shadow-lg shadow-blue-200/30">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg flex-shrink-0">
                <div className="text-2xl">💡</div>
              </div>
              <div className="flex-1">
                <p className="text-base sm:text-lg text-blue-900 font-bold mb-3">
                  Handige tips:
                </p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">▸</span>
                    <span>
                      Klik op tegels om items af te vinken in de supermarkt
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">▸</span>
                    <span>
                      Afgevinkte items verdwijnen automatisch van je lijst
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0">▸</span>
                    <span>
                      Items uit recepten worden automatisch toegevoegd als je
                      maaltijden plant
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frequently Used Items */}
      {topFrequentItems.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-orange-50/50 rounded-2xl border border-purple-200/50 p-5 sm:p-7 print:hidden shadow-xl shadow-purple-200/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent">
                Vaak gebruikt
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Klik om snel toe te voegen
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {topFrequentItems.map((itemName) => (
              <button
                key={itemName}
                onClick={() => addManualItem(itemName, 'other')}
                className="px-4 py-3 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 transition-all text-sm font-semibold text-gray-800 capitalize shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <span className="text-purple-600">+</span> {itemName}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-xs text-purple-700 border border-purple-200/50 w-fit">
            <span className="text-base">💡</span>
            <span className="font-medium">
              Deze items worden bijgehouden op basis van wat je vaak toevoegt
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
