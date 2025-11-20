// src/Components/eten/pages/Boodschappen.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Printer, Check, Plus, X, Trash2, RotateCcw, ShoppingBasket } from 'lucide-react';
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
  useClearList,
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
  const clearListMutation = useClearList();

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

  const clearCheckedOnly = () => {
    if (!shoppingListId) return;
    if (confirm('Alle afgevinkte items definitief verwijderen?')) {
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

  const clearEntireList = () => {
    if (!shoppingListId) return;
    if (confirm('Weet je zeker dat je de HELE lijst wilt leegmaken? Dit verwijdert handmatige items en verbergt alle geplande items.')) {
      // Collect all generated item keys to mark them as checked (hidden)
      const allGeneratedKeys: string[] = [];
      if (shoppingList?.grouped) {
        Object.values(shoppingList.grouped).forEach(items => {
          items.forEach(item => {
            allGeneratedKeys.push(`${item.name}-${item.unit}-${item.category}`);
          });
        });
      }

      clearListMutation.mutate({
        shoppingListId,
        allGeneratedItemKeys: allGeneratedKeys,
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
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  const categories = Object.keys(allItemsByCategory);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#C5C6C7] p-4 sm:p-6 font-sans selection:bg-[#FF6B00]/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#1F2833] p-6 rounded-2xl border border-[#FF6B00]/20 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent opacity-50"></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 drop-shadow-[0_2px_10px_rgba(255,107,0,0.3)] flex items-center gap-3">
              <ShoppingBasket className="w-8 h-8 text-[#FF6B00]" />
              BOODSCHAPPEN <span className="text-[#FF6B00]">ZEUS-X</span>
            </h1>
            <p className="text-[#C5C6C7] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse"></span>
              Bevoorrading missie
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearEntireList}
              className="flex items-center gap-2 px-4 py-2 text-red-500 bg-[#0B0C10] border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all text-sm font-bold hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Alles wissen (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Alles Wissen</span>
            </button>
            <button
              onClick={clearCheckedOnly}
              className="flex items-center gap-2 px-4 py-2 text-[#C5C6C7] bg-[#0B0C10] border border-[#2d3436] hover:text-white hover:border-[#FF6B00]/50 rounded-lg transition-all text-sm"
              title="Afgevinkte items verwijderen"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Opschonen</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#FF6B00]/80 transition-all print:hidden text-sm font-bold shadow-[0_0_15px_rgba(255,107,0,0.3)]"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-lg print:hidden backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-yellow-500 mb-1">
                  Kan recepten niet laden uit weekplanner
                </h3>
                <p className="text-xs text-yellow-200/80">
                  De API is momenteel niet bereikbaar. Je kunt nog steeds
                  handmatig items toevoegen aan je boodschappenlijst.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-[#1F2833] rounded-xl border border-[#FF6B00]/20 p-4 shadow-lg print:hidden">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-[#FF6B00]/10 text-[#C5C6C7] hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#FF6B00]/30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <p className="font-bold text-lg sm:text-xl text-white tracking-wide">
              {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
            </p>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-[#FF6B00]/10 text-[#C5C6C7] hover:text-white rounded-lg transition-colors border border-transparent hover:border-[#FF6B00]/30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Add Manual Item */}
        <div className="bg-[#1F2833] rounded-xl border border-[#FF6B00]/20 p-5 sm:p-7 print:hidden shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FF6B00]/10 rounded-lg border border-[#FF6B00]/30">
              <Plus className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Item Toevoegen
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
              placeholder="Wat moet je halen? Bijv. Melk, Brood..."
              className="flex-1 px-5 py-3.5 bg-[#0B0C10] border border-[#2d3436] rounded-xl focus:outline-none focus:border-[#FF6B00] text-white placeholder-gray-600 transition-all"
            />
            <select
              value={newItemCategory}
              onChange={(e) =>
                setNewItemCategory(e.target.value as IngredientCategory)
              }
              className="px-5 py-3.5 bg-[#0B0C10] border border-[#2d3436] rounded-xl focus:outline-none focus:border-[#FF6B00] text-white transition-all"
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
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF6B00] text-white rounded-xl hover:bg-[#FF6B00]/80 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,107,0,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span>Toevoegen</span>
            </button>
          </div>
        </div>

        {/* Shopping List - Tile Layout */}
        {categories.length === 0 &&
          manualItems.filter((m) => !m.checked).length === 0 ? (
          <div className="bg-[#1F2833] rounded-xl border-2 border-dashed border-[#2d3436] p-12 sm:p-16 text-center">
            <div className="text-7xl mb-6 opacity-20 grayscale">🛒</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Je lijst is leeg
            </h3>
            <p className="text-[#C5C6C7] mb-5 max-w-md mx-auto">
              Voeg items toe of plan maaltijden in de weekplanner.
            </p>
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
          <div className="bg-[#1F2833] rounded-xl border border-[#66FCF1]/30 p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[#66FCF1]/5 animate-pulse"></div>
            <div className="inline-block p-4 bg-[#66FCF1]/10 rounded-full mb-6 relative z-10">
              <div className="text-6xl">🎉</div>
            </div>
            <h3 className="text-3xl font-black text-white mb-3 relative z-10">
              Missie Voltooid!
            </h3>
            <p className="text-[#66FCF1] mb-6 text-lg max-w-md mx-auto relative z-10">
              Alle boodschappen zijn binnen.
            </p>
            <button
              onClick={clearCheckedOnly}
              className="px-8 py-3.5 bg-[#66FCF1] text-[#0B0C10] rounded-xl hover:bg-[#66FCF1]/80 transition-all font-bold shadow-[0_0_20px_rgba(102,252,241,0.4)] relative z-10"
            >
              Lijst Opschonen
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
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-6 bg-[#FF6B00] rounded-full shadow-[0_0_10px_#FF6B00]"></span>
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
                          className="relative group cursor-pointer rounded-xl p-4 transition-all bg-[#1F2833] border border-[#2d3436] hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.2)] hover:-translate-y-0.5 active:scale-95"
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
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          {/* Item name */}
                          <div className="text-center text-white">
                            <p className="font-bold text-sm mb-1">
                              {item.name}
                            </p>
                            {item.quantity > 0 && (
                              <p className="text-xs text-[#FF6B00] font-mono">
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
            <div className="bg-[#1F2833] border border-[#66FCF1]/20 rounded-2xl p-5 sm:p-6 print:hidden shadow-[0_0_20px_rgba(102,252,241,0.05)]">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#66FCF1]/10 rounded-xl flex-shrink-0">
                  <div className="text-2xl">💡</div>
                </div>
                <div className="flex-1">
                  <p className="text-base sm:text-lg text-[#66FCF1] font-bold mb-3">
                    Pro Tips:
                  </p>
                  <ul className="text-sm text-[#C5C6C7] space-y-2 font-mono">
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B00] flex-shrink-0">▸</span>
                      <span>
                        Klik op tegels om items af te vinken
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B00] flex-shrink-0">▸</span>
                      <span>
                        Gebruik "Opschonen" om afgevinkte items te verwijderen
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#FF6B00] flex-shrink-0">▸</span>
                      <span>
                        Gebruik "Alles Wissen" om opnieuw te beginnen
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
          <div className="bg-[#1F2833] rounded-xl border border-[#FF6B00]/20 p-5 sm:p-7 print:hidden shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-[#FF6B00]/10 rounded-xl border border-[#FF6B00]/30">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Vaak gebruikt
                </h3>
                <p className="text-xs sm:text-sm text-[#C5C6C7]">
                  Klik om snel toe te voegen
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {topFrequentItems.map((itemName) => (
                <button
                  key={itemName}
                  onClick={() => addManualItem(itemName, 'other')}
                  className="px-4 py-3 bg-[#0B0C10] border border-[#2d3436] rounded-xl hover:border-[#FF6B00] transition-all text-sm font-bold text-[#C5C6C7] hover:text-white capitalize shadow-sm hover:shadow-[0_0_10px_rgba(255,107,0,0.2)]"
                >
                  <span className="text-[#FF6B00] mr-1">+</span> {itemName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
