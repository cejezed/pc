// src/features/eten/pages/Boodschappen.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Printer, Check, Plus, X } from 'lucide-react';
import { useGenerateShoppingList } from '../hooks';
import { getWeekDates, formatDate, formatDateNL, getCategoryLabel } from '../utils';
import type { ShoppingListItem, IngredientCategory } from '../types';

interface ManualItem {
  name: string;
  category: IngredientCategory;
  checked: boolean;
}

export default function BoodschappenPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekDates()[0]);

  // Load from localStorage
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('boodschappen-checked');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [manualItems, setManualItems] = useState<ManualItem[]>(() => {
    const saved = localStorage.getItem('boodschappen-manual');
    return saved ? JSON.parse(saved) : [];
  });

  const [frequentItems, setFrequentItems] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('boodschappen-frequent');
    return saved ? JSON.parse(saved) : {};
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('other');

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const { data: shoppingList, isLoading } = useGenerateShoppingList({
    weekStart,
    weekEnd,
  });

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('boodschappen-checked', JSON.stringify(Array.from(checkedItems)));
  }, [checkedItems]);

  React.useEffect(() => {
    localStorage.setItem('boodschappen-manual', JSON.stringify(manualItems));
  }, [manualItems]);

  React.useEffect(() => {
    localStorage.setItem('boodschappen-frequent', JSON.stringify(frequentItems));
  }, [frequentItems]);

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
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const toggleManualItem = (index: number) => {
    setManualItems(prev => prev.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };

  const addManualItem = (itemName?: string, itemCategory?: IngredientCategory) => {
    const name = itemName || newItemName.trim();
    const category = itemCategory || newItemCategory;

    if (name) {
      // Check if item already exists (unchecked)
      const existingItem = manualItems.find(
        item => item.name.toLowerCase() === name.toLowerCase() && !item.checked
      );

      if (existingItem) {
        // Item already in list, just clear input
        setNewItemName('');
        return;
      }

      setManualItems(prev => [...prev, {
        name,
        category,
        checked: false,
      }]);

      // Track frequency
      setFrequentItems(prev => ({
        ...prev,
        [name.toLowerCase()]: (prev[name.toLowerCase()] || 0) + 1,
      }));

      setNewItemName('');
    }
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllChecked = () => {
    if (confirm('Alle afgevinkte items verwijderen?')) {
      setManualItems(prev => prev.filter(item => !item.checked));
      setCheckedItems(new Set());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Merge generated and manual items by category
  const allItemsByCategory = useMemo(() => {
    const grouped = shoppingList?.grouped || {};

    // Add manual items to their categories
    manualItems.forEach(item => {
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brikx-teal"></div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(allItemsByCategory);

  // Get top frequent items
  const topFrequentItems = useMemo(() => {
    return Object.entries(frequentItems)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([name]) => name);
  }, [frequentItems]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🛒 Boodschappenlijst</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Voeg handmatig items toe of laat ze automatisch genereren uit je weekplanning
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

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 sm:p-4 print:hidden">
        <button
          onClick={handlePrevWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="font-semibold text-lg">
            {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
          </p>
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Add Manual Item - More Prominent */}
      <div className="bg-gradient-to-br from-brikx-teal/10 to-blue-50 rounded-lg border-2 border-brikx-teal/30 p-4 sm:p-6 print:hidden shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-5 h-5 text-brikx-teal" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Voeg item toe aan je lijst</h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Voeg handmatig items toe of plan maaltijden in de weekplanner om ingrediënten automatisch toe te voegen
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
            placeholder="Wat moet je halen? Bijv. Melk, Brood, Eieren..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-brikx-teal text-sm sm:text-base"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as IngredientCategory)}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brikx-teal focus:border-brikx-teal text-sm sm:text-base"
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal/90 transition-colors text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Toevoegen</span>
          </button>
        </div>
      </div>

      {/* Shopping List - Tile Layout */}
      {categories.length === 0 && manualItems.filter(m => !m.checked).length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Je boodschappenlijst is leeg
          </h3>
          <p className="text-gray-600 mb-4">
            Voeg items toe met het formulier hierboven, of ga naar de weekplanner om maaltijden in te plannen.
          </p>
          <p className="text-sm text-gray-500">
            💡 Tip: Items uit geplande recepten worden automatisch toegevoegd!
          </p>
        </div>
      ) : categories.filter(category => {
        const items = allItemsByCategory[category] || [];
        const uncheckedItems = items.filter((item) => {
          const itemKey = `${item.name}-${item.unit}-${category}`;
          const isChecked = checkedItems.has(itemKey) || item.checked;
          return !isChecked;
        });
        return uncheckedItems.length > 0;
      }).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            Alle boodschappen gehaald!
          </p>
          <p className="text-gray-600 mb-4">
            Je lijst is compleet. Veel kookplezier!
          </p>
          <button
            onClick={clearAllChecked}
            className="px-6 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal/90 transition-colors text-sm font-semibold"
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
                    const isChecked = false; // Always false since we filtered checked items
                    const isManual = !item.recipe_ids || item.recipe_ids.length === 0;

                    return (
                      <div
                        key={`${itemKey}-${index}`}
                        onClick={() => {
                          if (isManual) {
                            const manualIndex = manualItems.findIndex(m =>
                              m.name === item.name && m.category === category
                            );
                            if (manualIndex !== -1) {
                              toggleManualItem(manualIndex);
                            }
                          } else {
                            toggleItem(itemKey);
                          }
                        }}
                        className="relative group cursor-pointer rounded-xl p-4 transition-all bg-white border-2 border-gray-200 hover:border-brikx-teal hover:shadow-md"
                      >
                        {/* Delete button for manual items */}
                        {isManual && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const manualIndex = manualItems.findIndex(m =>
                                m.name === item.name && m.category === category
                              );
                              if (manualIndex !== -1) {
                                removeManualItem(manualIndex);
                              }
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {/* Item name */}
                        <div className="text-center text-gray-900">
                          <p className="font-medium text-sm mb-1">{item.name}</p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Handige tips:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Klik op tegels om items af te vinken in de supermarkt</li>
                  <li>• Afgevinkte items verdwijnen automatisch van je lijst</li>
                  <li>• Items uit recepten worden automatisch toegevoegd als je maaltijden plant</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frequently Used Items */}
      {topFrequentItems.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-4 sm:p-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Vaak gebruikt</h3>
            <span className="text-xs sm:text-sm text-gray-600 ml-auto">Klik om snel toe te voegen</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {topFrequentItems.map((itemName) => (
              <button
                key={itemName}
                onClick={() => addManualItem(itemName, 'other')}
                className="px-3 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 hover:border-purple-400 transition-all text-sm font-medium text-gray-800 capitalize shadow-sm hover:shadow-md"
              >
                + {itemName}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            💡 Deze items worden bijgehouden op basis van wat je vaak toevoegt
          </p>
        </div>
      )}
    </div>
  );
}
