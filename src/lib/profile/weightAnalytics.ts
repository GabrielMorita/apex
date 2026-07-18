import type { WeightHistoryEntry } from "@/lib/profile/types";

export interface DailyWeightPoint {
  date: string;
  weight_kg: number;
  source: WeightHistoryEntry["source"];
}

export interface WeeklyWeightSummary {
  week_start: string;
  week_end: string;
  recorded_days: number;
  average_weight_kg: number | null;
}

export function shiftWeightDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function weightWeekStart(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftWeightDate(value, -((weekday + 6) % 7));
}

export function dailyWeightPoints(entries: WeightHistoryEntry[]): DailyWeightPoint[] {
  const latestByDate = new Map<string, WeightHistoryEntry>();
  for (const entry of entries) {
    const previous = latestByDate.get(entry.recorded_at);
    if (!previous || entry.created_at.localeCompare(previous.created_at) >= 0) latestByDate.set(entry.recorded_at, entry);
  }
  return [...latestByDate.values()]
    .map((entry) => ({ date: entry.recorded_at, weight_kg: Number(entry.weight_kg), source: entry.source }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function weeklyWeightSummaries(points: DailyWeightPoint[], endWeekStart: string, weekCount: number): WeeklyWeightSummary[] {
  const safeCount = Math.max(1, Math.floor(weekCount));
  return Array.from({ length: safeCount }, (_, index) => {
    const weekStart = shiftWeightDate(endWeekStart, (index - safeCount + 1) * 7);
    const weekEnd = shiftWeightDate(weekStart, 6);
    const weekPoints = points.filter((point) => point.date >= weekStart && point.date <= weekEnd);
    return {
      week_start: weekStart,
      week_end: weekEnd,
      recorded_days: weekPoints.length,
      average_weight_kg: weekPoints.length > 0
        ? weekPoints.reduce((sum, point) => sum + point.weight_kg, 0) / weekPoints.length
        : null,
    };
  });
}

export function weightVariation(points: DailyWeightPoint[]) {
  if (points.length < 2) return null;
  return points.at(-1)!.weight_kg - points[0].weight_kg;
}
