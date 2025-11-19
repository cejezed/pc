// src/Components/eten/pages/Weekplanner.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, Trash2, Edit2 } from 'lucide-react';
import { useMealPlans, useCreateMealPlan, useDeleteMealPlan, useRecipes } from '../hooks';
import { getWeekDates, formatDate, formatDateNL, MEAL_TYPES, getMealTypeLabel, getMealTypeEmoji, isToday } from '../utils';
import type { MealType, Recipe, MealPlanWithRecipe } from '../types';

export default function WeekplannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekDates()[0]);
  const [showAddModal, setShowAddModal] = useState<{ date: string; mealType: MealType } | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const { data: mealPlans = [] } = useMealPlans(weekStart, weekEnd);
  const { data: recipes = [] } = useRecipes();
  const createMealPlan = useCreateMealPlan();
  const deleteMealPlan = useDeleteMealPlan();

  // Group meal plans by date and meal type
  const mealPlansByDate = useMemo(() => {
    const grouped: { [date: string]: { [mealType: string]: MealPlanWithRecipe } } = {};

    for (const date of weekDates) {
      const dateStr = formatDate(date);
      grouped[dateStr] = {};
    }

    for (const plan of mealPlans) {
      if (!grouped[plan.date]) {
        grouped[plan.date] = {};
      }
      grouped[plan.date][plan.meal_type] = plan;
    }

    return grouped;
  }, [mealPlans, weekDates]);

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

  const handleAddMeal = async (recipeId: string) => {
    if (!showAddModal) return;

    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    await createMealPlan.mutateAsync({
      date: showAddModal.date,
      meal_type: showAddModal.mealType,
      recipe_id: recipeId,
      servings: recipe.default_servings,
    });

    setShowAddModal(null);
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze maaltijd wilt verwijderen?')) return;
    await deleteMealPlan.mutateAsync(id);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Weekplanner</h1>
          <p className="text-sm sm:text-base text-gray-600">Plan je maaltijden voor de week</p>
        </div>

        <button
          onClick={() => {/* TODO: Generate shopping list */ }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brikx-teal text-white rounded-lg hover:bg-brikx-teal-dark transition-colors text-sm sm:text-base"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Boodschappenlijst maken</span>
          <span className="sm:hidden">Boodschappen</span>
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <button
          onClick={handlePrevWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="font-semibold text-base sm:text-lg">
            {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
          </p>
          <p className="text-xs sm:text-sm text-gray-600">Week {getWeekNumber(weekDates[0])}</p>
        </div>

        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Grid - Desktop (Table) */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Maaltijd
              </th>
              {weekDates.map((date) => (
                <th
                  key={formatDate(date)}
                  className={`px-4 py-3 text-center text-sm font-semibold ${isToday(date)
                    ? 'bg-brikx-teal text-white'
                    : 'text-gray-700'
                    }`}
                >
                  <div>{date.toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
                  <div className="text-xs font-normal">
                    {date.getDate()} {date.toLocaleDateString('nl-NL', { month: 'short' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {MEAL_TYPES.map((mealType) => (
              <tr key={mealType}>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMealTypeEmoji(mealType)}</span>
                    <span>{getMealTypeLabel(mealType)}</span>
                  </div>
                </td>
                {weekDates.map((date) => {
                  const dateStr = formatDate(date);
                  const mealPlan = mealPlansByDate[dateStr]?.[mealType];

                  return (
                    <td
                      key={`${dateStr}-${mealType}`}
                      className={`p-2 border-l border-gray-100 align-top h-32 ${isToday(date) ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <MealSlot
                        mealPlan={mealPlan}
                        onClickAdd={() => setShowAddModal({ date: dateStr, mealType })}
                        onDelete={(id) => handleDeleteMeal(id)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Week List - Mobile/Tablet */}
      <div className="lg:hidden space-y-6">
        {weekDates.map((date) => (
          <div key={formatDate(date)} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isToday(date) ? 'border-brikx-teal ring-1 ring-brikx-teal' : 'border-gray-200'}`}>
            {/* Day Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${isToday(date) ? 'bg-brikx-teal text-white' : 'bg-gray-50 border-b border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg capitalize">
                  {date.toLocaleDateString('nl-NL', { weekday: 'long' })}
                </span>
                <span className={`text-sm ${isToday(date) ? 'text-white/90' : 'text-gray-500'}`}>
                  {date.getDate()} {date.toLocaleDateString('nl-NL', { month: 'long' })}
                </span>
              </div>
              {isToday(date) && (
                <span className="text-xs font-bold bg-white text-brikx-teal px-2 py-1 rounded-full">
                  Vandaag
                </span>
              )}
            </div>

            {/* Meals List */}
            <div className="divide-y divide-gray-100">
              {MEAL_TYPES.map((mealType) => {
                const dateStr = formatDate(date);
                const mealPlan = mealPlansByDate[dateStr]?.[mealType];

                return (
                  <div key={mealType} className="p-3 flex gap-3">
                    {/* Meal Type Icon/Label */}
                    <div className="w-24 flex-shrink-0 flex flex-col justify-center text-gray-500">
                      <div className="flex items-center gap-2 font-medium text-sm text-gray-900">
                        <span>{getMealTypeEmoji(mealType)}</span>
                        <span>{getMealTypeLabel(mealType)}</span>
                      </div>
                    </div>

                    {/* Slot Content */}
                    <div className="flex-1 min-w-0">
                      <MealSlot
                        mealPlan={mealPlan}
                        onClickAdd={() => setShowAddModal({ date: dateStr, mealType })}
                        onDelete={(id) => handleDeleteMeal(id)}
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">
                Kies een recept voor {getMealTypeLabel(showAddModal.mealType)}
              </h2>
              <button onClick={() => setShowAddModal(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-6 h-6 rotate-180" /> {/* Using Chevron as close icon substitute or just X */}
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recipes
                  .filter(r => {
                    // Filter by category if present
                    const categoryTag = `cat:${showAddModal.mealType}`;
                    const hasCategory = r.tags.some(t => t.startsWith('cat:'));

                    // If recipe has NO category, show it everywhere (or maybe 'other'?)
                    // If recipe HAS category, only show if it matches current meal type
                    // OR if the user wants to see all? For now, strict filtering if category exists.
                    if (hasCategory) {
                      return r.tags.includes(categoryTag);
                    }
                    return true; // Show uncategorized recipes in all slots
                  })
                  .map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddMeal(recipe.id)}
                      className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-brikx-teal transition-all"
                    >
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-white font-medium text-sm line-clamp-2">{recipe.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                          <span>{recipe.default_servings} pers.</span>
                          {recipe.prep_time_min && <span>• {recipe.prep_time_min} min</span>}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              {recipes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Geen recepten gevonden. Maak eerst een recept aan!
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowAddModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

interface MealSlotProps {
  mealPlan: MealPlanWithRecipe | undefined;
  onClickAdd: () => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

function MealSlot({ mealPlan, onClickAdd, onDelete, compact }: MealSlotProps) {
  if (!mealPlan) {
    return (
      <button
        onClick={onClickAdd}
        className={`w-full flex items-center justify-center text-gray-300 hover:text-brikx-teal hover:bg-brikx-teal/5 border-2 border-dashed border-gray-200 rounded-lg transition-all ${compact ? 'h-12' : 'h-full min-h-[100px]'}`}
      >
        <Plus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg group hover:shadow-md transition-all relative overflow-hidden ${compact ? 'flex items-center gap-3 p-2' : 'p-3 h-full'}`}>
      {mealPlan.recipe?.image_url && (
        <img
          src={mealPlan.recipe.image_url}
          alt={mealPlan.recipe.title}
          className={`object-cover rounded-md bg-gray-100 ${compact ? 'w-12 h-12 flex-shrink-0' : 'w-full h-24 mb-2'}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-0.5">
          {mealPlan.title_override || mealPlan.recipe?.title || 'Onbekend recept'}
        </p>
        <p className="text-xs text-gray-500">
          {mealPlan.servings} pers.
        </p>

        {mealPlan.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{mealPlan.notes}</p>
        )}

        {mealPlan.is_leftover && (
          <span className="inline-block mt-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
            Kliekjes
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(mealPlan.id);
        }}
        className={`absolute text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors ${compact ? 'right-2 top-1/2 -translate-y-1/2' : 'top-2 right-2 opacity-0 group-hover:opacity-100'}`}
        title="Verwijderen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
