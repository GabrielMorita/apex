import type {
  DietMeal,
  DietMealItem,
  DietPlanDay,
  DietPreferences,
  FoodCatalogItem,
  NutrientTotals,
  NutritionTargets,
  WeeklyDietPlan,
} from "@/lib/diet/types";

export const DIET_GENERATION_VERSION = "apex-deterministic-1.1";

const ZERO: NutrientTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
const MEAL_RATIOS: Record<number, number[]> = {
  2: [0.45, 0.55],
  3: [0.25, 0.4, 0.35],
  4: [0.22, 0.35, 0.13, 0.3],
  5: [0.2, 0.1, 0.32, 0.1, 0.28],
  6: [0.18, 0.09, 0.28, 0.09, 0.26, 0.1],
};

const MEAL_NAMES: Record<number, string[]> = {
  2: ["Primeira refeição", "Jantar"],
  3: ["Café da manhã", "Almoço", "Jantar"],
  4: ["Café da manhã", "Almoço", "Lanche", "Jantar"],
  5: ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar"],
  6: ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"],
};

const IDS = {
  mainProtein: {
    omnivore: ["taco-0410", "taco-0377", "taco-0318", "taco-0488"],
    pescatarian: ["taco-0318", "taco-0486", "taco-0488", "taco-0584", "taco-0577"],
    vegetarian: ["taco-0486", "taco-0488", "taco-0584", "taco-0577", "taco-0461"],
    vegan: ["taco-0584", "taco-0577", "taco-0561", "taco-0567"],
  },
  snackProtein: {
    omnivore: ["taco-0448", "taco-0486", "taco-0488", "taco-0461"],
    pescatarian: ["taco-0448", "taco-0486", "taco-0488", "taco-0461"],
    vegetarian: ["taco-0448", "taco-0486", "taco-0488", "taco-0461"],
    vegan: ["taco-0581", "taco-0586", "taco-0584", "taco-0577"],
  },
  carbs: ["taco-0001", "taco-0003", "taco-0088", "taco-0091", "taco-0129"],
  breakfastCarbs: ["taco-0007", "taco-0052", "taco-0053", "taco-0088"],
  vegetables: ["taco-0100", "taco-0109", "taco-0070", "taco-0064", "taco-0546", "taco-0157", "taco-0078"],
  fruits: ["taco-0182", "taco-0214", "taco-0222", "taco-0225"],
};

type DriverRole = "protein" | "carb" | "fat" | "fixed";
type SelectedFood = { food: FoodCatalogItem; role: DriverRole; grams: number };

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function nutrientFromFood(food: FoodCatalogItem, grams: number): NutrientTotals {
  const multiplier = grams / 100;
  return {
    calories: round(food.calories * multiplier),
    protein_g: round(food.protein_g * multiplier),
    carbs_g: round(food.carbs_g * multiplier),
    fat_g: round(food.fat_g * multiplier),
  };
}

