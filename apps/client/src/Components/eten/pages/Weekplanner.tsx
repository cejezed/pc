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

      {/* Week Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 w-20 sm:w-32">
                Maaltijd
              </th>
              {weekDates.map((date) => (
                <th
                  key={formatDate(date)}
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold min-w-[140px] sm:min-w-[180px] ${isToday(date)
                      ? 'bg-brikx-teal text-white'
                      : 'text-gray-700'
                    }`}
                >
                  <div className="text-xs sm:text-sm">{date.toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
                  <div className="text-[10px] sm:text-xs font-normal">
                    {date.getDate()} {date.toLocaleDateString('nl-NL', { month: 'short' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {MEAL_TYPES.map((mealType) => (
              <tr key={mealType}>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">{getMealTypeEmoji(mealType)}</span>
                    <span className="hidden sm:inline">{getMealTypeLabel(mealType)}</span>
                  </div>
                </td>
                {weekDates.map((date) => {
                  const dateStr = formatDate(date);
                  const mealPlan = mealPlansByDate[dateStr]?.[mealType];

                  return (
                    <td
                      key={`${dateStr}-${mealType}`}
                      className={`px-2 py-2 ${isToday(date) ? 'bg-blue-50' : ''
                        }`}
                    >
                      {mealPlan ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 group hover:shadow-md transition-shadow">
                          {mealPlan.recipe && (
                            <>
                              {mealPlan.recipe.image_url && (
                                <img
                                  src={mealPlan.recipe.image_url}
                                  alt={mealPlan.recipe.title}
                                  className="w-full h-24 object-cover rounded mb-2"
                                />
                              )}
                              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                {mealPlan.title_override || mealPlan.recipe.title}
                              </p>
                              <p className="text-xs text-gray-600 mb-2">
                                {mealPlan.servings} personen
                              </p>
                            </>
                          )}
                          {mealPlan.notes && (
                            <p className="text-xs text-gray-500 mb-2">{mealPlan.notes}</p>
                          )}
                          {mealPlan.is_leftover && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              Kliekjes
                            </span>
                          )}
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteMeal(mealPlan.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddModal({ date: dateStr, mealType })}
                          className="w-full h-full min-h-[80px] flex items-center justify-center text-gray-400 hover:text-brikx-teal hover:bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
