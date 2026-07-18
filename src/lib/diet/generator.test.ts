import { describe, expect, it } from "vitest";
import { isAllowed, nutrientFromFood, sumNutrients } from "@/lib/diet/generator";
import type { DietPreferences, FoodCatalogItem } from "@/lib/diet/types";

const food: FoodCatalogItem = {
  id: "food-1", user_id: null, recipe_id: null, source_type: "reference", name_pt: "Leite integral",
  category: "dairy", dietary_patterns: ["omnivore", "vegetarian"], allergen_tags: ["leite"], meal_tags: ["breakfast"],
  calories: 120, protein_g: 8, carbs_g: 10, fat_g: 5, fiber_g: 0, serving_grams: 200,
  serving_label: "1 copo", cost_level: 1, source_name: "teste", source_code: "test-1", source_url: "",
};
const preferences: DietPreferences = {
  user_id: "user-1", onboarding_completed: true, health_eligibility_confirmed: true, meal_count: 4,
  meal_times: ["08:00", "12:00", "16:00", "20:00"], training_time: "afternoon", dietary_pattern: "omnivore",
  allergies: [], restrictions: [], disliked_foods: [], favorite_foods: [], cooking_time_minutes: 30,
  budget_level: "moderate", variety_level: "balanced", meal_style: "mixed",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

describe("gerador de dieta", () => {
  it("escala e soma nutrientes", () => {
    const half = nutrientFromFood(food, 50);
    expect(half).toEqual({ calories: 60, protein_g: 4, carbs_g: 5, fat_g: 2.5 });
    expect(sumNutrients([half, half])).toEqual({ calories: 120, protein_g: 8, carbs_g: 10, fat_g: 5 });
  });

  it("respeita padrão alimentar e alergias", () => {
    expect(isAllowed(food, preferences)).toBe(true);
    expect(isAllowed(food, { ...preferences, allergies: ["leite"] })).toBe(false);
    expect(isAllowed(food, { ...preferences, dietary_pattern: "vegan" })).toBe(false);
  });
});
