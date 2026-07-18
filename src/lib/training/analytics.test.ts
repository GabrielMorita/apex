import { describe, expect, it } from "vitest";
import { completedSetCount, trainingRecords, weeklyTrainingSummaries } from "@/lib/training/analytics";
import type { TrainingSession } from "@/lib/training/types";

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: "session-1", user_id: "user-1", scheduled_workout_id: null, template_id: null,
    template_name_snapshot: "Treino A", workout_type_snapshot: "strength", status: "completed",
    started_at: "2026-07-13T12:00:00Z", completed_at: "2026-07-13T13:00:00Z", duration_minutes: 60,
    total_volume_kg: 1200, notes: "", created_at: "2026-07-13T12:00:00Z", updated_at: "2026-07-13T13:00:00Z",
    sets: [
      { id: "set-1", user_id: "user-1", session_id: "session-1", template_exercise_id: null, exercise_id: "exercise-1", exercise_name_snapshot: "Supino", exercise_order: 0, set_order: 0, target_reps: 10, target_load_kg: 50, actual_reps: 10, actual_load_kg: 50, rest_seconds: 90, is_completed: true, notes: "", created_at: "2026-07-13T12:00:00Z", updated_at: "2026-07-13T13:00:00Z" },
      { id: "set-2", user_id: "user-1", session_id: "session-1", template_exercise_id: null, exercise_id: "exercise-1", exercise_name_snapshot: "Supino", exercise_order: 0, set_order: 1, target_reps: 10, target_load_kg: 55, actual_reps: 8, actual_load_kg: 55, rest_seconds: 90, is_completed: false, notes: "", created_at: "2026-07-13T12:00:00Z", updated_at: "2026-07-13T13:00:00Z" },
    ],
    ...overrides,
  };
}

describe("analytics de treino", () => {
  it("resume a semana e conta apenas séries concluídas", () => {
    const rows = [session()];
    expect(weeklyTrainingSummaries(rows, "2026-07-13", 1)[0]).toMatchObject({ sessions: 1, duration_minutes: 60, volume_kg: 1200 });
    expect(completedSetCount(rows)).toBe(1);
  });

  it("ignora séries incompletas nos recordes", () => {
    expect(trainingRecords([session()])[0]).toMatchObject({ exercise_name: "Supino", max_load_kg: 50, best_set_volume_kg: 500 });
  });
});
