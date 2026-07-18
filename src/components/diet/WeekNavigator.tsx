"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DietPlanSummary } from "@/lib/diet/types";
import { addWeeks, weekRangeLabel } from "@/lib/diet/weekPlanning";

export default function WeekNavigator({ selectedWeekStart, currentWeekStart, plans, disabled, onSelect }: {
  selectedWeekStart: string;
  currentWeekStart: string;
  plans: DietPlanSummary[];
  disabled: boolean;
  onSelect: (weekStart: string) => void;
}) {
  const optionWeeks = [...new Set([selectedWeekStart, currentWeekStart, ...plans.map((plan) => plan.week_start)])]
    .sort((a, b) => b.localeCompare(a));

  function context(weekStart: string) {
    if (weekStart === currentWeekStart) return "Esta semana";
    if (weekStart < currentWeekStart) return "Histórico";
    return plans.some((plan) => plan.week_start === weekStart) ? "Futura · salva" : "Futura";
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5" aria-label="Navegação entre semanas">
      <button type="button" disabled={disabled} onClick={() => onSelect(addWeeks(selectedWeekStart, -1))} aria-label="Semana anterior" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><ChevronLeft size={14} /></button>
      <select value={selectedWeekStart} disabled={disabled} onChange={(event) => onSelect(event.target.value)} aria-label="Selecionar semana" className="h-9 min-w-0 max-w-[210px] rounded-control border border-line bg-surface-raised px-2 text-[9px] font-semibold text-ink-secondary outline-none transition focus:border-accent/50 disabled:opacity-40">
        {optionWeeks.map((weekStart) => <option key={weekStart} value={weekStart}>{weekRangeLabel(weekStart)} · {context(weekStart)}</option>)}
      </select>
      <button type="button" disabled={disabled} onClick={() => onSelect(addWeeks(selectedWeekStart, 1))} aria-label="Próxima semana" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><ChevronRight size={14} /></button>
    </div>
  );
}