export function sumNutrients(values: NutrientTotals[]): NutrientTotals {
  return values.reduce((total, value) => ({
    calories: round(total.calories + value.calories),
    protein_g: round(total.protein_g + value.protein_g),
    carbs_g: round(total.carbs_g + value.carbs_g),
    fat_g: round(total.fat_g + value.fat_g),
  }), { ...ZERO });
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function exclusionTerms(preferences: DietPreferences) {
  return [...preferences.allergies, ...preferences.restrictions, ...preferences.disliked_foods]
    .flatMap((value) => {
      const normalized = normalize(value).replace(/^(sem|alergia a|alergico a)\s+/, "");
      return normalized.split(/[,;/]/).map((term) => term.trim()).filter((term) => term.length > 1);
    });
}

export function isAllowed(food: FoodCatalogItem, preferences: DietPreferences) {
  if (!food.dietary_patterns.includes(preferences.dietary_pattern)) return false;
  const searchable = normalize([food.name_pt, ...food.allergen_tags].join(" "));
  return !exclusionTerms(preferences).some((term) => searchable.includes(term) || term.includes(searchable));
}

function rotationIndex(dayIndex: number, salt: number, length: number, variety: DietPreferences["variety_level"]) {
  const pace = variety === "practical" ? Math.floor(dayIndex / 2) : variety === "varied" ? dayIndex * 2 : dayIndex;
  return Math.abs(pace + salt) % length;
}

function pickByIds(ids: string[], catalog: FoodCatalogItem[], preferences: DietPreferences, dayIndex: number, salt: number, fallbackTags: string[]) {
  const available = ids.map((id) => catalog.find((food) => food.id === id)).filter((food): food is FoodCatalogItem => Boolean(food)).filter((food) => isAllowed(food, preferences));
  const budgetFiltered = preferences.budget_level === "economical" ? available.filter((food) => food.cost_level <= 2) : available;
  const candidates = budgetFiltered.length > 0 ? budgetFiltered : available;
  if (candidates.length > 0) {
    const favorites = preferences.favorite_foods.map(normalize).filter(Boolean);
    const preferred = candidates.filter((food) => favorites.some((favorite) => normalize(food.name_pt).includes(favorite)));
    const pool = preferred.length > 0 && (dayIndex + salt) % 3 === 0 ? preferred : candidates;
    return pool[rotationIndex(dayIndex, salt, pool.length, preferences.variety_level)];
  }
  const fallback = catalog.filter((food) => isAllowed(food, preferences) && fallbackTags.every((tag) => food.meal_tags.includes(tag)));
  if (fallback.length === 0) throw new Error("As restrições atuais não deixam alimentos suficientes para montar este plano. Revise as preferências da Dieta.");
  return fallback[rotationIndex(dayIndex, salt, fallback.length, preferences.variety_level)];
}

function bounds(role: DriverRole, isMain: boolean) {
  if (role === "protein") return isMain ? [50, 360] : [20, 300];
  if (role === "carb") return isMain ? [40, 450] : [20, 220];
  if (role === "fat") return [3, 30];
  return [60, 220];
}

function fitMeal(selected: SelectedFood[], target: NutrientTotals, isMain: boolean) {
  const macroKey = { protein: "protein_g", carb: "carbs_g", fat: "fat_g" } as const;
  for (let pass = 0; pass < 8; pass += 1) {
    (["protein", "carb", "fat"] as const).forEach((role) => {
      const index = selected.findIndex((item) => item.role === role);
      if (index < 0) return;
      const key = macroKey[role];
      const perGram = selected[index].food[key] / 100;
      if (perGram <= 0) return;
      const otherNutrients = sumNutrients(selected.filter((_, itemIndex) => itemIndex !== index).map((item) => nutrientFromFood(item.food, item.grams)));
      const otherTotal = otherNutrients[key];
      const [minimum, maximum] = bounds(role, isMain);
      let fittedGrams = Math.min(maximum, Math.max(minimum, round((target[key] - otherTotal) / perGram, 0)));
      if (role === "protein" && selected[index].food.fat_g > 0) {
        const fatPerGram = selected[index].food.fat_g / 100;
        const gramsWithinFatTarget = Math.max(minimum, (Math.max(0, target.fat_g - otherNutrients.fat_g) / fatPerGram));
        fittedGrams = Math.min(fittedGrams, gramsWithinFatTarget);
      }
      selected[index].grams = round(fittedGrams, 0);
    });
  }
  return selected;
}

function itemFromSelection(selected: SelectedFood, itemOrder: number): DietMealItem {
  return {
    food_id: selected.food.id,
    food_name: selected.food.name_pt,
    grams: selected.grams,
    serving_label: selected.food.serving_label,
    item_order: itemOrder,
    ...nutrientFromFood(selected.food, selected.grams),
  };
}

function generateMeal(catalog: FoodCatalogItem[], preferences: DietPreferences, targets: NutritionTargets, dayIndex: number, mealIndex: number, regenerationCount = 0): DietMeal {
  const names = MEAL_NAMES[preferences.meal_count] ?? MEAL_NAMES[4];
  const ratios = MEAL_RATIOS[preferences.meal_count] ?? MEAL_RATIOS[4];
  const name = names[mealIndex] ?? `Refeição ${mealIndex + 1}`;
  const ratio = ratios[mealIndex] ?? 1 / preferences.meal_count;
  const target = {
    calories: targets.calories * ratio,
    protein_g: targets.protein_g * ratio,
    carbs_g: targets.carbs_g * ratio,
    fat_g: targets.fat_g * ratio,
  };
  const salt = regenerationCount * 3 + mealIndex;
  const isMain = name === "Almoço" || name === "Jantar" || name === "Primeira refeição";
  const isBreakfast = name === "Café da manhã";
  let selected: SelectedFood[];

  if (isMain) {
    const protein = pickByIds(IDS.mainProtein[preferences.dietary_pattern], catalog, preferences, dayIndex, salt, ["main", "protein"]);
    const carb = pickByIds(IDS.carbs, catalog, preferences, dayIndex, salt + 1, ["main", "carb"]);
    const vegetable = pickByIds(IDS.vegetables, catalog, preferences, dayIndex, salt + 2, ["vegetable"]);
    const oil = pickByIds(["taco-0260"], catalog, preferences, dayIndex, salt, ["fat"]);
    selected = [
      { food: protein, role: "protein", grams: 150 },
      { food: carb, role: "carb", grams: 170 },
      { food: vegetable, role: "fixed", grams: 120 },
      ...(preferences.dietary_pattern === "vegan" ? [{ food: pickByIds(["taco-0581", "taco-0586"], catalog, preferences, dayIndex, salt + 3, ["main", "protein"]), role: "fixed" as const, grams: 60 }] : []),
      { food: oil, role: "fat", grams: 8 },
    ];
  } else {
    const protein = pickByIds(IDS.snackProtein[preferences.dietary_pattern], catalog, preferences, dayIndex, salt, ["snack", "protein"]);
    const carb = pickByIds(isBreakfast ? IDS.breakfastCarbs : IDS.fruits, catalog, preferences, dayIndex, salt + 1, isBreakfast ? ["breakfast", "carb"] : ["fruit"]);
    const fruit = pickByIds(IDS.fruits, catalog, preferences, dayIndex, salt + 2, ["fruit"]);
    const fat = pickByIds(["taco-0557"], catalog, preferences, dayIndex, salt + 3, ["fat"]);
    selected = [
      { food: protein, role: "protein", grams: 100 },
      { food: carb, role: "carb", grams: isBreakfast ? 60 : 130 },
      ...(isBreakfast && carb.id !== fruit.id ? [{ food: fruit, role: "fixed" as const, grams: 100 }] : []),
      { food: fat, role: "fat", grams: 10 },
    ];
  }

  const items = fitMeal(selected, target, isMain).map(itemFromSelection);
  const totals = sumNutrients(items);
  return {
    name,
    meal_order: mealIndex,
    scheduled_time: preferences.meal_times[mealIndex]?.slice(0, 5) ?? "",
    is_locked: false,
    regeneration_count: regenerationCount,
    items,
    ...totals,
  };
}

function datePlusDays(date: string, days: number) {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function buildDay(date: string, dayOrder: number, meals: DietMeal[]): DietPlanDay {
  return { plan_date: date, day_order: dayOrder, meals, ...sumNutrients(meals) };
}

export function currentWeekStart(reference = new Date()) {
  const local = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12);
  const offset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - offset);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

function weekRotationOffset(weekStart: string) {
  const [year, month, day] = weekStart.split("-").map(Number);
  const weekNumber = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(2020, 0, 6)) / 604_800_000);
  return Math.abs(weekNumber % 97) * 7;
}

