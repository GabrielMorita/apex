import type { WeeklyDietPlan } from "@/lib/diet/types";

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function addWeeks(weekStart: string, amount: number) {
  const date = parseDate(weekStart);
  date.setDate(date.getDate() + amount * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(dateValue: string, amount: number) {
  const date = parseDate(dateValue);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function weekRangeLabel(weekStart: string) {
  const end = addDays(weekStart, 6);
  const startDate = parseDate(weekStart);
  const endDate = parseDate(end);
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  const start = new Intl.DateTimeFormat("pt-BR", sameMonth ? { day: "2-digit" } : { day: "2-digit", month: "short" }).format(startDate);
  const finish = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(endDate);
  return `${start} – ${finish}`;
}

export function copyWeeklyPlanToWeek(source: WeeklyDietPlan, targetWeekStart: string): WeeklyDietPlan {
  return {
    week_start: targetWeekStart,
    generation_version: `${source.generation_version}-copy`,
    targets_snapshot: { ...source.targets_snapshot },
    preferences_snapshot: { ...source.preferences_snapshot },
    days: source.days.map((day, dayIndex) => ({
      ...day,
      plan_date: addDays(targetWeekStart, dayIndex),
      day_order: dayIndex,
      meals: day.meals.map((meal) => ({
        ...meal,
        is_locked: false,
        regeneration_count: 0,
        items: meal.items.map((item) => ({ ...item })),
      })),
    })),
  };
}
