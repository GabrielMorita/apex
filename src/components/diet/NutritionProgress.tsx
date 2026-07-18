"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CalendarRange, CheckCircle2, LoaderCircle, Target, Utensils } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import WeeklyNutritionComparison, { type NutritionPeriodWeeks } from "@/components/diet/WeeklyNutritionComparison";
import { averageNutrition, shiftIsoDate, summarizeConsumptionByDate, summarizeConsumptionByWeek, targetPercentage, weekStartForDate } from "@/lib/diet/analytics";
import { loadDietConsumptionRange, loadDietState } from "@/lib/diet/service";
import type { DietConsumptionEntry, DietState, NutrientTotals } from "@/lib/diet/types";
import { navigateTo } from "@/lib/navigationEvents";

function isoDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fullDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export default function NutritionProgress() {
  const { user, loading: authLoading } = useAuth();
  const [dietState, setDietState] = useState<DietState | null>(null);
  const [entries, setEntries] = useState<DietConsumptionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodWeeks, setPeriodWeeks] = useState<NutritionPeriodWeeks>(4);
  const today = isoDate(new Date());
  const currentWeekStart = weekStartForDate(today);
  const dateFrom = shiftIsoDate(currentWeekStart, -(periodWeeks - 1) * 7);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Sua sessão não está disponível. Entre novamente para consultar o histórico alimentar.");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([loadDietState(user), loadDietConsumptionRange(user.id, dateFrom, today)])
      .then(([loadedState, loadedEntries]) => {
        if (!active) return;
        setDietState(loadedState);
        setEntries(loadedEntries);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message.toLowerCase() : String(loadError).toLowerCase();
        setError(message.includes("diet_consumption_entries") ? "A migration v0.14.0 do consumo alimentar ainda não foi executada no Supabase." : "Não foi possível carregar o histórico alimentar. Verifique sua conexão e tente novamente.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, dateFrom, today, user]);

  const summaries = useMemo(() => summarizeConsumptionByDate(entries), [entries]);
  const average = averageNutrition(summaries);
  const totalMeals = summaries.reduce((sum, summary) => sum + summary.meal_count, 0);
  const targets = dietState?.targets;
  const weeks = useMemo(
    () => summarizeConsumptionByWeek(entries, currentWeekStart, periodWeeks, Number(targets?.calories ?? 0)),
    [currentWeekStart, entries, periodWeeks, targets?.calories],
  );
  const currentWeek = weeks.at(-1);
  const daysNearTarget = targets ? summaries.filter((summary) => {
    const percentage = targetPercentage(summary.calories, Number(targets.calories));
    return percentage >= 85 && percentage <= 115;
  }).length : 0;
  const adherence = summaries.length > 0 ? Math.round((daysNearTarget / summaries.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Progresso alimentar" subtitle={`Comparativo semanal e consumo real das últimas ${periodWeeks} semanas`} />
      <div className="apex-page space-y-7">
        {loading && <Card className="flex items-center gap-2 p-5 text-[11px] text-ink-muted"><LoaderCircle size={15} className="animate-spin text-accent" />Carregando seu histórico alimentar...</Card>}
        {!loading && error && <Card className="flex items-start gap-3 border-red-400/20 p-5 text-[11px] leading-relaxed text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</Card>}
        {!loading && !error && !targets && <Card className="p-6 text-center"><Utensils size={22} className="mx-auto text-accent" /><p className="mt-3 text-[13px] font-semibold text-ink">Configure a Dieta para iniciar o acompanhamento</p><p className="mx-auto mt-2 max-w-md text-[10px] leading-relaxed text-ink-muted">As metas e os registros reais aparecerão aqui depois da configuração inicial.</p><button type="button" onClick={() => navigateTo("dieta")} className="apex-button-primary mt-5">Configurar Dieta</button></Card>}

        {!loading && !error && targets && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric label="Média registrada" value={summaries.length ? `${Math.round(average.calories)} kcal` : "—"} detail={summaries.length ? `${summaries.length} dias com registro` : "sem consumo registrado"} Icon={Utensils} emphasis />
            <SummaryMetric label="Semana atual" value={currentWeek?.recorded_days ? String(currentWeek.recorded_days) : "—"} detail="dias com registro até hoje" Icon={CalendarRange} />
            <SummaryMetric label="Refeições" value={String(totalMeals)} detail={`registros nas últimas ${periodWeeks} semanas`} Icon={CheckCircle2} />
            <SummaryMetric label="Faixa da meta" value={summaries.length ? `${adherence}%` : "—"} detail="dias entre 85% e 115% da energia" Icon={Target} />
          </section>

          <WeeklyNutritionComparison weeks={weeks} targets={targets} periodWeeks={periodWeeks} onPeriodChange={setPeriodWeeks} />

          {summaries.length > 0 && <section>
            <SectionHeader eyebrow={`Média dos ${summaries.length} dias registrados`} title={`Macronutrientes no período de ${periodWeeks} semanas`} />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MacroAverage label="Energia" value={average.calories} target={Number(targets.calories)} unit="kcal" />
              <MacroAverage label="Proteína" value={average.protein_g} target={Number(targets.protein_g)} unit="g" />
              <MacroAverage label="Carboidratos" value={average.carbs_g} target={Number(targets.carbs_g)} unit="g" />
              <MacroAverage label="Gorduras" value={average.fat_g} target={Number(targets.fat_g)} unit="g" />
            </div>
          </section>}

          <section>
            <SectionHeader eyebrow={summaries.length > 14 ? "14 registros mais recentes do período" : `Período de ${periodWeeks} semanas`} title="Histórico alimentar recente" action={<button type="button" onClick={() => navigateTo("dieta")} className="text-[10px] font-semibold text-accent">Abrir Dieta</button>} />
            {summaries.length === 0 ? <Card className="p-8 text-center"><Utensils size={22} className="mx-auto text-ink-faint" /><p className="mt-3 text-[12px] font-semibold text-ink-secondary">Nenhum consumo registrado ainda</p><p className="mt-2 text-[9px] text-ink-muted">Marque refeições como consumidas na Dieta para formar seu histórico.</p><button type="button" onClick={() => navigateTo("dieta")} className="apex-button-secondary mt-5">Registrar primeira refeição</button></Card> : <div className="space-y-2">
              {[...summaries].reverse().slice(0, 14).map((summary) => <HistoryRow key={summary.date} summary={summary} targetCalories={Number(targets.calories)} />)}
            </div>}
          </section>
        </>}
      </div>
    </motion.div>
  );
}

function SummaryMetric({ label, value, detail, Icon, emphasis = false }: { label: string; value: string; detail: string; Icon: typeof Utensils; emphasis?: boolean }) {
  return <Card emphasis={emphasis} className="p-4"><div className="mb-4 flex items-start justify-between gap-3"><p className="apex-kicker pt-1">{label}</p><IconTile Icon={Icon} active={emphasis} size="sm" /></div><p className={`font-stat text-[24px] font-semibold ${emphasis ? "text-accent" : "text-ink"}`}>{value}</p><p className="mt-2 text-[9px] leading-relaxed text-ink-muted">{detail}</p></Card>;
}

function MacroAverage({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const percentage = targetPercentage(value, target);
  return <Card className="p-4"><p className="apex-kicker">{label}</p><p className="mt-3 font-stat text-[18px] font-semibold text-ink">{Math.round(value)} <span className="text-[9px] font-normal text-ink-muted">/ {Math.round(target)} {unit}</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, percentage)}%` }} /></div><p className="mt-2 font-stat text-[8px] text-ink-faint">{percentage}% da meta</p></Card>;
}

function HistoryRow({ summary, targetCalories }: { summary: NutrientTotals & { date: string; meal_count: number }; targetCalories: number }) {
  const percentage = targetPercentage(summary.calories, targetCalories);
  return <Card className="p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="sm:w-40"><p className="text-[11px] font-semibold capitalize text-ink">{fullDate(summary.date)}</p><p className="mt-1 text-[8px] text-ink-muted">{summary.meal_count} {summary.meal_count === 1 ? "refeição" : "refeições"}</p></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="font-stat text-[11px] font-semibold text-ink-secondary">{Math.round(summary.calories)} / {Math.round(targetCalories)} kcal</p><span className="font-stat text-[9px] text-ink-muted">{percentage}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"><span className={`block h-full rounded-full ${percentage >= 85 && percentage <= 115 ? "bg-emerald-400" : "bg-accent"}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div></div><p className="shrink-0 font-stat text-[8px] text-ink-muted">P {Math.round(summary.protein_g)}g · C {Math.round(summary.carbs_g)}g · G {Math.round(summary.fat_g)}g</p></div></Card>;
}
