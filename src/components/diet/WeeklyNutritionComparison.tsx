"use client";

import { motion } from "framer-motion";
import { BarChart3, CalendarRange, Utensils } from "lucide-react";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { targetPercentage, type WeeklyNutritionSummary } from "@/lib/diet/analytics";
import type { NutrientTotals, NutritionTargets } from "@/lib/diet/types";

export type NutritionPeriodWeeks = 4 | 8 | 12;

const PERIODS: NutritionPeriodWeeks[] = [4, 8, 12];

const NUTRIENTS: Array<{
  key: keyof NutrientTotals;
  targetKey: "calories" | "protein_g" | "carbs_g" | "fat_g";
  label: string;
  unit: string;
}> = [
  { key: "calories", targetKey: "calories", label: "Energia", unit: "kcal" },
  { key: "protein_g", targetKey: "protein_g", label: "Proteína", unit: "g" },
  { key: "carbs_g", targetKey: "carbs_g", label: "Carboidratos", unit: "g" },
  { key: "fat_g", targetKey: "fat_g", label: "Gorduras", unit: "g" },
];

function compactDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`))
    .replace(".", "");
}

function weekRange(week: WeeklyNutritionSummary) {
  return `${compactDate(week.week_start)} – ${compactDate(week.week_end)}`;
}

function deltaLabel(current: number, previous: number, unit: string) {
  const delta = Math.round(current - previous);
  if (delta === 0) return "sem variação na média";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${unit} vs. semana anterior`;
}

export default function WeeklyNutritionComparison({
  weeks,
  targets,
  periodWeeks,
  onPeriodChange,
}: {
  weeks: WeeklyNutritionSummary[];
  targets: NutritionTargets;
  periodWeeks: NutritionPeriodWeeks;
  onPeriodChange: (period: NutritionPeriodWeeks) => void;
}) {
  const current = weeks.at(-1);
  const previous = weeks.at(-2);
  const hasCurrentData = Boolean(current?.recorded_days);
  const hasPreviousData = Boolean(previous?.recorded_days);

  return (
    <div className="space-y-7">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <IconTile Icon={CalendarRange} active size="sm" />
          <div>
            <p className="text-[12px] font-semibold text-ink">Período da análise</p>
            <p className="mt-1 text-[9px] leading-relaxed text-ink-muted">As médias consideram somente dias com ao menos uma refeição registrada.</p>
          </div>
        </div>
        <div className="flex rounded-control border border-line-subtle bg-canvas p-1" aria-label="Período do progresso alimentar">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={periodWeeks === period}
              onClick={() => onPeriodChange(period)}
              className={`min-h-9 flex-1 rounded-[9px] px-3 text-[9px] font-semibold transition-colors sm:flex-none ${periodWeeks === period ? "bg-accent text-black" : "text-ink-muted hover:bg-surface-hover hover:text-ink"}`}
            >
              {period} semanas
            </button>
          ))}
        </div>
      </Card>

      <section>
        <SectionHeader eyebrow="Comparativo semanal" title="Semana atual vs. anterior" />
        <Card emphasis className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-line-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold text-ink">{current ? weekRange(current) : "Semana atual"}</p>
              <p className="mt-1 text-[9px] text-ink-muted">
                {hasCurrentData
                  ? `${current?.recorded_days} ${current?.recorded_days === 1 ? "dia" : "dias"} e ${current?.meal_count} ${current?.meal_count === 1 ? "refeição" : "refeições"} registrados até hoje`
                  : "Ainda não há refeições registradas nesta semana."}
              </p>
            </div>
            {previous && (
              <div className="rounded-control border border-line-subtle bg-surface px-3 py-2 text-left sm:text-right">
                <p className="apex-kicker">Semana anterior</p>
                <p className="mt-1 text-[9px] font-semibold text-ink-secondary">{weekRange(previous)}</p>
                <p className="mt-1 text-[8px] text-ink-muted">{previous.recorded_days} dias · {previous.meal_count} refeições</p>
              </div>
            )}
          </div>

          {!hasCurrentData ? (
            <div className="py-8 text-center">
              <Utensils size={22} className="mx-auto text-ink-faint" />
              <p className="mt-3 text-[11px] font-semibold text-ink-secondary">Comparação indisponível por enquanto</p>
              <p className="mx-auto mt-2 max-w-md text-[9px] leading-relaxed text-ink-muted">Registre uma refeição consumida nesta semana para comparar suas médias com a meta e com a semana anterior.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {NUTRIENTS.map((nutrient) => {
                const value = current?.average[nutrient.key] ?? 0;
                const target = Number(targets[nutrient.targetKey]);
                const percentage = targetPercentage(value, target);
                const previousValue = previous?.average[nutrient.key] ?? 0;
                return (
                  <div key={nutrient.key} className="rounded-panel border border-line-subtle bg-surface p-3.5">
                    <p className="apex-kicker">{nutrient.label}</p>
                    <p className="mt-3 font-stat text-[18px] font-semibold text-ink">{Math.round(value)} <span className="text-[8px] font-normal text-ink-muted">{nutrient.unit}</span></p>
                    <p className="mt-1 text-[8px] text-ink-muted">meta diária: {Math.round(target)} {nutrient.unit}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, percentage)}%` }} /></div>
                    <p className="mt-2 font-stat text-[8px] text-ink-faint">{percentage}% da meta · {hasPreviousData ? deltaLabel(value, previousValue, nutrient.unit) : "sem base anterior"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionHeader eyebrow={`${periodWeeks} semanas`} title="Tendência da energia registrada" />
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] leading-relaxed text-ink-muted">Cada barra representa a média de energia nos dias registrados daquela semana.</p>
            <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[8px] text-ink-muted">linha = meta de {Math.round(Number(targets.calories))} kcal</span>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="relative grid h-52 min-w-[520px] items-end gap-2 border-b border-line-subtle px-1 pb-2" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(34px, 1fr))` }}>
              <div className="pointer-events-none absolute inset-x-1 bottom-[76%] border-t border-dashed border-accent/35" />
              {weeks.map((week, index) => {
                const hasData = week.recorded_days > 0;
                const percentage = hasData ? targetPercentage(week.average.calories, Number(targets.calories)) : 0;
                const height = hasData ? Math.max(5, Math.min(100, percentage / 1.32)) : 2;
                const isCurrent = index === weeks.length - 1;
                return (
                  <div key={week.week_start} className="flex h-full min-w-0 flex-col justify-end text-center">
                    <p className="mb-2 truncate font-stat text-[7px] text-ink-muted">{hasData ? Math.round(week.average.calories) : "—"}</p>
                    <div className="mx-auto flex h-[142px] w-full max-w-9 items-end overflow-hidden rounded-t-control bg-surface">
                      <motion.span
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className={`block w-full rounded-t-control ${hasData ? isCurrent ? "bg-accent" : "bg-emerald-400/80" : "bg-surface-hover"}`}
                      />
                    </div>
                    <p className={`mt-2 truncate text-[7px] font-semibold uppercase ${isCurrent ? "text-accent" : "text-ink-faint"}`}>{isCurrent ? "Atual" : compactDate(week.week_start)}</p>
                    <p className="mt-0.5 font-stat text-[7px] text-ink-faint">{week.recorded_days}d</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-[8px] leading-relaxed text-ink-muted"><BarChart3 size={13} className="mt-0.5 shrink-0 text-accent" />Semanas sem registros aparecem sem média. Variações mostram apenas o que foi registrado e não representam avaliação clínica.</div>
        </Card>
      </section>
    </div>
  );
}
