import type { ApexProfile } from "@/lib/profile/types";
import type { CalculationInputs, NutritionTargets } from "@/lib/diet/types";
import type { Json } from "@/lib/supabase/database.types";

export const DIET_CALCULATION_VERSION = "provisional-mifflin-amdr-v1";

export function ageFromBirthDate(date: string) {
  const birth = new Date(`${date}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function canCalculateTargets(profile: ApexProfile) {
  const targetReady = profile.goal === "maintain_weight" || Boolean(profile.target_weight_kg);
  return Boolean(profile.date_of_birth && ageFromBirthDate(profile.date_of_birth) >= 18 && profile.biological_sex && profile.height_cm && profile.weight_kg && profile.activity_level_selected && profile.goal && targetReady);
}

export function calculateProvisionalTargets(profile: ApexProfile): Omit<NutritionTargets, "user_id" | "created_at" | "updated_at"> {
  if (!canCalculateTargets(profile)) throw new Error("Perfil incompleto para calcular a estimativa.");
  const age = ageFromBirthDate(profile.date_of_birth!);
  const sexOffset = profile.biological_sex === "male" ? 5 : -161;
  const bmr = 10 * profile.weight_kg! + 6.25 * profile.height_cm! - 5 * age + sexOffset;
  const activityFactor = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725 }[profile.activity_level_selected!];
  const maintenanceCalories = bmr * activityFactor;
  const pace = profile.goal_pace ?? "moderate";
  const adjustments = {
    lose_weight: { conservative: -0.1, moderate: -0.15, accelerated: -0.2 },
    maintain_weight: { conservative: 0, moderate: 0, accelerated: 0 },
    gain_muscle: { conservative: 0.05, moderate: 0.1, accelerated: 0.15 },
  } as const;
  const adjustmentPercent = adjustments[profile.goal!][pace];
  const calories = Math.round(Math.min(6000, Math.max(800, bmr, maintenanceCalories * (1 + adjustmentPercent))) / 10) * 10;
  const split = profile.goal === "lose_weight" ? { protein: 0.3, carbs: 0.45, fat: 0.25 }
    : profile.goal === "gain_muscle" ? { protein: 0.25, carbs: 0.5, fat: 0.25 }
      : { protein: 0.25, carbs: 0.45, fat: 0.3 };
  const inputs: CalculationInputs = {
    formula: "mifflin_st_jeor",
    profileUpdatedAt: profile.updated_at,
    age,
    biologicalSex: profile.biological_sex!,
    heightCm: profile.height_cm!,
    weightKg: profile.weight_kg!,
    activityLevel: profile.activity_level_selected!,
    goal: profile.goal!,
    goalPace: pace,
    bmr: Math.round(bmr),
    activityFactor,
    maintenanceCalories: Math.round(maintenanceCalories),
    adjustmentPercent,
  };

  return {
    calories,
    protein_g: Math.round((calories * split.protein) / 4),
    carbs_g: Math.round((calories * split.carbs) / 4),
    fat_g: Math.round((calories * split.fat) / 9),
    source: "calculated",
    calculation_version: DIET_CALCULATION_VERSION,
    calculation_inputs: inputs as unknown as Json,
    is_provisional: true,
  };
}
