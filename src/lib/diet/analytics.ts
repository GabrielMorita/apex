import { sumNutrients } from "@/lib/diet/generator";
import type { DietConsumptionEntry, NutrientTotals } from "@/lib/diet/types";

export interface DailyNutritionSummary extends NutrientTotals {
  date: string;
  meal_count: number;
}

export interface WeeklyNutritionSummary {
  week_start: string;
  week_end: string;
  recorded_days: number;
  meal_count: number;
  days_in_energy_range: number;
  total: NutrientTotals;
  average: NutrientTotals;
}

const EMPTY_TOTALS: NutrientTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

export function summarizeConsumptionByDate(entries: DietConsumptionEntry[]): DailyNutritionSummary[] {
  const grouped = new Map<string, DietConsumptionEntry[]>();
  for (const entry of entries) grouped.set(entry.consumed_date, [...(grouped.get(entry.consumed_date) ?? []), entry]);
  return [...grouped.entries()]
    .map(([date, dayEntries]) => ({ date, meal_count: dayEntries.length, ...sumNutrients(dayEntries) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function summarizeConsumptionForDate(entries: DietConsumptionEntry[], date: string): DailyNutritionSummary {
  return summarizeConsumptionByDate(entries.filter((entry) => entry.consumed_date === date))[0]
    ?? { date, meal_count: 0, ...EMPTY_TOTALS };
}

export function averageNutrition(summaries: DailyNutritionSummary[]): NutrientTotals {
  if (summaries.length === 0) return { ...EMPTY_TOTALS };
  const total = sumNutrients(summaries);
  return {
    calories: total.calories / summaries.length,
    protein_g: total.protein_g / summaries.length,
    carbs_g: total.carbs_g / summaries.length,
    fat_g: total.fat_g / summaries.length,
  };
}

export function targetPercentage(value: number, target: number) {
  return target > 0 ? Math.round((value / target) * 100) : 0;
}

export function shiftIsoDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function weekStartForDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftIsoDate(value, -((weekday + 6) % 7));
}

export function summarizeConsumptionByWeek(
  entries: DietConsumptionEntry[],
  endWeekStart: string,
  weekCount: number,
  energyTarget: number,
): WeeklyNutritionSummary[] {
  const dailySummaries = summarizeConsumptionByDate(entries);
  const byDate = new Map(dailySummaries.map((summary) => [summary.date, summary]));
  const safeWeekCount = Math.max(1, Math.floor(weekCount));

  return Array.from({ length: safeWeekCount }, (_, index) => {
    const weekStart = shiftIsoDate(endWeekStart, (index - safeWeekCount + 1) * 7);
    const weekEnd = shiftIsoDate(weekStart, 6);
    const recordedDays = Array.from({ length: 7 }, (__, dayIndex) => byDate.get(shiftIsoDate(weekStart, dayIndex)))
      .filter((summary): summary is DailyNutritionSummary => Boolean(summary));
    const total = recordedDays.length > 0 ? sumNutrients(recordedDays) : { ...EMPTY_TOTALS };

    return {
      week_start: weekStart,
      week_end: weekEnd,
      recorded_days: recordedDays.length,
      meal_count: recordedDays.reduce((sum, summary) => sum + summary.meal_count, 0),
      days_in_energy_range: recordedDays.filter((summary) => {
        const percentage = targetPercentage(summary.calories, energyTarget);
        return percentage >= 85 && percentage <= 115;
      }).length,
      total,
      average: averageNutrition(recordedDays),
    };
  });
}
