import { CheckCircle2, CircleGauge } from "lucide-react";
import { sumNutrients } from "@/lib/diet/generator";
import type { DietConsumptionEntry, DietPlanDay } from "@/lib/diet/types";

export default function DailyConsumption({ day, entries }: { day: DietPlanDay; entries: DietConsumptionEntry[] }) {
  const consumed = sumNutrients(entries);
  const complete = entries.length === day.meals.length;
  return (
    <div className={`mt-4 rounded-card border p-4 ${complete ? "border-emerald-300/25 bg-emerald-300/5" : "border-line bg-surface/50"}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${complete ? "bg-emerald-300/10 text-emerald-300" : "bg-accent-subtle text-accent"}`}>{complete ? <CheckCircle2 size={16} /> : <CircleGauge size={16} />}</span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[12px] font-semibold text-ink">Progresso consumido</p><span className="text-[9px] font-semibold text-ink-muted">{entries.length}/{day.meals.length} refeições</span></div><p className="mt-1 text-[9px] leading-relaxed text-ink-muted">Compara os registros consumidos com o planejamento deste dia.</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Progress label="Energia" value={consumed.calories} planned={day.calories} unit="kcal" />
        <Progress label="Proteína" value={consumed.protein_g} planned={day.protein_g} unit="g" />
        <Progress label="Carboidratos" value={consumed.carbs_g} planned={day.carbs_g} unit="g" />
        <Progress label="Gorduras" value={consumed.fat_g} planned={day.fat_g} unit="g" />
      </div>
    </div>
  );
}

function Progress({ label, value, planned, unit }: { label: string; value: number; planned: number; unit: string }) {
  const percentage = planned > 0 ? Math.round((value / planned) * 100) : 0;
  return <div className="rounded-control border border-line-subtle bg-surface-raised p-2.5"><p className="text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-stat text-[11px] font-semibold text-ink">{Math.round(value)} <span className="text-[8px] font-normal text-ink-muted">/ {Math.round(planned)} {unit}</span></p><div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover"><span className="block h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(100, percentage)}%` }} /></div></div>;
}
