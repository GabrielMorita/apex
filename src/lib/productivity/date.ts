import { isoDate, shiftDate, weekStart } from "@/lib/training/date";
import type { Habit, HabitDayPlan, HabitEntry, HabitStatus, Task, TaskEntry } from "@/lib/productivity/types";

export { isoDate, shiftDate, weekStart };

export function currentWeekDates() {
  const start = weekStart(isoDate(new Date()));
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

export function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

export function habitIsScheduled(habit: Habit, date: string, plans: HabitDayPlan[] = []) {
  const override = plans.find((plan) => plan.date === date);
  if (override) return override.habitIds.includes(habit.id);
  if (habit.frequency.type === "daily" || habit.frequency.type === "xPerWeek") return true;
  return habit.frequency.days.includes(dayOfWeek(date));
}

export function taskIsScheduled(task: Task, date: string) {
  if (task.frequency.type === "once") return task.date === date;
  if (task.frequency.type === "daily" || task.frequency.type === "xPerWeek") return true;
  return task.frequency.days.includes(dayOfWeek(date));
}

export function habitStatus(entries: HabitEntry[], habitId: string, date: string): HabitStatus {
  return entries.find((entry) => entry.habitId === habitId && entry.date === date)?.status ?? "pending";
}

export function taskStatus(entries: TaskEntry[], taskId: string, date: string): HabitStatus {
  return entries.find((entry) => entry.taskId === taskId && entry.date === date)?.status ?? "pending";
}

export function habitStreak(entries: HabitEntry[], habitId: string, today = isoDate(new Date())) {
  const completed = new Set(entries.filter((entry) => entry.habitId === habitId && entry.status === "done").map((entry) => entry.date));
  let cursor = today;
  if (!completed.has(cursor)) cursor = shiftDate(cursor, -1);
  let streak = 0;
  while (completed.has(cursor)) { streak += 1; cursor = shiftDate(cursor, -1); }
  return streak;
}

export function doneCount(entries: HabitEntry[], habitId: string, dates: string[]) {
  const accepted = new Set(dates);
  return entries.filter((entry) => entry.habitId === habitId && entry.status === "done" && accepted.has(entry.date)).length;
}

