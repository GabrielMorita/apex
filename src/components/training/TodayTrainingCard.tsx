"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Dumbbell, LoaderCircle, Moon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/primitives";
import { navigateTo } from "@/lib/navigationEvents";
import { loadTrainingSchedule } from "@/lib/training/service";
import type { ScheduledWorkout } from "@/lib/training/types";
import { WORKOUT_TYPE_LABELS } from "@/lib/training/types";

const STATUS_LABELS = { scheduled: "Pronto para treinar", in_progress: "Em execução", completed: "Concluído", skipped: "Ignorado" } as const;

export default function TodayTrainingCard({ selectedDate }: { selectedDate: string }) {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setWorkouts([]); return; }
    let active = true;
    setLoading(true); setError(false);
    void loadTrainingSchedule(user.id, selectedDate, selectedDate).then((loaded) => { if (active) setWorkouts(loaded); }).catch(() => { if (active) { setWorkouts([]); setError(true); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, selectedDate, user]);
  const workout = workouts.find((item) => item.status !== "skipped") ?? workouts[0];
  const template = workout?.template;
  return <Card className="flex h-full flex-col p-5"><div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Dumbbell size={18} /></span><div><p className="apex-kicker mb-1.5">Treino do dia</p><h2 className="apex-section-heading">{template?.name ?? "Recuperação"}</h2></div></div><button onClick={() => navigateTo("treinos:semana")} className="flex min-h-9 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver treino <ChevronRight size={13} /></button></div>
    {loading ? <div className="flex flex-1 items-center justify-center gap-2 text-[9px] text-ink-muted"><LoaderCircle size={13} className="animate-spin text-accent" />Carregando...</div> : error ? <div className="flex flex-1 items-center justify-center rounded-card border border-red-400/15 p-5 text-center text-[9px] text-red-300">Não foi possível carregar o treino real.</div> : workout && template ? <><div className="rounded-card border border-line bg-surface p-4"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[.1em] ${workout.status === "completed" ? "bg-emerald-400/10 text-emerald-300" : "bg-accent-subtle text-accent"}`}>{STATUS_LABELS[workout.status]}</span><span className="font-stat text-[9px] text-ink-muted">{workout.scheduled_time.slice(0, 5)}</span></div><p className="mt-3 text-[10px] leading-relaxed text-ink-muted">{template.description || WORKOUT_TYPE_LABELS[template.workout_type]}</p><p className="mt-3 font-stat text-[9px] text-ink-secondary">{template.exercises.length} exercícios</p></div><div className="mt-4 space-y-2">{template.exercises.slice(0, 3).map((item) => <div key={item.id} className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2.5 text-[10px] text-ink-secondary"><span className="h-1.5 w-1.5 rounded-full bg-accent" /><span className="truncate">{item.exercise?.name_pt ?? "Exercício indisponível"}</span></div>)}</div><button onClick={() => navigateTo("treinos:semana")} className="apex-button-secondary mt-auto w-full">{workout.status === "in_progress" ? "Retomar no Treino" : workout.status === "completed" ? "Ver sessão" : "Abrir treino"}</button></> : <div className="flex flex-1 flex-col items-center justify-center rounded-card border border-dashed border-line p-8 text-center"><Moon size={24} className="mb-3 text-accent" /><p className="text-[13px] font-semibold text-ink">Dia de recuperação</p><p className="mt-1 text-[10px] text-ink-muted">Sem treino programado para este dia.</p></div>}
  </Card>;
}