export function generateWeeklyPlan(catalog: FoodCatalogItem[], preferences: DietPreferences, targets: NutritionTargets, weekStart = currentWeekStart()): WeeklyDietPlan {
  const rotationOffset = weekRotationOffset(weekStart);
  const days = Array.from({ length: 7 }, (_, dayIndex) => {
    const meals = Array.from({ length: preferences.meal_count }, (_, mealIndex) => generateMeal(catalog, preferences, targets, rotationOffset + dayIndex, mealIndex));
    return buildDay(datePlusDays(weekStart, dayIndex), dayIndex, meals);
  });
  return {
    week_start: weekStart,
    generation_version: DIET_GENERATION_VERSION,
    targets_snapshot: { calories: targets.calories, protein_g: targets.protein_g, carbs_g: targets.carbs_g, fat_g: targets.fat_g },
    preferences_snapshot: {
      meal_count: preferences.meal_count,
      dietary_pattern: preferences.dietary_pattern,
      budget_level: preferences.budget_level,
      variety_level: preferences.variety_level,
    },
    days,
  };
}

export function regenerateMeal(plan: WeeklyDietPlan, dayIndex: number, mealIndex: number, catalog: FoodCatalogItem[], preferences: DietPreferences, targets: NutritionTargets) {
  const rotationOffset = weekRotationOffset(plan.week_start);
  const days = plan.days.map((day, currentDayIndex) => {
    if (currentDayIndex !== dayIndex) return day;
    const meals = day.meals.map((meal, currentMealIndex) => currentMealIndex === mealIndex ? generateMeal(catalog, preferences, targets, rotationOffset + dayIndex, mealIndex, meal.regeneration_count + 1) : meal);
    return buildDay(day.plan_date, day.day_order, meals);
  });
  return { ...plan, days };
}

