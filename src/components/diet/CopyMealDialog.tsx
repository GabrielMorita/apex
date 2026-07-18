"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Copy, LoaderCircle, Lock, X } from "lucide-react";
import type { DietConsumptionEntry, WeeklyDietPlan } from "@/lib/diet/types";

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function CopyMealDialog({ plan, sourceDayIndex, mealIndex, consumption, saving, saveError, onSave, onClose }: {
  plan: WeeklyDietPlan;
  sourceDayIndex: number;
  mealIndex: number;
  consumption: DietConsumptionEntry[];
  saving: boolean;
  saveError?: string;
  onSave: (targetDayIndices: number[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const sourceMeal = plan.days[sourceDayIndex]?.meals[mealIndex];
  const availableDays = useMemo(() => plan.days.map((day, dayIndex) => ({ day, dayIndex, meal: day.meals[mealIndex] })).filter(({ dayIndex }) => dayIndex !== sourceDayIndex), [mealIndex, plan.days, sourceDayIndex]);
  const selectable = availableDays.filter(({ meal }) => meal && !meal.is_locked).map(({ dayIndex }) => dayIndex);
  const allSelected = selectable.length > 0 && selectable.every((dayIndex) => selected.includes(dayIndex));

  function toggle(dayIndex: number) {
    setSelected((current) => current.includes(dayIndex) ? current.filter((value) => value !== dayIndex) : [...current, dayIndex].sort());
    setError("");
  }

  function submit() {
    if (selected.length === 0) return setError("Escolha pelo menos um dia de destino.");
    setError("");
    onSave(selected);
  }

  if (!sourceMeal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="copy-meal-title" onMouseDown={(event) => { if (!saving && event.target === event.currentTarget) onClose(); }}>
      <div className="w-full overflow-hidden rounded-t-panel border border-line bg-surface-raised shadow-2xl sm:max-w-lg sm:rounded-panel">
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div><p className="apex-kicker">Repetir no plano</p><h3 id="copy-meal-title" className="mt-2 text-[16px] font-semibold text-ink">Copiar {sourceMeal.name.toLowerCase()}</h3><p className="mt-1 text-[9px] leading-relaxed text-ink-muted">Os itens e quantidades substituirão a mesma refeição nos dias escolhidos. Nome e horário de cada destino serão preservados.</p></div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted disabled:opacity-40"><X size={15} /></button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><p className="text-[9px] font-semibold text-ink-secondary">Escolha os dias</p><button type="button" disabled={saving || selectable.length === 0} onClick={() => setSelected(allSelected ? [] : selectable)} className="text-[8px] font-semibold text-accent disabled:opacity-40">{allSelected ? "Desmarcar todos" : "Selecionar disponíveis"}</button></div>
          <div className="mt-3 space-y-2">
            {availableDays.map(({ day, dayIndex, meal }) => {
              const locked = !meal || meal.is_locked;
              const checked = selected.includes(dayIndex);
              const consumed = meal ? consumption.some((entry) => entry.consumed_date === day.plan_date && entry.meal_order === meal.meal_order) : false;
              return (
                <button key={day.plan_date} type="button" disabled={saving || locked} aria-pressed={checked} onClick={() => toggle(dayIndex)} className={`flex min-h-12 w-full items-center gap-3 rounded-card border px-3 py-2.5 text-left transition disabled:cursor-not-allowed ${checked ? "border-line-accent bg-accent-subtle" : "border-line bg-surface hover:bg-surface-hover"} ${locked ? "opacity-45" : ""}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-accent bg-accent text-[#17110a]" : "border-line text-transparent"}`}>{locked ? <Lock size={10} className="text-ink-faint" /> : <Check size={11} />}</span>
                  <span className="min-w-0 flex-1"><span className={`block text-[10px] font-semibold ${checked ? "text-ink" : "text-ink-secondary"}`}>{DAY_NAMES[dayIndex]} · {formatDate(day.plan_date)}</span><span className="mt-0.5 block text-[8px] text-ink-faint">{locked ? "Destino bloqueado" : `${meal.name} · ${Math.round(meal.calories)} kcal atuais`}</span></span>
                  {consumed && <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2 py-1 text-[7px] font-semibold text-emerald-200"><CheckCircle2 size={9} />Consumida</span>}
                </button>
              );
            })}
          </div>

          <p className="mt-3 rounded-control border border-amber-300/20 bg-amber-300/5 p-3 text-[8px] leading-relaxed text-amber-100">Se o destino já foi consumido, somente o plano será alterado. O histórico do consumo real continuará intacto.</p>
          {(error || saveError) && <p className="mt-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error || saveError}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={onClose} className="apex-button-secondary disabled:opacity-40">Cancelar</button><button type="button" disabled={saving || selected.length === 0} onClick={submit} className="apex-button-primary disabled:opacity-40">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Copy size={14} />}Copiar para {selected.length || 0} {selected.length === 1 ? "dia" : "dias"}</button></div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T12:00:00`));
}

