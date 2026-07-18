import { describe, expect, it } from "vitest";
import { validateGoal, validatePhysical } from "@/lib/profile/validation";
import type { GoalDraft, PhysicalDraft } from "@/lib/profile/types";

const physical: PhysicalDraft = { biologicalSex: "male", heightCm: "180", weightKg: "82,5", bodyFatPercentage: "18,2" };
const goal: GoalDraft = {
  goal: "lose_weight", targetWeightKg: "75,5", activityLevelSuggested: "moderate", activityLevelSelected: "moderate",
  activityAssessment: { workRoutine: "mixed", stepsRange: "8000_11999", dailyMovement: "medium" },
  trainingFrequency: "4", goalPace: "moderate",
};

describe("validação de perfil", () => {
  it("aceita decimais com vírgula sem conversão silenciosa", () => {
    const result = validatePhysical(physical);
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ height: 180, weight: 82.5, bodyFat: 18.2 });
  });

  it("rejeita valores físicos fora dos limites", () => {
    const result = validatePhysical({ ...physical, heightCm: "-1", weightKg: "NaN", bodyFatPercentage: "99" });
    expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(["heightCm", "weightKg", "bodyFatPercentage"]));
  });

  it("valida a direção do peso-meta", () => {
    expect(validateGoal(goal, 82.5).errors).toEqual({});
    expect(validateGoal({ ...goal, targetWeightKg: "90" }, 82.5).errors.targetWeightKg).toContain("menor");
    expect(validateGoal({ ...goal, goal: "gain_muscle", targetWeightKg: "75" }, 82.5).errors.targetWeightKg).toContain("maior");
  });
});