export function regenerateDay(plan: WeeklyDietPlan, dayIndex: number, catalog: FoodCatalogItem[], preferences: DietPreferences, targets: NutritionTargets) {
  const rotationOffset = weekRotationOffset(plan.week_start);
  const days = plan.days.map((day, currentDayIndex) => {
    if (currentDayIndex !== dayIndex) return day;
    const meals = day.meals.map((meal, mealIndex) => meal.is_locked ? meal : generateMeal(catalog, preferences, targets, rotationOffset + dayIndex, mealIndex, meal.regeneration_count + 1));
    return buildDay(day.plan_date, day.day_order, meals);
  });
  return { ...plan, days };
}

export function regenerateWeek(plan: WeeklyDietPlan, catalog: FoodCatalogItem[], preferences: DietPreferences, targets: NutritionTargets) {
  const rotationOffset = weekRotationOffset(plan.week_start);
  const days = plan.days.map((day, dayIndex) => {
    const meals = day.meals.map((meal, mealIndex) => meal.is_locked ? meal : generateMeal(catalog, preferences, targets, rotationOffset + dayIndex, mealIndex, meal.regeneration_count + 1));
    return buildDay(day.plan_date, day.day_order, meals);
  });
  return {
    ...plan,
    generation_version: DIET_GENERATION_VERSION,
    targets_snapshot: { calories: targets.calories, protein_g: targets.protein_g, carbs_g: targets.carbs_g, fat_g: targets.fat_g },
    preferences_snapshot: {
      meal_count: preferences.meal_count,
      dietary_pattern: preferences.dietary_pattern,
      budget_level: preferences.budget_level,
      variety_level: preferences.variety_level,
    },
    days,
  };
}

export function toggleMealLock(plan: WeeklyDietPlan, dayIndex: number, mealIndex: number) {
  const days = plan.days.map((day, currentDayIndex) => currentDayIndex !== dayIndex ? day : {
    ...day,
    meals: day.meals.map((meal, currentMealIndex) => currentMealIndex === mealIndex ? { ...meal, is_locked: !meal.is_locked } : meal),
  });
  return { ...plan, days };
}

export function equivalentReplacementGrams(item: DietMealItem, replacement: FoodCatalogItem) {
  if (replacement.calories <= 0 || item.calories <= 0) return Math.min(800, Math.max(5, Math.round(item.grams / 5) * 5));
  return Math.min(800, Math.max(5, Math.round(((item.calories / replacement.calories) * 100) / 5) * 5));
}

export function compatibleReplacements(item: DietMealItem, catalog: FoodCatalogItem[], preferences: DietPreferences) {
  const current = catalog.find((food) => food.id === item.food_id);
  if (!current) return [];
  const simpleCategory = ["grain", "vegetable", "fruit", "fat"].includes(current.category);
  return catalog
    .filter((food) => food.id !== current.id && isAllowed(food, preferences))
    .filter((food) => simpleCategory ? food.category === current.category : food.meal_tags.includes("protein"))
    .sort((left, right) => {
      const leftSameCategory = left.category === current.category ? 0 : 1;
      const rightSameCategory = right.category === current.category ? 0 : 1;
      if (leftSameCategory !== rightSameCategory) return leftSameCategory - rightSameCategory;
      return Math.abs(left.calories - current.calories) - Math.abs(right.calories - current.calories);
    });
}

export function replaceMealItem(plan: WeeklyDietPlan, dayIndex: number, mealIndex: number, itemIndex: number, replacement: FoodCatalogItem) {
  const days = plan.days.map((day, currentDayIndex) => {
    if (currentDayIndex !== dayIndex) return day;
    const meals = day.meals.map((meal, currentMealIndex) => {
      if (currentMealIndex !== mealIndex) return meal;
      const items = meal.items.map((item, currentItemIndex) => {
        if (currentItemIndex !== itemIndex) return item;
        const grams = equivalentReplacementGrams(item, replacement);
        return {
          food_id: replacement.id,
          food_name: replacement.name_pt,
          grams,
          serving_label: replacement.serving_label,
          item_order: item.item_order,
          ...nutrientFromFood(replacement, grams),
        };
      });
      return { ...meal, items, ...sumNutrients(items) };
    });
    return buildDay(day.plan_date, day.day_order, meals);
  });
  return { ...plan, days };
}
