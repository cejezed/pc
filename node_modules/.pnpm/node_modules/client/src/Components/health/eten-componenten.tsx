import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Utensils, Plus, Trash2, Clock } from "lucide-react";
import { useMeals } from "./hooks";
import { todayISO, mealTypeLabel, mealTypeEmoji } from "./helpers";
import {
  StatCard,
  StarRating,
  LoadingState,
  EmptyState,
  DateHeader,
} from "./basis-componenten";
import type { Meal } from "./hooks";

export function EtenTab() {
  const { meals, isLoading, addMeal, deleteMeal } = useMeals();
  const [showModal, setShowModal] = useState(false);

  // Laatste 7 dagen
  const { last7Days, totalMeals, avgSatisfaction, totalCalories, groupedMeals, sortedDates } =
    useMemo(() => {
      const weekAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const last = (meals ?? []).filter((m: Meal) => m.meal_date >= weekAgoISO);
      const total = last.length;

      const withSat = last.filter((m: Meal) => m.satisfaction_rating != null);
      const avgSat =
        withSat.length > 0
          ? withSat.reduce((sum: number, m: Meal) => sum + (m.satisfaction_rating ?? 0), 0) / withSat.length
          : 0;

      const kcal = last.reduce((sum: number, m: Meal) => sum + (m.calories ?? 0), 0);

      const grouped = (meals ?? []).reduce<Record<string, Meal[]>>((acc, meal: Meal) => {
        const date = meal.meal_date;
        (acc[date] ||= []).push(meal);
        return acc;
      }, {});
      const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

      return {
        last7Days: last,
        totalMeals: total,
        avgSatisfaction: avgSat,
        totalCalories: kcal,
        groupedMeals: grouped,
        sortedDates: dates,
      };
    }, [meals]);

  if (isLoading) return <LoadingState message="Maaltijden laden..." />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Maaltijden (7d)"
          value={totalMeals}
          icon={<Utensils className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Gem. tevredenheid"
          value={avgSatisfaction ? avgSatisfaction.toFixed(1) : "-"}
          unit={avgSatisfaction ? "/ 5" : ""}
          subtitle={
            avgSatisfaction > 0 ? "★".repeat(Math.round(avgSatisfaction)) : "Nog geen data"
          }
        />
        <StatCard
          title="Totaal calorieën (7d)"
          value={totalCalories > 0 ? totalCalories : "-"}
          unit={totalCalories > 0 ? "kcal" : ""}
          subtitle="Optioneel bijgehouden"
        />
      </div>

      {/* Info banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Deze feature is bedoeld voor bewustwording, niet voor restrictie.
            Alle velden zijn optioneel – voeg toe wat voor jou nuttig is!
          </p>
        </CardContent>
      </Card>

      {/* Add Button */}
      <Button onClick={() => setShowModal(true)} className="w-full md:w-auto">
        <Plus className="w-4 h-4 mr-2" /> Maaltijd toevoegen
      </Button>

      {/* Meals List */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="Nog geen maaltijden gelogd"
          description="Begin met het bijhouden van je maaltijden voor meer inzicht"
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Eerste maaltijd
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <DateHeader date={date} />
              <div className="grid gap-3">
                {groupedMeals[date]
                  .sort((a: Meal, b: Meal) => (a.meal_time || "").localeCompare(b.meal_time || ""))
                  .map((meal: Meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onDelete={() => deleteMeal.mutate(meal.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddMealModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={(data) => {
          addMeal.mutate(data);
          setShowModal(false);
        }}
      />
    </div>
  );
}

function MealCard({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{mealTypeEmoji(meal.meal_type)}</span>
            <div>
              <CardTitle className="text-base">{meal.description}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {mealTypeLabel(meal.meal_type)}
                </p>
                {meal.meal_time && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {meal.meal_time}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Verwijder maaltijd"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Ratings */}
        {(meal.satisfaction_rating || meal.healthiness_rating) && (
          <div className="flex gap-4 text-sm">
            {meal.satisfaction_rating != null && (
              <div>
                <span className="text-muted-foreground">Tevredenheid: </span>
                <StarRating rating={meal.satisfaction_rating} readonly />
              </div>
            )}
            {meal.healthiness_rating != null && (
              <div>
                <span className="text-muted-foreground">Gezondheid: </span>
                <StarRating rating={meal.healthiness_rating} readonly />
              </div>
            )}
          </div>
        )}

        {/* Nutrition (if provided) */}
        {(meal.calories || meal.protein_grams || meal.carbs_grams || meal.fat_grams) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {meal.calories != null && <Badge variant="secondary">{meal.calories} kcal</Badge>}
            {meal.protein_grams != null && (
              <Badge variant="secondary">{meal.protein_grams}g eiwit</Badge>
            )}
            {meal.carbs_grams != null && (
              <Badge variant="secondary">{meal.carbs_grams}g koolhydraten</Badge>
            )}
            {meal.fat_grams != null && <Badge variant="secondary">{meal.fat_grams}g vet</Badge>}
          </div>
        )}

        {/* Tags */}
        {meal.tags && meal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meal.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes */}
        {meal.notes && <p className="text-sm text-muted-foreground pt-2">{meal.notes}</p>}
      </CardContent>
    </Card>
  );
}

function AddMealModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Meal>) => void;
}) {
  const [satisfactionRating, setSatisfactionRating] = useState<number>(0);
  const [healthinessRating, setHealthinessRating] = useState<number>(0);
  const [showNutrition, setShowNutrition] = useState(false);

  // ✅ Controlled Select (Radix geeft geen name/waarde aan FormData)
  const [mealType, setMealType] =
    useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🍽️ Maaltijd toevoegen</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const tags = String(fd.get("tags") || "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

            onSubmit({
              meal_type: mealType,
              description: String(fd.get("description")),
              meal_date: String(fd.get("meal_date")),
              meal_time: String(fd.get("meal_time")) || undefined,
              calories: Number(fd.get("calories")) || undefined,
              protein_grams: Number(fd.get("protein_grams")) || undefined,
              carbs_grams: Number(fd.get("carbs_grams")) || undefined,
              fat_grams: Number(fd.get("fat_grams")) || undefined,
              satisfaction_rating: satisfactionRating || undefined,
              healthiness_rating: healthinessRating || undefined,
              notes: String(fd.get("notes") || ""),
              tags: tags.length > 0 ? tags : undefined,
              logged_at: new Date().toISOString(),
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="meal_type" value={mealType} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as "breakfast" | "lunch" | "dinner" | "snack")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">🌅 Ontbijt</SelectItem>
                  <SelectItem value="lunch">🌤️ Lunch</SelectItem>
                  <SelectItem value="dinner">🌙 Diner</SelectItem>
                  <SelectItem value="snack">🎁 Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Datum *</Label>
              <Input type="date" name="meal_date" defaultValue={todayISO()} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beschrijving *</Label>
            <Input name="description" placeholder="Havermout met fruit en noten" required />
          </div>

          <div className="space-y-2">
            <Label>Tijd (optioneel)</Label>
            <Input type="time" name="meal_time" />
          </div>

          {/* Ratings */}
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Tevredenheid (optioneel)</Label>
              <StarRating rating={satisfactionRating} onChange={setSatisfactionRating} />
            </div>

            <div className="space-y-2">
              <Label>Gezondheid (optioneel)</Label>
              <StarRating rating={healthinessRating} onChange={setHealthinessRating} />
            </div>
          </div>

          {/* Nutritional info (optional, collapsible) */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNutrition((v) => !v)}
              className="w-full"
            >
              {showNutrition ? "Verberg" : "Voeg toe"} voedingswaarden (optioneel)
            </Button>
          </div>

          {showNutrition && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-2">
                <Label>Calorieën</Label>
                <Input type="number" name="calories" placeholder="450" />
              </div>
              <div className="space-y-2">
                <Label>Eiwit (g)</Label>
                <Input type="number" step="0.1" name="protein_grams" placeholder="20" />
              </div>
              <div className="space-y-2">
                <Label>Koolhydraten (g)</Label>
                <Input type="number" step="0.1" name="carbs_grams" placeholder="50" />
              </div>
              <div className="space-y-2">
                <Label>Vet (g)</Label>
                <Input type="number" step="0.1" name="fat_grams" placeholder="15" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags (komma gescheiden)</Label>
            <Input name="tags" placeholder="healthy, homemade, comfort" />
          </div>

          <div className="space-y-2">
            <Label>Notities</Label>
            <Textarea name="notes" placeholder="Extra opmerkingen..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit">Opslaan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}