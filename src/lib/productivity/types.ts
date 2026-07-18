import type { Json } from "@/lib/supabase/database.types";
import type { ReadingCycle, ReadingProject, ReadingSession } from "@/data/readingData";

export type HabitStatus = "pending" | "done" | "skipped";
export type HabitFrequency =
  | { type: "daily" }
  | { type: "xPerWeek"; times: number }
  | { type: "specificDays"; days: number[] };
export type HabitCategory = "espiritual" | "treino" | "foco" | "saude" | "aprendizado" | "pessoal";

export interface Habit {
  id: string;
  name: string;
  time: string;
  period: "morning" | "afternoon" | "evening" | "anytime";
  category: HabitCategory;
  color: string;
  lucideIcon: string;
  frequency: HabitFrequency;
  weeklyGoal: number;
  durationMinutes: number | null;
  duration?: string;
  opensReadingLog: boolean;
  status: HabitStatus;
  streak: number;
  isArchived: boolean;
}

export interface HabitDraft {
  id: string | null;
  name: string;
  time: string;
  period: Habit["period"];
  category: HabitCategory;
  color: string;
  lucideIcon: string;
  frequency: HabitFrequency;
  weeklyGoal: number;
  durationMinutes: number | null;
  opensReadingLog: boolean;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  status: Exclude<HabitStatus, "pending">;
  completedAt: string | null;
}

export interface HabitDayPlan { date: string; habitIds: string[]; }

export type TaskFrequency =
  | { type: "once" }
  | { type: "daily" }
  | { type: "xPerWeek"; times: number }
  | { type: "specificDays"; days: number[] };

export interface Task {
  id: string;
  name: string;
  time?: string;
  frequency: TaskFrequency;
  date?: string;
  notes: string;
  status: HabitStatus;
  isArchived: boolean;
}

export interface TaskDraft {
  id: string | null;
  name: string;
  time: string;
  frequency: TaskFrequency;
  date: string;
  notes: string;
}

export interface TaskEntry { id: string; taskId: string; date: string; status: Exclude<HabitStatus, "pending">; completedAt: string | null; }

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  current: number;
  target: number;
  unit: string;
  status: "active" | "completed" | "paused" | "archived";
  linkedHabitIds: string[];
  linkedWorkoutTemplateIds: string[];
}

export interface GoalDraft extends Omit<Goal, "id"> { id: string | null; }

export interface CheckinEntry {
  date: string;
  energia: number;
  sono: number;
  humor: number;
  estresse: number;
  dorMuscular: number;
  notes?: string;
}

export interface InboxItem {
  id: string;
  type: "note" | "idea";
  content: string;
  createdAt: string;
  archived?: boolean;
}

export interface WeeklyReview { weekStart: string; answers: Record<string, string>; updatedAt: string; }

export interface FocusSession {
  id: string;
  habitId: string | null;
  date: string;
  minutes: number;
  task: string;
  completedAt: string;
}

export type ProductivityReadingProject = ReadingProject;
export type ProductivityReadingSession = ReadingSession;
export type ProductivityReadingCycle = ReadingCycle;

export function reviewAnswersJson(answers: Record<string, string>): Json {
  return answers;
}
