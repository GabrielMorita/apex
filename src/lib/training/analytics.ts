import { shiftDate } from "@/lib/training/date";
import type { TrainingSession } from "@/lib/training/types";

export interface WeeklyTrainingSummary {
  week_start: string;
  week_end: string;
  sessions: number;
  duration_minutes: number;
  volume_kg: number;
}

export interface TrainingRecord {
  exercise_id: string | null;
  exercise_name: string;
  max_load_kg: number;
  best_set_volume_kg: number;
  achieved_at: string;
}

export function weeklyTrainingSummaries(sessions: TrainingSession[], endWeekStart: string, weekCount: number): WeeklyTrainingSummary[] {
  return Array.from({ length: weekCount }, (_, index) => {
    const start = shiftDate(endWeekStart, (index - weekCount + 1) * 7);
    const end = shiftDate(start, 6);
    const rows = sessions.filter((session) => {
      const date = (session.completed_at ?? session.started_at).slice(0, 10);
      return date >= start && date <= end;
    });
    return {
      week_start: start,
      week_end: end,
      sessions: rows.length,
      duration_minutes: rows.reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0),
      volume_kg: rows.reduce((sum, session) => sum + Number(session.total_volume_kg), 0),
    };
  });
}

export function trainingRecords(sessions: TrainingSession[]): TrainingRecord[] {
  const records = new Map<string, TrainingRecord>();
  for (const session of sessions) {
    for (const set of session.sets.filter((item) => item.is_completed && item.actual_load_kg !== null && item.actual_reps !== null)) {
      const key = set.exercise_id ?? set.exercise_name_snapshot.toLowerCase();
      const load = Number(set.actual_load_kg);
      const setVolume = load * Number(set.actual_reps);
      const current = records.get(key);
      if (!current || load > current.max_load_kg || (load === current.max_load_kg && setVolume > current.best_set_volume_kg)) {
        records.set(key, { exercise_id: set.exercise_id, exercise_name: set.exercise_name_snapshot, max_load_kg: load, best_set_volume_kg: setVolume, achieved_at: session.completed_at ?? session.started_at });
      }
    }
  }
  return [...records.values()].sort((a, b) => b.max_load_kg - a.max_load_kg || a.exercise_name.localeCompare(b.exercise_name));
}

export function completedSetCount(sessions: TrainingSession[]) {
  return sessions.reduce((sum, session) => sum + session.sets.filter((set) => set.is_completed).length, 0);
}
