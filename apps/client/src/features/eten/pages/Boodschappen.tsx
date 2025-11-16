// src/features/eten/pages/Boodschappen.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Printer, Check } from 'lucide-react';
import { useGenerateShoppingList } from '../hooks';
import { getWeekDates, formatDate, formatDateNL, getCategoryLabel, formatQuantity } from '../utils';

export default function BoodschappenPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekDates()[0]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brikx-teal"></div>
        </div>
      </div>
    );
  }

  const grouped = shoppingList?.grouped || {};
  const categories = Object.keys(grouped);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boodschappenlijst</h1>
          <p className="text-gray-600">Gebaseerd op je weekplanning</p>
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

      {/* Shopping List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            Geen maaltijden gepland voor deze week.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ga naar de weekplanner om maaltijden in te plannen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const items = grouped[category] || [];
            const checkedCount = items.filter(item =>
              checkedItems.has(`${item.name}-${item.unit}-${category}`)
            ).length;

            return (
              <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">
                      {getCategoryLabel(category as any)}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {checkedCount}/{items.length}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const itemKey = `${item.name}-${item.unit}-${category}`;
                    const isChecked = checkedItems.has(itemKey);

                    return (
                      <div
                        key={itemKey}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isChecked ? 'bg-green-50' : ''
                        }`}
                        onClick={() => toggleItem(itemKey)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-brikx-teal border-brikx-teal'
                              : 'border-gray-300 hover:border-brikx-teal'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Item info */}
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className={`font-medium ${
                                isChecked ? 'line-through text-gray-400' : 'text-gray-900'
                              }`}>
                                {item.name}
                              </span>
                              <span className={`text-sm ${
                                isChecked ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {formatQuantity(item.quantity, item.unit)}
                              </span>
                            </div>

                            {/* Recipe references */}
                            {item.recipe_titles && item.recipe_titles.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Voor: {item.recipe_titles.join(', ')}
                              </div>
                            )}
                          </div>
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
              <strong>Tip:</strong> Vink items af terwijl je door de supermarkt loopt!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
