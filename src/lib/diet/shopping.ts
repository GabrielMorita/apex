import type { DietRecipe, FoodCatalogItem, FoodCategory, WeeklyDietPlan } from "@/lib/diet/types";

export type ShoppingGroupKey = "produce" | "proteins" | "grains" | "dairy_eggs" | "fats" | "other";

export interface ShoppingListItem {
  food_id: string;
  food_name: string;
  category: FoodCategory | "other";
  group: ShoppingGroupKey;
  grams: number;
  occurrences: number;
  is_custom: boolean;
}

export const SHOPPING_GROUP_LABELS: Record<ShoppingGroupKey, string> = {
  produce: "Hortifruti",
  proteins: "Proteínas e leguminosas",
  grains: "Cereais e carboidratos",
  dairy_eggs: "Laticínios e ovos",
  fats: "Gorduras",
  other: "Outros",
};

export const SHOPPING_GROUP_ORDER: ShoppingGroupKey[] = ["produce", "proteins", "grains", "dairy_eggs", "fats", "other"];

function groupForCategory(category: FoodCategory | "other"): ShoppingGroupKey {
  if (category === "vegetable" || category === "fruit") return "produce";
  if (category === "meat" || category === "fish" || category === "legume") return "proteins";
  if (category === "grain") return "grains";
  if (category === "dairy" || category === "egg") return "dairy_eggs";
  if (category === "fat") return "fats";
  return "other";
}

export function buildShoppingList(plan: WeeklyDietPlan, catalog: FoodCatalogItem[], recipes: DietRecipe[] = []): ShoppingListItem[] {
  const catalogById = new Map(catalog.map((food) => [food.id, food]));
  const recipeByCatalogId = new Map(recipes.map((recipe) => [recipe.catalog_food_id, recipe]));
  const aggregated = new Map<string, ShoppingListItem>();
  function include(foodId: string, foodName: string, grams: number) {
    const food = catalogById.get(foodId);
    const category = food?.category ?? "other";
    const current = aggregated.get(foodId);
    aggregated.set(foodId, {
      food_id: foodId,
      food_name: current?.food_name ?? foodName,
      category,
      group: groupForCategory(category),
      grams: Math.round(((current?.grams ?? 0) + Number(grams)) * 10) / 10,
      occurrences: (current?.occurrences ?? 0) + 1,
      is_custom: food?.source_type === "custom",
    });
  }
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        const recipe = recipeByCatalogId.get(item.food_id);
        if (recipe && recipe.yield_grams > 0) {
          const multiplier = Number(item.grams) / recipe.yield_grams;
          for (const ingredient of recipe.items) include(ingredient.food_id, ingredient.food_name_snapshot, ingredient.grams * multiplier);
        } else {
          include(item.food_id, item.food_name, item.grams);
        }
      }
    }
  }
  return [...aggregated.values()].sort((left, right) => {
    const groupDifference = SHOPPING_GROUP_ORDER.indexOf(left.group) - SHOPPING_GROUP_ORDER.indexOf(right.group);
    return groupDifference || left.food_name.localeCompare(right.food_name, "pt-BR");
  });
}

export function formatShoppingAmount(grams: number) {
  if (grams >= 1000) return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(grams)} g`;
}

export function shoppingListText(items: ShoppingListItem[], weekStart: string) {
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${weekStart}T12:00:00`));
  const lines = [`Lista de compras Apex — semana de ${date}`];
  for (const group of SHOPPING_GROUP_ORDER) {
    const groupItems = items.filter((item) => item.group === group);
    if (groupItems.length === 0) continue;
    lines.push("", SHOPPING_GROUP_LABELS[group]);
    for (const item of groupItems) lines.push(`- ${item.food_name}: ${formatShoppingAmount(item.grams)}`);
  }
  return lines.join("\n");
}
