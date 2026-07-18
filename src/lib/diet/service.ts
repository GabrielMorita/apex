import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { loadProfile } from "@/lib/profile/service";
import type { DietOnboardingDraft, DietPreferences, DietState, NutritionTargets } from "@/lib/diet/types";
import { calculateProvisionalTargets, DIET_CALCULATION_VERSION } from "@/lib/diet/calculation";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { CustomFoodInput, DietConsumptionEntry, DietConsumptionItem, DietMeal, DietMealItem, DietMealTemplate, DietMealTemplateItem, DietPlanDay, DietPlanSummary, DietRecipe, DietRecipeInput, DietRecipeItem, FoodCatalogItem, FoodCategory, NutrientTotals, WeeklyDietPlan } from "@/lib/diet/types";
import { sumNutrients } from "@/lib/diet/generator";

export async function loadDietState(user: User): Promise<DietState> {
  const supabase = createClient();
  const [profile, preferencesResult, targetsResult] = await Promise.all([
    loadProfile(user),
    supabase.from("diet_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("nutrition_targets").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  if (preferencesResult.error) throw preferencesResult.error;
  if (targetsResult.error) throw targetsResult.error;
  return { profile, preferences: preferencesResult.data as DietPreferences | null, targets: targetsResult.data as NutritionTargets | null };
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

function parseNumber(value: string) {
  return Number(value.trim().replace(",", "."));
}

export async function saveDietOnboarding(userId: string, draft: DietOnboardingDraft, calculated: ReturnType<typeof calculateProvisionalTargets>) {
  const supabase = createClient();
  const calories = parseNumber(draft.calories);
  const proteinG = parseNumber(draft.proteinG);
  const carbsG = parseNumber(draft.carbsG);
  const fatG = parseNumber(draft.fatG);
  const manual = calories !== calculated.calories || proteinG !== calculated.protein_g || carbsG !== calculated.carbs_g || fatG !== calculated.fat_g;
  const { error } = await supabase.rpc("save_diet_foundation", {
    p_health_eligibility_confirmed: draft.healthEligibilityConfirmed,
    p_meal_count: draft.mealCount,
    p_meal_times: draft.mealTimes,
    p_training_time: draft.trainingTime,
    p_dietary_pattern: draft.dietaryPattern,
    p_allergies: splitList(draft.allergies),
    p_restrictions: splitList(draft.restrictions),
    p_disliked_foods: splitList(draft.dislikedFoods),
    p_favorite_foods: splitList(draft.favoriteFoods),
    p_cooking_time_minutes: draft.cookingTimeMinutes,
    p_budget_level: draft.budgetLevel,
    p_variety_level: draft.varietyLevel,
    p_meal_style: draft.mealStyle,
    p_calories: calories,
    p_protein_g: proteinG,
    p_carbs_g: carbsG,
    p_fat_g: fatG,
    p_source: manual ? "manual" : "calculated",
    p_calculation_version: DIET_CALCULATION_VERSION,
    p_calculation_inputs: calculated.calculation_inputs,
    p_is_provisional: true,
  });
  if (error) throw error;
  const [preferencesResult, targetsResult] = await Promise.all([
    supabase.from("diet_preferences").select("*").eq("user_id", userId).single(),
    supabase.from("nutrition_targets").select("*").eq("user_id", userId).single(),
  ]);
  if (preferencesResult.error) throw preferencesResult.error;
  if (targetsResult.error) throw targetsResult.error;
  return { preferences: preferencesResult.data as DietPreferences, targets: targetsResult.data as NutritionTargets };
}

export async function recalculateNutritionTargets(state: DietState) {
  const calculated = calculateProvisionalTargets(state.profile);
  const { data, error } = await createClient().from("nutrition_targets").upsert({ ...calculated, user_id: state.profile.id }, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return data as NutritionTargets;
}

const CATALOG_SELECT = "id,user_id,recipe_id,source_type,name_pt,category,dietary_patterns,allergen_tags,meal_tags,calories,protein_g,carbs_g,fat_g,fiber_g,serving_grams,serving_label,cost_level,source_name,source_code,source_url" as const;

function normalizeCatalogFood(food: Database["public"]["Tables"]["food_catalog"]["Row"]): FoodCatalogItem {
  return {
    ...food,
    calories: Number(food.calories),
    protein_g: Number(food.protein_g),
    carbs_g: Number(food.carbs_g),
    fat_g: Number(food.fat_g),
    fiber_g: Number(food.fiber_g),
    serving_grams: Number(food.serving_grams),
  };
}

export async function loadFoodCatalog() {
  const { data, error } = await createClient()
    .from("food_catalog")
    .select(CATALOG_SELECT)
    .eq("is_active", true)
    .order("id");
  if (error) throw error;
  return (data ?? []).map((food) => normalizeCatalogFood(food as Database["public"]["Tables"]["food_catalog"]["Row"]));
}

export async function loadCustomFoods(userId: string) {
  const { data, error } = await createClient()
    .from("food_catalog")
    .select(CATALOG_SELECT)
    .eq("user_id", userId)
    .eq("source_type", "custom")
    .is("recipe_id", null)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((food) => normalizeCatalogFood(food as Database["public"]["Tables"]["food_catalog"]["Row"]));
}

function mealTagsForCategory(category: FoodCategory) {
  if (category === "grain") return ["main", "breakfast", "snack", "carb"];
  if (category === "vegetable") return ["main", "vegetable"];
  if (category === "fruit") return ["breakfast", "snack", "fruit", "carb"];
  if (category === "fat") return ["main", "snack", "fat"];
  return ["main", "breakfast", "snack", "protein"];
}

export async function saveCustomFood(userId: string, input: CustomFoodInput, existingId?: string) {
  const id = existingId ?? `custom-${crypto.randomUUID()}`;
  const payload = {
    id,
    user_id: userId,
    source_type: "custom" as const,
    name_pt: input.name_pt.trim(),
    category: input.category,
    dietary_patterns: input.dietary_patterns,
    allergen_tags: input.allergen_tags,
    meal_tags: mealTagsForCategory(input.category),
    calories: input.calories,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
    fiber_g: input.fiber_g,
    serving_grams: input.serving_grams,
    serving_label: input.serving_label.trim(),
    cost_level: 2,
    source_name: "Cadastro pessoal",
    source_code: id,
    source_url: "",
    is_active: true,
  };
  const query = existingId
    ? createClient().from("food_catalog").update(payload).eq("id", existingId).eq("user_id", userId)
    : createClient().from("food_catalog").insert(payload);
  const { data, error } = await query.select(CATALOG_SELECT).single();
  if (error) throw error;
  return normalizeCatalogFood(data as Database["public"]["Tables"]["food_catalog"]["Row"]);
}

export async function archiveCustomFood(userId: string, foodId: string) {
  const { error } = await createClient()
    .from("food_catalog")
    .update({ is_active: false })
    .eq("id", foodId)
    .eq("user_id", userId)
    .eq("source_type", "custom");
  if (error) throw error;
}

export async function loadDietRecipes(userId: string, includeInactive = false): Promise<DietRecipe[]> {
  let recipeQuery = createClient()
    .from("diet_recipes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (!includeInactive) recipeQuery = recipeQuery.eq("is_active", true);
  const recipeResult = await recipeQuery;
  if (recipeResult.error) throw recipeResult.error;
  const recipeIds = (recipeResult.data ?? []).map((recipe) => recipe.id);
  const itemResult = recipeIds.length > 0
    ? await createClient().from("diet_recipe_items").select("*").eq("user_id", userId).in("recipe_id", recipeIds).order("item_order")
    : { data: [], error: null };
  if (itemResult.error) throw itemResult.error;

  const itemsByRecipe = new Map<string, DietRecipeItem[]>();
  for (const item of itemResult.data ?? []) {
    const normalized: DietRecipeItem = {
      ...item,
      grams: Number(item.grams),
      calories: Number(item.calories),
      protein_g: Number(item.protein_g),
      carbs_g: Number(item.carbs_g),
      fat_g: Number(item.fat_g),
      fiber_g: Number(item.fiber_g),
    };
    itemsByRecipe.set(item.recipe_id, [...(itemsByRecipe.get(item.recipe_id) ?? []), normalized]);
  }

  return (recipeResult.data ?? []).map((recipe) => ({
    ...recipe,
    yield_grams: Number(recipe.yield_grams),
    total_calories: Number(recipe.total_calories),
    total_protein_g: Number(recipe.total_protein_g),
    total_carbs_g: Number(recipe.total_carbs_g),
    total_fat_g: Number(recipe.total_fat_g),
    total_fiber_g: Number(recipe.total_fiber_g),
    catalog_food_id: `custom-recipe-${recipe.id}`,
    items: itemsByRecipe.get(recipe.id) ?? [],
  }));
}

export async function saveDietRecipe(input: DietRecipeInput, existingId?: string) {
  const { data, error } = await createClient().rpc("save_diet_recipe", {
    p_recipe_id: existingId ?? null,
    p_name_pt: input.name_pt,
    p_category: input.category,
    p_servings: input.servings,
    p_yield_grams: input.yield_grams,
    p_preparation_minutes: input.preparation_minutes,
    p_instructions: input.instructions,
    p_items: input.items as unknown as Json,
  });
  if (error) throw error;
  return data;
}

export async function archiveDietRecipe(recipeId: string) {
  const { error } = await createClient().rpc("archive_diet_recipe", { p_recipe_id: recipeId });
  if (error) throw error;
}

export async function loadMealTemplates(userId: string): Promise<DietMealTemplate[]> {
  const templateResult = await createClient()
    .from("diet_meal_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (templateResult.error) throw templateResult.error;
  const templateIds = (templateResult.data ?? []).map((template) => template.id);
  const itemResult = templateIds.length > 0
    ? await createClient().from("diet_meal_template_items").select("*").eq("user_id", userId).in("template_id", templateIds).order("item_order")
    : { data: [], error: null };
  if (itemResult.error) throw itemResult.error;

  const itemsByTemplate = new Map<string, DietMealTemplateItem[]>();
  for (const item of itemResult.data ?? []) {
    const normalized: DietMealTemplateItem = {
      ...item,
      grams: Number(item.grams),
      calories: Number(item.calories),
      protein_g: Number(item.protein_g),
      carbs_g: Number(item.carbs_g),
      fat_g: Number(item.fat_g),
    };
    itemsByTemplate.set(item.template_id, [...(itemsByTemplate.get(item.template_id) ?? []), normalized]);
  }

  return (templateResult.data ?? []).map((template) => ({
    ...template,
    calories: Number(template.calories),
    protein_g: Number(template.protein_g),
    carbs_g: Number(template.carbs_g),
    fat_g: Number(template.fat_g),
    items: itemsByTemplate.get(template.id) ?? [],
  }));
}

export async function saveMealTemplate(namePt: string, items: DietMealItem[]) {
  const { data, error } = await createClient().rpc("save_diet_meal_template", {
    p_name_pt: namePt.trim(),
    p_items: items.map((item) => ({ food_id: item.food_id, grams: item.grams })) as unknown as Json,
  });
  if (error) throw error;
  return data;
}

export async function archiveMealTemplate(templateId: string) {
  const { error } = await createClient().rpc("archive_diet_meal_template", { p_template_id: templateId });
  if (error) throw error;
}

export async function loadFavoriteFoodIds(userId: string) {
  const { data, error } = await createClient()
    .from("diet_food_favorites")
    .select("food_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((favorite) => favorite.food_id);
}

export async function setFoodFavorite(userId: string, foodId: string, favorite: boolean) {
  const supabase = createClient();
  const { error } = favorite
    ? await supabase.from("diet_food_favorites").insert({ user_id: userId, food_id: foodId })
    : await supabase.from("diet_food_favorites").delete().eq("user_id", userId).eq("food_id", foodId);
  if (error && error.code !== "23505") throw error;
}

export async function loadRecentFoodIds(userId: string, days = 30) {
  const dateFrom = new Date(Date.now() - Math.max(0, days - 1) * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await createClient()
    .from("diet_consumption_entries")
    .select("items_snapshot,consumed_at")
    .eq("user_id", userId)
    .gte("consumed_date", dateFrom)
    .order("consumed_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const seen = new Set<string>();
  const recent: string[] = [];
  for (const entry of data ?? []) {
    for (const item of entry.items_snapshot as unknown as DietMealItem[]) {
      if (!seen.has(item.food_id)) {
        seen.add(item.food_id);
        recent.push(item.food_id);
      }
    }
  }
  return recent.slice(0, 30);
}

export async function loadShoppingCheckedIds(userId: string, weekStart: string) {
  const { data, error } = await createClient()
    .from("diet_shopping_checks")
    .select("food_id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .order("checked_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => item.food_id);
}

export async function setShoppingItemChecked(userId: string, weekStart: string, foodId: string, checked: boolean) {
  const supabase = createClient();
  const { error } = checked
    ? await supabase.from("diet_shopping_checks").insert({ user_id: userId, week_start: weekStart, food_id: foodId, checked_at: new Date().toISOString() })
    : await supabase
        .from("diet_shopping_checks")
        .delete()
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .eq("food_id", foodId);
  if (error && error.code !== "23505") throw error;
}

export async function clearShoppingChecks(userId: string, weekStart: string) {
  const { error } = await createClient()
    .from("diet_shopping_checks")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);
  if (error) throw error;
}

function numericTotals(row: { calories: number; protein_g: number; carbs_g: number; fat_g: number }): NutrientTotals {
  return {
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fat_g: Number(row.fat_g),
  };
}

export async function loadWeeklyDietPlan(userId: string, weekStart: string): Promise<WeeklyDietPlan | null> {
  const supabase = createClient();
  const planResult = await supabase.from("diet_plans").select("*").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
  if (planResult.error) throw planResult.error;
  if (!planResult.data) return null;

  const daysResult = await supabase.from("diet_plan_days").select("*").eq("user_id", userId).eq("plan_id", planResult.data.id).order("day_order");
  if (daysResult.error) throw daysResult.error;
  const dayIds = (daysResult.data ?? []).map((day) => day.id);
  if (dayIds.length === 0) return null;

  const mealsResult = await supabase.from("diet_meals").select("*").eq("user_id", userId).in("day_id", dayIds).order("meal_order");
  if (mealsResult.error) throw mealsResult.error;
  const mealIds = (mealsResult.data ?? []).map((meal) => meal.id);
  const itemsResult = mealIds.length > 0
    ? await supabase.from("diet_meal_items").select("*").eq("user_id", userId).in("meal_id", mealIds).order("item_order")
    : { data: [], error: null };
  if (itemsResult.error) throw itemsResult.error;

  const itemsByMeal = new Map<string, DietMealItem[]>();
  for (const item of itemsResult.data ?? []) {
    const converted: DietMealItem = {
      food_id: item.food_id,
      food_name: item.food_name,
      grams: Number(item.grams),
      serving_label: item.serving_label,
      item_order: item.item_order,
      ...numericTotals(item),
    };
    itemsByMeal.set(item.meal_id, [...(itemsByMeal.get(item.meal_id) ?? []), converted]);
  }

  const mealsByDay = new Map<string, DietMeal[]>();
  for (const meal of mealsResult.data ?? []) {
    const converted: DietMeal = {
      name: meal.name,
      meal_order: meal.meal_order,
      scheduled_time: meal.scheduled_time?.slice(0, 5) ?? "",
      is_locked: meal.is_locked,
      regeneration_count: meal.regeneration_count,
      items: itemsByMeal.get(meal.id) ?? [],
      ...numericTotals(meal),
    };
    mealsByDay.set(meal.day_id, [...(mealsByDay.get(meal.day_id) ?? []), converted]);
  }

  const days: DietPlanDay[] = (daysResult.data ?? []).map((day) => ({
    plan_date: day.plan_date,
    day_order: day.day_order,
    meals: mealsByDay.get(day.id) ?? [],
    ...numericTotals(day),
  }));

  return {
    id: planResult.data.id,
    week_start: planResult.data.week_start,
    generation_version: planResult.data.generation_version,
    targets_snapshot: planResult.data.targets_snapshot as unknown as NutrientTotals,
    preferences_snapshot: planResult.data.preferences_snapshot as unknown as WeeklyDietPlan["preferences_snapshot"],
    days,
    created_at: planResult.data.created_at,
    updated_at: planResult.data.updated_at,
  };
}

export async function loadDietPlanSummaries(userId: string, limit = 24): Promise<DietPlanSummary[]> {
  const { data, error } = await createClient()
    .from("diet_plans")
    .select("id,week_start,status,created_at,updated_at")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(Math.min(52, Math.max(1, limit)));
  if (error) throw error;
  return (data ?? []) as DietPlanSummary[];
}

export async function saveWeeklyDietPlan(plan: WeeklyDietPlan) {
  const { data, error } = await createClient().rpc("save_weekly_diet_plan", {
    p_week_start: plan.week_start,
    p_generation_version: plan.generation_version,
    p_targets_snapshot: plan.targets_snapshot as unknown as Json,
    p_preferences_snapshot: plan.preferences_snapshot as unknown as Json,
    p_days: plan.days as unknown as Json,
  });
  if (error) throw error;
  return { ...plan, id: data };
}

export async function saveWeeklyDietPlanAndSyncConsumption(userId: string, plan: WeeklyDietPlan, entry: DietConsumptionEntry, meal: DietMeal, items: DietConsumptionItem[]) {
  const totals = sumNutrients(items);
  const { data, error } = await createClient().rpc("save_weekly_diet_plan_and_sync_consumption", {
    p_week_start: plan.week_start,
    p_generation_version: plan.generation_version,
    p_targets_snapshot: plan.targets_snapshot as unknown as Json,
    p_preferences_snapshot: plan.preferences_snapshot as unknown as Json,
    p_days: plan.days as unknown as Json,
    p_consumed_date: entry.consumed_date,
    p_meal_order: entry.meal_order,
    p_meal_name: meal.name,
    p_items_snapshot: items as unknown as Json,
    p_calories: totals.calories,
    p_protein_g: totals.protein_g,
    p_carbs_g: totals.carbs_g,
    p_fat_g: totals.fat_g,
  });
  if (error) throw error;
  return {
    plan: { ...plan, id: data },
    consumption: await loadDietConsumption(userId, plan.week_start),
  };
}

type ConsumptionRow = Database["public"]["Tables"]["diet_consumption_entries"]["Row"];

function normalizeConsumptionEntry(entry: ConsumptionRow): DietConsumptionEntry {
  return {
    ...entry,
    items_snapshot: (entry.items_snapshot as unknown as DietMealItem[]).map((item) => ({
      ...item,
      origin: "origin" in item && item.origin === "extra" ? "extra" as const : "planned" as const,
      grams: Number(item.grams),
      calories: Number(item.calories),
      protein_g: Number(item.protein_g),
      carbs_g: Number(item.carbs_g),
      fat_g: Number(item.fat_g),
    })),
    ...numericTotals(entry),
  };
}

export async function loadDietConsumption(userId: string, weekStart: string): Promise<DietConsumptionEntry[]> {
  const { data, error } = await createClient()
    .from("diet_consumption_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_week_start", weekStart)
    .order("consumed_date")
    .order("meal_order");
  if (error) throw error;
  return (data ?? []).map(normalizeConsumptionEntry);
}

export async function loadDietConsumptionRange(userId: string, dateFrom: string, dateTo: string): Promise<DietConsumptionEntry[]> {
  const { data, error } = await createClient()
    .from("diet_consumption_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("consumed_date", dateFrom)
    .lte("consumed_date", dateTo)
    .order("consumed_date")
    .order("meal_order");
  if (error) throw error;
  return (data ?? []).map(normalizeConsumptionEntry);
}

export async function setMealConsumption(userId: string, weekStart: string, consumedDate: string, meal: DietMeal, consumed: boolean) {
  const { error } = await createClient().rpc("set_diet_meal_consumption", {
    p_plan_week_start: weekStart,
    p_consumed_date: consumedDate,
    p_meal_order: meal.meal_order,
    p_meal_name: meal.name,
    p_items_snapshot: meal.items.map((item) => ({ ...item, origin: "planned" })) as unknown as Json,
    p_calories: meal.calories,
    p_protein_g: meal.protein_g,
    p_carbs_g: meal.carbs_g,
    p_fat_g: meal.fat_g,
    p_consumed: consumed,
  });
  if (error) throw error;
  return loadDietConsumption(userId, weekStart);
}

export async function saveConsumptionItems(userId: string, entry: DietConsumptionEntry, items: DietConsumptionItem[]) {
  const totals = sumNutrients(items);
  const { error } = await createClient().rpc("set_diet_meal_consumption", {
    p_plan_week_start: entry.plan_week_start,
    p_consumed_date: entry.consumed_date,
    p_meal_order: entry.meal_order,
    p_meal_name: entry.meal_name,
    p_items_snapshot: items as unknown as Json,
    p_calories: totals.calories,
    p_protein_g: totals.protein_g,
    p_carbs_g: totals.carbs_g,
    p_fat_g: totals.fat_g,
    p_consumed: true,
  });
  if (error) throw error;
  return loadDietConsumption(userId, entry.plan_week_start);
}
