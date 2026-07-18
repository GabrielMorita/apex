import { describe, expect, it } from "vitest";
import { getProfileCompleteness } from "@/lib/profile/completeness";
import type { ApexProfile } from "@/lib/profile/types";

const profile: ApexProfile = {
  id: "user-1", full_name: "Pessoa Teste", avatar_url: null, avatar_path: null,
  date_of_birth: "1995-01-01", biological_sex: "female", height_cm: 165, weight_kg: 65,
  body_fat_percentage: null, goal: "maintain_weight", target_weight_kg: null,
  activity_level_suggested: "moderate", activity_level_selected: "moderate",
  activity_assessment: { workRoutine: "mixed", stepsRange: "8000_11999", dailyMovement: "medium" },
  training_frequency: 4, goal_pace: "moderate", onboarding_completed: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

describe("getProfileCompleteness", () => {
  it("informa zero quando não existe perfil", () => {
    expect(getProfileCompleteness(null)).toMatchObject({ complete: false, completed: 0, total: 6, percentage: 0 });
  });

  it("aceita manutenção de peso sem peso-meta", () => {
    expect(getProfileCompleteness(profile)).toMatchObject({ complete: true, completed: 6, percentage: 100, missing: [] });
  });

  it("exige peso-meta quando o objetivo é ganhar massa", () => {
    const result = getProfileCompleteness({ ...profile, goal: "gain_muscle", target_weight_kg: null });
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("Objetivo e peso-meta");
  });
});
