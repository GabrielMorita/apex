import { nutrientFromFood, sumNutrients } from "@/lib/diet/generator";
import type { DietConsumptionEntry, DietConsumptionItem, DietMeal, DietMealItem, DietMealTemplate, FoodCatalogItem, WeeklyDietPlan } from "@/lib/diet/types";

export function setPlannedItemGrams(items: DietMealItem[], index: number, grams: number, catalog: FoodCatalogItem[]) {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const food = catalog.find((candidate) => candidate.id === item.food_id);
    if (food) return { ...item, grams, ...nutrientFromFood(food, Number.isFinite(grams) ? grams : 0) };
    const ratio = item.grams > 0 && Number.isFinite(grams) ? grams / item.grams : 0;
    return {
      ...item,
      grams,
      calories: Math.round(item.calories * ratio * 10) / 10,
      protein_g: Math.round(item.protein_g * ratio * 10) / 10,
      carbs_g: Math.round(item.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(item.fat_g * ratio * 10) / 10,
    };
  });
}

export function addPlannedFood(items: DietMealItem[], food: FoodCatalogItem) {
  const defaultGrams = Math.min(1000, Math.max(1, Number(food.serving_grams) || 100));
  const existingIndex = items.findIndex((item) => item.food_id === food.id);
  if (existingIndex >= 0) return items.map((item, index) => {
    if (index !== existingIndex) return item;
    const grams = Math.min(1000, item.grams + defaultGrams);
    return { ...item, grams, ...nutrientFromFood(food, grams) };
  });
  return [...items, {
    food_id: food.id,
    food_name: food.name_pt,
    grams: defaultGrams,
    serving_label: food.serving_label,
    item_order: items.length,
    ...nutrientFromFood(food, defaultGrams),
  }];
}

export function updatePlannedMealItems(plan: WeeklyDietPlan, dayIndex: number, mealIndex: number, changedItems: DietMealItem[]) {
  const items = changedItems.map((item, itemOrder) => ({ ...item, item_order: itemOrder }));
  const days = plan.days.map((day, currentDayIndex) => {
    if (currentDayIndex !== dayIndex) return day;
    const meals = day.meals.map((meal, currentMealIndex) => currentMealIndex === mealIndex ? { ...meal, items, ...sumNutrients(items) } : meal);
    return { ...day, meals, ...sumNutrients(meals) };
  });
  return { ...plan, days };
}

export function consumptionItemsFromPlannedMeal(meal: DietMeal, existing: DietConsumptionEntry): DietConsumptionItem[] {
  return [
    ...meal.items.map((item): DietConsumptionItem => ({ ...item, origin: "planned" })),
    ...existing.items_snapshot.filter((item) => item.origin === "extra"),
  ].map((item, itemOrder) => ({ ...item, item_order: itemOrder }));
}

export function copyPlannedMealToDays(plan: WeeklyDietPlan, sourceDayIndex: number, mealIndex: number, targetDayIndices: number[]) {
  const sourceMeal = plan.days[sourceDayIndex]?.meals[mealIndex];
  if (!sourceMeal) return plan;
  const targets = new Set(targetDayIndices.filter((dayIndex) => dayIndex !== sourceDayIndex));
  const days = plan.days.map((day, dayIndex) => {
    if (!targets.has(dayIndex)) return day;
    const targetMeal = day.meals[mealIndex];
    if (!targetMeal || targetMeal.is_locked) return day;
    const items = sourceMeal.items.map((item, itemOrder) => ({ ...item, item_order: itemOrder }));
    const meals = day.meals.map((meal, currentMealIndex) => currentMealIndex === mealIndex ? { ...meal, items, ...sumNutrients(items) } : meal);
    return { ...day, meals, ...sumNutrients(meals) };
  });
  return { ...plan, days };
}

export function plannedItemsFromTemplate(template: DietMealTemplate, catalog: FoodCatalogItem[]): DietMealItem[] | null {
  const catalogById = new Map(catalog.map((food) => [food.id, food]));
  const items: DietMealItem[] = [];
  for (const templateItem of template.items) {
    const food = catalogById.get(templateItem.food_id);
    if (!food) return null;
    items.push({
      food_id: food.id,
      food_name: food.name_pt,
      grams: templateItem.grams,
      serving_label: food.serving_label,
      item_order: items.length,
      ...nutrientFromFood(food, templateItem.grams),
    });
  }
  return items;
}
