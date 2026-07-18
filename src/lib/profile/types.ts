import type { Json } from "@/lib/supabase/database.types";

export const BIOLOGICAL_SEXES = ["male", "female"] as const;
export const GOALS = ["lose_weight", "maintain_weight", "gain_muscle"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "high"] as const;
export const GOAL_PACES = ["conservative", "moderate", "accelerated"] as const;
export const WORK_ROUTINES = ["seated", "mixed", "active", "very_active"] as const;
export const STEP_RANGES = ["under_5000", "5000_7999", "8000_11999", "12000_plus"] as const;
export const DAILY_MOVEMENT_LEVELS = ["low", "medium", "high", "very_high"] as const;

export type BiologicalSex = (typeof BIOLOGICAL_SEXES)[number];
export type Goal = (typeof GOALS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalPace = (typeof GOAL_PACES)[number];
export type WorkRoutine = (typeof WORK_ROUTINES)[number];
export type StepRange = (typeof STEP_RANGES)[number];
export type DailyMovementLevel = (typeof DAILY_MOVEMENT_LEVELS)[number];
export type WeightSource = "profile" | "dashboard" | "progress" | "integration";

export interface WeightHistoryEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  recorded_at: string;
  source: WeightSource;
  operation_id: string;
  created_at: string;
}

export interface ActivityAssessment {
  workRoutine: WorkRoutine | "";
  stepsRange: StepRange | "";
  dailyMovement: DailyMovementLevel | "";
}

export interface ApexProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  date_of_birth: string | null;
  biological_sex: BiologicalSex | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  goal: Goal | null;
  target_weight_kg: number | null;
  activity_level_suggested: ActivityLevel | null;
  activity_level_selected: ActivityLevel | null;
  activity_assessment: ActivityAssessment | null;
  training_frequency: number | null;
  goal_pace: GoalPace | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountDraft {
  fullName: string;
  dateOfBirth: string;
  requestedEmail: string;
}

export interface PhysicalDraft {
  biologicalSex: BiologicalSex | "";
  heightCm: string;
  weightKg: string;
  bodyFatPercentage: string;
}

export interface GoalDraft {
  goal: Goal | "";
  targetWeightKg: string;
  activityLevelSuggested: ActivityLevel | "";
  activityLevelSelected: ActivityLevel | "";
  activityAssessment: ActivityAssessment;
  trainingFrequency: string;
  goalPace: GoalPace | "";
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function isActivityAssessment(value: Json | null): value is Json & ActivityAssessment {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  return "workRoutine" in value && "stepsRange" in value && "dailyMovement" in value;
}

export function normalizeProfile(profile: ApexProfile): ApexProfile {
  return {
    ...profile,
    height_cm: profile.height_cm === null ? null : Number(profile.height_cm),
    weight_kg: profile.weight_kg === null ? null : Number(profile.weight_kg),
    body_fat_percentage: profile.body_fat_percentage === null ? null : Number(profile.body_fat_percentage),
    target_weight_kg: profile.target_weight_kg === null ? null : Number(profile.target_weight_kg),
    training_frequency: profile.training_frequency === null ? null : Number(profile.training_frequency),
  };
}
