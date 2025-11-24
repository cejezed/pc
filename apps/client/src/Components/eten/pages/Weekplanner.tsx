import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, ShoppingCart, Wand2, Calendar, Utensils } from 'lucide-react';
import { useMealPlans, useCreateMealPlan, useDeleteMealPlan, useRecipes } from '../hooks';
import { getWeekDates, formatDate, formatDateNL, getMealTypeLabel, getMealTypeEmoji } from '../utils';
import { MealType, MEAL_TYPES, MealPlanWithRecipe } from '../types';
import { isToday } from 'date-fns';
import { Button } from '@/Components/ui/button';

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
    if (confirm('Weet je zeker dat je deze maaltijd wilt verwijderen?')) {
      await deleteMealPlan.mutateAsync(id);
    }
  };

  const handleClearWeek = async () => {
    if (!confirm('Weet je zeker dat je alle maaltijden van deze week wilt verwijderen?')) {
      return;
    }

    // Delete all meal plans for the current week
    for (const plan of mealPlans) {
      await deleteMealPlan.mutateAsync(plan.id);
    }
  };

  const handleGenerateMealPlan = async () => {
    if (!confirm('Weet je zeker dat je een weekmenu wilt genereren? Dit vult lege plekken in je weekplanning.')) {
      return;
    }

    const daysToPlan = weekDates;
    const mealTypes: MealType[] = ['ontbijt', 'lunch', 'avond'];
    const newMealPlans: { date: string; mealType: MealType; recipeId: string; servings: number }[] = [];

    // Track used recipes to prevent duplicates
    const usedRecipeIds = new Set<string>();

    // Initialize with recipes already in the current week
    Object.values(mealPlansByDate).forEach(day => {
      Object.values(day).forEach(plan => {
        if (plan?.recipe_id) {
          usedRecipeIds.add(plan.recipe_id);
        }
      });
    });

    // Helper to shuffle array
    const shuffleArray = <T,>(array: T[]): T[] => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    for (const date of daysToPlan) {
      const dateStr = formatDate(date);

      for (const type of mealTypes) {
        // Check if meal already exists
        if (mealPlansByDate[dateStr]?.[type]) continue;

        // Get eligible recipes for this category
        const categoryTag = `cat:${type}`;
        let eligibleRecipes = recipes.filter(r => r.tags.includes(categoryTag));

        // Filter out already used recipes
        let availableRecipes = eligibleRecipes.filter(r => !usedRecipeIds.has(r.id));

        // If we ran out of unique recipes, reset the used list for this category (fallback)
        if (availableRecipes.length === 0 && eligibleRecipes.length > 0) {
          availableRecipes = eligibleRecipes;
        }

        if (availableRecipes.length > 0) {
          // Pick a random one from the available list
          const shuffled = shuffleArray(availableRecipes);
          const selectedRecipe = shuffled[0];

          newMealPlans.push({
            date: dateStr,
            mealType: type,
            recipeId: selectedRecipe.id,
            servings: selectedRecipe.default_servings
          });

          // Mark as used
          usedRecipeIds.add(selectedRecipe.id);
        }
      }
    }

    if (newMealPlans.length === 0) {
      alert('Geen nieuwe maaltijden om toe te voegen. Misschien zijn alle plekken al gevuld of zijn er geen recepten voor de categorieën.');
      return;
    }

    // Execute mutations
    for (const plan of newMealPlans) {
      await createMealPlan.mutateAsync({
        date: plan.date,
        meal_type: plan.mealType,
        recipe_id: plan.recipeId,
        servings: plan.servings,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--zeus-bg)] text-[var(--zeus-text-secondary)] p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={handleClearWeek}
            variant="outline"
            className="zeus-button-secondary"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Alles wissen</span>
            <span className="sm:hidden">Wissen</span>
          </Button>

          <Button
            onClick={handleGenerateMealPlan}
            className="btn-zeus-primary"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Weekmenu Genereren</span>
            <span className="sm:hidden">Genereren</span>
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 shadow-lg">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-[var(--zeus-primary)]/10 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] rounded-lg transition-colors border border-transparent hover:border-[var(--zeus-primary)]/30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <p className="font-bold text-lg sm:text-xl text-[var(--zeus-text)] tracking-wide">
              {formatDateNL(weekDates[0])} - {formatDateNL(weekDates[6])}
            </p>
            <p className="text-xs sm:text-sm text-[var(--zeus-primary)] font-mono mt-1">WEEK {getWeekNumber(weekDates[0])}</p>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-[var(--zeus-primary)]/10 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] rounded-lg transition-colors border border-transparent hover:border-[var(--zeus-primary)]/30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Week Grid - Desktop (Table) */}
        <div className="hidden lg:block bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] overflow-hidden shadow-2xl">
          <table className="w-full table-fixed">
            <thead className="bg-[var(--zeus-bg-secondary)] border-b border-[var(--zeus-border)]">
              <tr>
                <th className="w-32 px-4 py-4 text-left text-sm font-bold text-[var(--zeus-primary)] uppercase tracking-wider">
                  Maaltijd
                </th>
                {weekDates.map((date) => (
                  <th
                    key={formatDate(date)}
                    className={`px-4 py-4 text-center border-l border-[var(--zeus-border)] ${isToday(date)
                      ? 'bg-[var(--zeus-primary)]/10 text-[var(--zeus-text)]'
                      : 'text-[var(--zeus-text-secondary)]'
                      }`}
                  >
                    <div className="font-bold uppercase tracking-wide text-sm">{date.toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
                    <div className={`text-xs font-mono mt-1 ${isToday(date) ? 'text-[var(--zeus-primary)]' : 'text-[var(--zeus-text-secondary)]/50'}`}>
                      {date.getDate()} {date.toLocaleDateString('nl-NL', { month: 'short' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--zeus-border)]">
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType} className="hover:bg-[var(--zeus-bg-secondary)]/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--zeus-text-secondary)] bg-[var(--zeus-bg-secondary)]/30 border-r border-[var(--zeus-border)]">
                    <div className="flex items-center gap-3">
                      <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{getMealTypeEmoji(mealType)}</span>
                      <span className="font-bold">{getMealTypeLabel(mealType)}</span>
                    </div>
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = formatDate(date);
                    const mealPlan = mealPlansByDate[dateStr]?.[mealType];

                    return (
                      <td
                        key={`${dateStr}-${mealType}`}
                        className={`p-2 border-l border-[var(--zeus-border)] align-top h-40 transition-colors ${isToday(date) ? 'bg-[var(--zeus-primary)]/5' : ''
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
            <div key={formatDate(date)} className={`bg-[var(--zeus-card)] rounded-xl border shadow-lg overflow-hidden ${isToday(date) ? 'border-[var(--zeus-primary)] ring-1 ring-[var(--zeus-primary)]/50' : 'border-[var(--zeus-border)]'}`}>
              {/* Day Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isToday(date) ? 'bg-[var(--zeus-primary)] text-white' : 'bg-[var(--zeus-bg-secondary)] border-b border-[var(--zeus-border)]'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg capitalize tracking-wide">
                    {date.toLocaleDateString('nl-NL', { weekday: 'long' })}
                  </span>
                  <span className={`text-sm font-mono ${isToday(date) ? 'text-white/90' : 'text-[var(--zeus-text-secondary)]'}`}>
                    {date.getDate()} {date.toLocaleDateString('nl-NL', { month: 'long' })}
                  </span>
                </div>
                {isToday(date) && (
                  <span className="text-xs font-bold bg-white text-[var(--zeus-primary)] px-2 py-1 rounded-full shadow-sm">
                    VANDAAG
                  </span>
                )}
              </div>

              {/* Meals List */}
              <div className="divide-y divide-[var(--zeus-border)]">
                {MEAL_TYPES.map((mealType) => {
                  const dateStr = formatDate(date);
                  const mealPlan = mealPlansByDate[dateStr]?.[mealType];

                  return (
                    <div key={mealType} className="p-3 flex gap-3">
                      {/* Meal Type Icon/Label */}
                      <div className="w-24 flex-shrink-0 flex flex-col justify-center text-[var(--zeus-text-secondary)]">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span className="text-lg">{getMealTypeEmoji(mealType)}</span>
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
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--zeus-card)] border border-[var(--zeus-border)] rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-[0_0_50px_var(--zeus-primary-glow)]">
              <div className="p-4 sm:p-6 border-b border-[var(--zeus-border)] flex justify-between items-center bg-[var(--zeus-bg-secondary)] rounded-t-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--zeus-text)] flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[var(--zeus-primary)]" />
                  Kies een recept voor <span className="text-[var(--zeus-primary)]">{getMealTypeLabel(showAddModal.mealType)}</span>
                </h2>
                <button onClick={() => setShowAddModal(null)} className="text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] transition-colors">
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recipes
                    .filter(r => {
                      const categoryTag = `cat:${showAddModal.mealType}`;
                      const hasCategory = r.tags.some(t => t.startsWith('cat:'));
                      if (hasCategory) {
                        return r.tags.includes(categoryTag);
                      }
                      return true;
                    })
                    .map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => handleAddMeal(recipe.id)}
                        className="group relative aspect-square bg-[var(--zeus-bg-secondary)] rounded-xl overflow-hidden text-left border border-[var(--zeus-border)] hover:border-[var(--zeus-primary)] transition-all hover:shadow-[0_0_20px_var(--zeus-primary-glow)]"
                      >
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--zeus-text-secondary)] group-hover:text-[var(--zeus-primary)]/50 transition-colors">
                            <ShoppingCart className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
                          <p className="text-white font-bold text-sm line-clamp-2 group-hover:text-[var(--zeus-primary)] transition-colors">{recipe.title}</p>
                          <div className="flex items-center gap-2 text-xs text-[var(--zeus-text-secondary)] mt-1 font-mono">
                            <span>{recipe.default_servings} pers.</span>
                            {recipe.prep_time_min && <span>• {recipe.prep_time_min} min</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>

                {recipes.length === 0 && (
                  <div className="text-center py-12 text-[var(--zeus-text-secondary)]/50 italic">
                    Geen recepten gevonden. Maak eerst een recept aan!
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--zeus-border)] flex justify-end bg-[var(--zeus-bg-secondary)] rounded-b-2xl">
                <button
                  onClick={() => setShowAddModal(null)}
                  className="px-6 py-2 text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-text)] hover:bg-[var(--zeus-primary)]/10 rounded-lg transition-colors font-medium"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
        className={`w-full flex items-center justify-center text-[var(--zeus-text-secondary)] hover:text-[var(--zeus-primary)] hover:bg-[var(--zeus-primary)]/5 border-2 border-dashed border-[var(--zeus-border)] hover:border-[var(--zeus-primary)]/50 rounded-xl transition-all group ${compact ? 'h-16' : 'h-full min-h-[100px]'}`}
      >
        <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  const hasImage = !!mealPlan.recipe?.image_url;

  return (
    <div
      className={`
        relative group overflow-hidden rounded-xl transition-all hover:shadow-[0_0_20px_var(--zeus-primary-glow)] cursor-pointer border
        ${compact ? 'h-24' : 'h-full min-h-[120px]'}
        ${hasImage ? 'bg-black border-transparent' : 'bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)]'}
      `}
    >
      {/* Background Image */}
      {hasImage && (
        <>
          <img
            src={mealPlan.recipe!.image_url!}
            alt={mealPlan.recipe?.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </>
      )}

      {/* Content */}
      <div className={`relative h-full flex flex-col justify-end p-3 z-10`}>
        <p className={`font-bold text-sm line-clamp-2 leading-tight text-white group-hover:text-[var(--zeus-primary)] transition-colors ${hasImage ? 'drop-shadow-md' : ''}`}>
          {mealPlan.title_override || mealPlan.recipe?.title || 'Onbekend recept'}
        </p>

        <div className={`flex items-center gap-2 text-xs mt-1 font-mono ${hasImage ? 'text-gray-300' : 'text-[var(--zeus-text-secondary)]'}`}>
          <span>{mealPlan.servings} pers.</span>
          {mealPlan.is_leftover && (
            <span className="bg-[var(--zeus-primary)] text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Kliekjes
            </span>
          )}
        </div>

        {mealPlan.notes && (
          <p className={`text-[10px] mt-1 line-clamp-1 italic ${hasImage ? 'text-gray-400' : 'text-[var(--zeus-text-secondary)]/50'}`}>
            {mealPlan.notes}
          </p>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(mealPlan.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 bg-black/50 text-[var(--zeus-primary)] hover:bg-red-500 hover:text-white backdrop-blur-sm z-20"
        title="Verwijderen"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
