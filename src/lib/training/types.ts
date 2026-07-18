import type { Json } from "@/lib/supabase/database.types";

export type WorkoutType = "strength" | "running" | "mobility" | "recovery";
export type ExerciseCategory = "strength" | "cardio" | "mobility";
export type ScheduleStatus = "scheduled" | "in_progress" | "completed" | "skipped";
export type SessionStatus = "in_progress" | "completed" | "cancelled";
export type CycleStatus = "planned" | "active" | "completed" | "archived";

export interface TrainingExercise {
  id: string;
  user_id: string | null;
  source_type: "reference" | "custom";
  name_pt: string;
  category: ExerciseCategory;
  primary_muscle_group: string;
  equipment: string;
  instructions: string;
  video_url: string | null;
  source_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateExerciseInput {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  target_load_kg: number | null;
  rest_seconds: number;
  notes: string;
}

export interface TrainingTemplateExercise extends TemplateExerciseInput {
  id: string;
  template_id: string;
  user_id: string;
  exercise_order: number;
  created_at: string;
  updated_at: string;
  exercise: TrainingExercise | null;
}

export interface TrainingTemplate {
  id: string;
  user_id: string;
  name: string;
  workout_type: WorkoutType;
  description: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  exercises: TrainingTemplateExercise[];
}

export interface TrainingCycle {
  id: string;
  user_id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledWorkout {
  id: string;
  user_id: string;
  template_id: string;
  cycle_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: ScheduleStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  template: TrainingTemplate | null;
  cycle: TrainingCycle | null;
}

export interface TrainingSessionSet {
  id: string;
  user_id: string;
  session_id: string;
  template_exercise_id: string | null;
  exercise_id: string | null;
  exercise_name_snapshot: string;
  exercise_order: number;
  set_order: number;
  target_reps: number;
  target_load_kg: number | null;
  actual_reps: number | null;
  actual_load_kg: number | null;
  rest_seconds: number;
  is_completed: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  scheduled_workout_id: string | null;
  template_id: string | null;
  template_name_snapshot: string;
  workout_type_snapshot: WorkoutType;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
  total_volume_kg: number;
  notes: string;
  created_at: string;
  updated_at: string;
  sets: TrainingSessionSet[];
}

export interface TemplateDraft {
  id: string | null;
  name: string;
  workout_type: WorkoutType;
  description: string;
  exercises: TemplateExerciseInput[];
}

export interface ExerciseDraft {
  id: string | null;
  name_pt: string;
  category: ExerciseCategory;
  primary_muscle_group: string;
  equipment: string;
  instructions: string;
  video_url: string;
}

export interface CycleDraft {
  id: string | null;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  notes: string;
}

export interface ScheduleDraft {
  template_id: string;
  cycle_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
}

export function templateItemsJson(items: TemplateExerciseInput[]): Json {
  return items.map((item) => ({
    exercise_id: item.exercise_id,
    target_sets: item.target_sets,
    target_reps: item.target_reps,
    target_load_kg: item.target_load_kg,
    rest_seconds: item.rest_seconds,
    notes: item.notes,
  }));
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: "Musculação",
  running: "Corrida",
  mobility: "Mobilidade",
  recovery: "Recuperação",
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  strength: "#eab34f",
  running: "#60a5fa",
  mobility: "#34d399",
  recovery: "#a78bfa",
};
