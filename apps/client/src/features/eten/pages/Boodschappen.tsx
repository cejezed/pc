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
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('other');

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const { data: shoppingList, isLoading } = useGenerateShoppingList({
    weekStart,
    weekEnd,
  });

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

  const addManualItem = () => {
    if (newItemName.trim()) {
      setManualItems(prev => [...prev, {
        name: newItemName.trim(),
        category: newItemCategory,
        checked: false,
      }]);
      setNewItemName('');
    }
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boodschappenlijst</h1>
          <p className="text-gray-600">Klik op items om ze af te vinken</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 print:hidden">
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

      {/* Add Manual Item */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 print:hidden">
        <h3 className="font-semibold text-gray-900 mb-3">Handmatig toevoegen</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addManualItem()}
            placeholder="Bijv. Melk, Brood, Eieren..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brikx-teal"
          />
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as IngredientCategory)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brikx-teal"
          >
            <option value="produce">Groente & Fruit</option>
            <option value="meat">Vlees & Vis</option>
            <option value="dairy">Zuivel</option>
            <option value="pantry">Voorraad</option>
            <option value="spices">Kruiden</option>
            <option value="frozen">Diepvries</option>
            <option value="other">Overig</option>
          </select>
          <button
            onClick={addManualItem}
            className="flex items-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Toevoegen
          </button>
        </div>
      </div>

      {/* Shopping List - Tile Layout */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            Geen maaltijden gepland voor deze week.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ga naar de weekplanner om maaltijden in te plannen, of voeg handmatig items toe.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const items = allItemsByCategory[category] || [];

            return (
              <div key={category}>
                {/* Category Header */}
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {getCategoryLabel(category as any)}
                </h2>

                {/* Items Grid - Bring! Style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map((item, index) => {
                    const itemKey = `${item.name}-${item.unit}-${category}`;
                    const isChecked = checkedItems.has(itemKey) || item.checked;
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
                        className={`relative group cursor-pointer rounded-xl p-4 transition-all ${
                          isChecked
                            ? 'bg-green-100 border-2 border-green-400 opacity-60'
                            : 'bg-white border-2 border-gray-200 hover:border-brikx-teal hover:shadow-md'
                        }`}
                      >
                        {/* Check indicator */}
                        {isChecked && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Delete button for manual items */}
                        {isManual && !isChecked && (
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
                        <div className={`text-center ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
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
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Klik op de tegels om items af te vinken terwijl je door de supermarkt loopt!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
