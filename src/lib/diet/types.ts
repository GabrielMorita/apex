import type { Json } from "@/lib/supabase/database.types";
import type { ApexProfile, GoalPace } from "@/lib/profile/types";

export type DietaryPattern = "omnivore" | "vegetarian" | "vegan" | "pescatarian";
export type BudgetLevel = "economical" | "moderate" | "flexible";
export type VarietyLevel = "varied" | "balanced" | "practical";
export type MealStyle = "simple" | "mixed" | "recipes";
export type TrainingTime = "morning" | "afternoon" | "evening" | "varies" | "none";
export type FoodCategory = "grain" | "vegetable" | "fruit" | "fat" | "fish" | "meat" | "dairy" | "egg" | "legume";

export interface DietPreferences {
  user_id: string;
  onboarding_completed: boolean;
  health_eligibility_confirmed: boolean;
  meal_count: number;
  meal_times: string[];
  training_time: TrainingTime;
  dietary_pattern: DietaryPattern;
  allergies: string[];
  restrictions: string[];
  disliked_foods: string[];
  favorite_foods: string[];
  cooking_time_minutes: number;
  budget_level: BudgetLevel;
  variety_level: VarietyLevel;
  meal_style: MealStyle;
  created_at: string;
  updated_at: string;
}

export interface NutritionTargets {
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: "calculated" | "manual";
  calculation_version: string;
  calculation_inputs: Json;
  is_provisional: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietOnboardingDraft {
  healthEligibilityConfirmed: boolean;
  mealCount: number;
  mealTimes: string[];
  trainingTime: TrainingTime;
  dietaryPattern: DietaryPattern;
  allergies: string;
  restrictions: string;
  dislikedFoods: string;
  favoriteFoods: string;
  cookingTimeMinutes: number;
  budgetLevel: BudgetLevel;
  varietyLevel: VarietyLevel;
  mealStyle: MealStyle;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

export interface DietState {
  profile: ApexProfile;
  preferences: DietPreferences | null;
  targets: NutritionTargets | null;
}

export interface NutrientTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodCatalogItem extends NutrientTotals {
  id: string;
  user_id: string | null;
  recipe_id: string | null;
  source_type: "reference" | "custom";
  name_pt: string;
  category: FoodCategory;
  dietary_patterns: DietaryPattern[];
  allergen_tags: string[];
  meal_tags: string[];
  fiber_g: number;
  serving_grams: number;
  serving_label: string;
  cost_level: number;
  source_name: string;
  source_code: string;
  source_url: string;
}

export interface CustomFoodInput extends NutrientTotals {
  name_pt: string;
  category: FoodCategory;
  dietary_patterns: DietaryPattern[];
  allergen_tags: string[];
  fiber_g: number;
  serving_grams: number;
  serving_label: string;
}

export interface DietRecipeItem extends NutrientTotals {
  id: string;
  recipe_id: string;
  user_id: string;
  food_id: string;
  food_name_snapshot: string;
  grams: number;
  fiber_g: number;
  item_order: number;
  created_at: string;
}

export interface DietRecipe {
  id: string;
  user_id: string;
  name_pt: string;
  category: FoodCategory;
  servings: number;
  yield_grams: number;
  preparation_minutes: number;
  instructions: string;
  dietary_patterns: DietaryPattern[];
  allergen_tags: string[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  catalog_food_id: string;
  items: DietRecipeItem[];
}

export interface DietRecipeInput {
  name_pt: string;
  category: FoodCategory;
  servings: number;
  yield_grams: number;
  preparation_minutes: number;
  instructions: string;
  items: Array<{ food_id: string; grams: number }>;
}

export interface DietMealTemplateItem extends NutrientTotals {
  id: string;
  template_id: string;
  user_id: string;
  food_id: string;
  food_name_snapshot: string;
  serving_label_snapshot: string;
  grams: number;
  item_order: number;
  created_at: string;
}

export interface DietMealTemplate extends NutrientTotals {
  id: string;
  user_id: string;
  name_pt: string;
  item_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: DietMealTemplateItem[];
}

export interface DietMealItem extends NutrientTotals {
  food_id: string;
  food_name: string;
  grams: number;
  serving_label: string;
  item_order: number;
}

export interface DietMeal extends NutrientTotals {
  name: string;
  meal_order: number;
  scheduled_time: string;
  is_locked: boolean;
  regeneration_count: number;
  items: DietMealItem[];
}

export interface DietPlanDay extends NutrientTotals {
  plan_date: string;
  day_order: number;
  meals: DietMeal[];
}

export interface WeeklyDietPlan {
  id?: string;
  week_start: string;
  generation_version: string;
  targets_snapshot: NutrientTotals;
  preferences_snapshot: {
    meal_count: number;
    dietary_pattern: DietaryPattern;
    budget_level: BudgetLevel;
    variety_level: VarietyLevel;
  };
  days: DietPlanDay[];
  created_at?: string;
  updated_at?: string;
}

export interface DietPlanSummary {
  id: string;
  week_start: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface DietConsumptionItem extends DietMealItem {
  origin: "planned" | "extra";
}

export interface DietConsumptionEntry extends NutrientTotals {
  id: string;
  user_id: string;
  plan_week_start: string;
  consumed_date: string;
  meal_order: number;
  meal_name: string;
  items_snapshot: DietConsumptionItem[];
  consumed_at: string;
  created_at: string;
  updated_at: string;
}

export type CalculationInputs = {
  formula: "mifflin_st_jeor";
  profileUpdatedAt: string;
  age: number;
  biologicalSex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "high";
  goal: "lose_weight" | "maintain_weight" | "gain_muscle";
  goalPace: GoalPace;
  bmr: number;
  activityFactor: number;
  maintenanceCalories: number;
  adjustmentPercent: number;
};
