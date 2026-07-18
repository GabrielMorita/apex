import { nutrientFromFood } from "@/lib/diet/generator";
import type { DietConsumptionItem, FoodCatalogItem } from "@/lib/diet/types";

export function setConsumedItemGrams(items: DietConsumptionItem[], index: number, grams: number, catalog: FoodCatalogItem[]) {
  return items.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const food = catalog.find((candidate) => candidate.id === item.food_id);
    if (food) return { ...item, grams, ...nutrientFromFood(food, Number.isFinite(grams) ? grams : 0) };
    const ratio = item.grams > 0 && Number.isFinite(grams) ? grams / item.grams : 0;
    return {
      ...item,
      grams,
      calories: item.calories * ratio,
      protein_g: item.protein_g * ratio,
      carbs_g: item.carbs_g * ratio,
      fat_g: item.fat_g * ratio,
    };
  });
}

export function addConsumedFood(items: DietConsumptionItem[], food: FoodCatalogItem) {
  const defaultGrams = Math.min(1000, Math.max(1, Number(food.serving_grams) || 100));
  const existingIndex = items.findIndex((item) => item.food_id === food.id);
  if (existingIndex >= 0) return items.map((item, index) => {
    if (index !== existingIndex) return item;
    const grams = Math.min(1000, item.grams + defaultGrams);
    return { ...item, grams, ...nutrientFromFood(food, grams) };
  });
  const nextOrder = items.reduce((highest, item) => Math.max(highest, item.item_order), -1) + 1;
  return [...items, {
    food_id: food.id,
    food_name: food.name_pt,
    grams: defaultGrams,
    serving_label: food.serving_label,
    item_order: nextOrder,
    origin: "extra" as const,
    ...nutrientFromFood(food, defaultGrams),
  }];
}
