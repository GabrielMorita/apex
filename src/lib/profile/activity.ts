import type { ActivityAssessment, ActivityLevel } from "@/lib/profile/types";

export function suggestActivityLevel(assessment: ActivityAssessment, trainingFrequency: number | null): ActivityLevel | null {
  if (!assessment.workRoutine || !assessment.stepsRange || !assessment.dailyMovement) return null;

  const routineScore = { seated: 0, mixed: 1, active: 2, very_active: 3 }[assessment.workRoutine];
  const stepsScore = { under_5000: 0, "5000_7999": 1, "8000_11999": 2, "12000_plus": 3 }[assessment.stepsRange];
  const movementScore = { low: 0, medium: 1, high: 2, very_high: 3 }[assessment.dailyMovement];
  const trainingScore = trainingFrequency === null ? 0 : trainingFrequency >= 5 ? 3 : trainingFrequency >= 3 ? 2 : trainingFrequency >= 1 ? 1 : 0;
  const score = routineScore + stepsScore + movementScore + trainingScore;

  if (score <= 3) return "sedentary";
  if (score <= 6) return "light";
  if (score <= 9) return "moderate";
  return "high";
}
