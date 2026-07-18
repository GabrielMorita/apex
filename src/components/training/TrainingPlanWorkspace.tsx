"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Dumbbell, Layers3, Library, LoaderCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/primitives";
import TrainingWeekPlanner from "@/components/training/TrainingWeekPlanner";
import TrainingTemplateManager from "@/components/training/TrainingTemplateManager";
import TrainingExerciseLibrary from "@/components/training/TrainingExerciseLibrary";
import TrainingCycleManager from "@/components/training/TrainingCycleManager";
import { currentWeekRange, shiftDate } from "@/lib/training/date";
import { friendlyTrainingError } from "@/lib/training/errors";
import { loadTrainingCycles, loadTrainingExercises, loadTrainingSchedule, loadTrainingTemplates } from "@/lib/training/service";
import type { ScheduledWorkout, TrainingCycle, TrainingExercise, TrainingTemplate } from "@/lib/training/types";

type PlanSection = "week" | "templates" | "library" | "cycles";
const SECTIONS = [
  { id: "week" as const, label: "Semana", description: "Distribua as fichas", Icon: CalendarDays },
  { id: "templates" as const, label: "Fichas", description: "Monte seus treinos", Icon: Dumbbell },
  { id: "library" as const, label: "Biblioteca", description: "Exercícios e instruções", Icon: Library },
  { id: "cycles" as const, label: "Ciclos", description: "Organize períodos", Icon: Layers3 },
];

export default function TrainingPlanWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState<PlanSection>("week");
  const [weekStart, setWeekStart] = useState(currentWeekRange().start);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [cycles, setCycles] = useState<TrainingCycle[]>([]);
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    const [loadedExercises, loadedTemplates, loadedCycles, loadedSchedule] = await Promise.all([
      loadTrainingExercises(user.id),
      loadTrainingTemplates(user.id),
      loadTrainingCycles(user.id),
      loadTrainingSchedule(user.id, weekStart, shiftDate(weekStart, 6)),
    ]);
    setExercises(loadedExercises); setTemplates(loadedTemplates); setCycles(loadedCycles); setSchedule(loadedSchedule);
  }, [user, weekStart]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível. Entre novamente para acessar o Treino."); return; }
    let active = true;
    setLoading(true); setError("");
    void refresh().catch((loadError) => { if (active) setError(friendlyTrainingError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, refresh, user]);

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando plano de treino...</Card>;
  if (error || !user) return <Card className="flex items-start gap-3 border-red-400/20 p-5 text-[10px] leading-relaxed text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error || "Não foi possível carregar o Treino."}</Card>;

  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist" aria-label="Seções do Plano e Ciclos">{SECTIONS.map(({ id, label, description, Icon }) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)} className={`flex min-h-16 items-center gap-3 rounded-card border p-3 text-left transition ${section === id ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface/50 text-ink-muted hover:bg-surface-hover hover:text-ink"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${section === id ? "bg-accent/10" : "bg-surface-raised"}`}><Icon size={15} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold">{label}</span><span className="mt-1 hidden text-[8px] leading-snug opacity-70 sm:block">{description}</span></span></button>)}</div>
    {section === "week" && <TrainingWeekPlanner userId={user.id} weekStart={weekStart} templates={templates} cycles={cycles} schedule={schedule} onWeekChange={setWeekStart} onChanged={refresh} />}
    {section === "templates" && <TrainingTemplateManager userId={user.id} templates={templates} exercises={exercises} onChanged={refresh} />}
    {section === "library" && <TrainingExerciseLibrary userId={user.id} exercises={exercises} onChanged={refresh} />}
    {section === "cycles" && <TrainingCycleManager userId={user.id} cycles={cycles} onChanged={refresh} />}
  </div>;
}
