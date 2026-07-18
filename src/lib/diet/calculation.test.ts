import { describe, expect, it } from "vitest";
import { calculateProvisionalTargets, canCalculateTargets, DIET_CALCULATION_VERSION } from "@/lib/diet/calculation";
import type { ApexProfile } from "@/lib/profile/types";

const profile: ApexProfile = {
  id: "user-1", full_name: "Pessoa Teste", avatar_url: null, avatar_path: null,
  date_of_birth: "1995-01-01", biological_sex: "male", height_cm: 180, weight_kg: 82,
  body_fat_percentage: 18, goal: "gain_muscle", target_weight_kg: 88,
  activity_level_suggested: "moderate", activity_level_selected: "moderate",
  activity_assessment: { workRoutine: "mixed", stepsRange: "8000_11999", dailyMovement: "medium" },
  training_frequency: 4, goal_pace: "moderate", onboarding_completed: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

describe("estimativa nutricional", () => {
  it("gera metas provisórias positivas e coerentes", () => {
    const targets = calculateProvisionalTargets(profile);
    const macroCalories = targets.protein_g * 4 + targets.carbs_g * 4 + targets.fat_g * 9;
    expect(targets.is_provisional).toBe(true);
    expect(targets.calculation_version).toBe(DIET_CALCULATION_VERSION);
    expect(targets.calories).toBeGreaterThan(800);
    expect(Math.abs(macroCalories - targets.calories)).toBeLessThan(20);
  });

  it("bloqueia cálculo com perfil incompleto", () => {
    const incomplete = { ...profile, height_cm: null };
    expect(canCalculateTargets(incomplete)).toBe(false);
    expect(() => calculateProvisionalTargets(incomplete)).toThrow("Perfil incompleto");
  });
});
