"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CalendarCheck2, CheckCircle2, Clock3, Dumbbell, LoaderCircle, Trophy } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { completedSetCount, trainingRecords, weeklyTrainingSummaries } from "@/lib/training/analytics";
import { currentWeekRange, formatTrainingDate, isoDate, shiftDate } from "@/lib/training/date";
import { friendlyTrainingError } from "@/lib/training/errors";
import { loadCompletedTrainingSessions } from "@/lib/training/service";
import type { TrainingSession } from "@/lib/training/types";
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from "@/lib/training/types";

type HistoryPeriod = 4 | 8 | 12;

export default function TrainingHistory() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<HistoryPeriod>(4);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = isoDate(new Date());
  const weekStart = currentWeekRange().start;
  const dateFrom = shiftDate(weekStart, -(period - 1) * 7);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível. Entre novamente para consultar o histórico."); return; }
    let active = true;
    setLoading(true); setError("");
    void loadCompletedTrainingSessions(user.id, dateFrom, today).then((loaded) => { if (active) setSessions(loaded); }).catch((loadError) => { if (active) setError(friendlyTrainingError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, dateFrom, today, user]);

  const weeks = useMemo(() => weeklyTrainingSummaries(sessions, weekStart, period), [period, sessions, weekStart]);
  const records = useMemo(() => trainingRecords(sessions), [sessions]);
  const totalDuration = sessions.reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0);
  const totalVolume = sessions.reduce((sum, session) => sum + Number(session.total_volume_kg), 0);
  const setCount = completedSetCount(sessions);
  const currentWeek = weeks.at(-1);
  const previousWeek = weeks.at(-2);

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando histórico real...</Card>;
  if (error) return <Card className="flex items-start gap-3 border-red-400/20 p-5 text-[10px] text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</Card>;

  return <div className="space-y-7">
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-semibold text-ink">Período do histórico</p><p className="mt-1 text-[8px] text-ink-muted">Somente sessões realmente concluídas.</p></div><div className="flex rounded-control border border-line-subtle bg-canvas p-1">{([4, 8, 12] as HistoryPeriod[]).map((value) => <button key={value} type="button" onClick={() => setPeriod(value)} className={`min-h-9 rounded-[9px] px-3 text-[9px] font-semibold ${period === value ? "bg-accent text-black" : "text-ink-muted"}`}>{value} semanas</button>)}</div></Card>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><HistoryMetric label="Sessões" value={String(sessions.length)} detail={`${currentWeek?.sessions ?? 0} nesta semana`} Icon={CalendarCheck2} emphasis /><HistoryMetric label="Duração" value={`${totalDuration} min`} detail="soma das sessões concluídas" Icon={Clock3} /><HistoryMetric label="Volume" value={`${Math.round(totalVolume).toLocaleString("pt-BR")} kg`} detail="repetições × carga registrada" Icon={BarChart3} /><HistoryMetric label="Séries" value={String(setCount)} detail="séries marcadas como concluídas" Icon={CheckCircle2} /></section>
    <section><SectionHeader eyebrow={`Tendência de ${period} semanas`} title="Frequência e volume" /><Card className="p-4 sm:p-5"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[8px] text-ink-muted">Altura: número de sessões. O valor abaixo mostra o volume registrado.</p><span className="text-[8px] text-ink-faint">Atual vs. anterior: {currentWeek && previousWeek ? `${currentWeek.sessions - previousWeek.sessions > 0 ? "+" : ""}${currentWeek.sessions - previousWeek.sessions} sessão(ões)` : "—"}</span></div><div className="overflow-x-auto"><div className="grid h-48 min-w-[520px] items-end gap-2 border-b border-line-subtle pb-2" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(36px, 1fr))` }}>{weeks.map((week, index) => { const maxSessions = Math.max(1, ...weeks.map((item) => item.sessions)); const height = week.sessions ? Math.max(8, (week.sessions / maxSessions) * 100) : 2; const current = index === weeks.length - 1; return <div key={week.week_start} className="flex h-full flex-col justify-end text-center"><p className="mb-2 font-stat text-[8px] text-ink-muted">{week.sessions || "—"}</p><div className="mx-auto flex h-28 w-full max-w-9 items-end overflow-hidden rounded-t-control bg-surface"><span className={`block w-full rounded-t-control ${current ? "bg-accent" : "bg-emerald-400/75"}`} style={{ height: `${height}%` }} /></div><p className={`mt-2 text-[7px] font-semibold uppercase ${current ? "text-accent" : "text-ink-faint"}`}>{current ? "Atual" : formatTrainingDate(week.week_start, { day: "2-digit", month: "short" })}</p><p className="mt-0.5 font-stat text-[6px] text-ink-faint">{Math.round(week.volume_kg).toLocaleString("pt-BR")} kg</p></div>; })}</div></div></Card></section>
    <section className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]"><div><SectionHeader eyebrow="Melhores marcas registradas" title="Recordes por exercício" />{records.length === 0 ? <Card className="p-6 text-center"><Trophy size={20} className="mx-auto text-ink-faint" /><p className="mt-3 text-[9px] text-ink-muted">Registre carga e repetições para formar recordes.</p></Card> : <div className="space-y-2">{records.slice(0, 8).map((record) => <Card key={record.exercise_id ?? record.exercise_name} className="p-3"><div className="flex items-center gap-3"><IconTile Icon={Trophy} active size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold text-ink-secondary">{record.exercise_name}</p><p className="mt-1 text-[7px] text-ink-muted">Melhor carga · {new Date(record.achieved_at).toLocaleDateString("pt-BR")}</p></div><div className="text-right"><p className="font-stat text-[12px] font-semibold text-accent">{record.max_load_kg.toLocaleString("pt-BR")} kg</p><p className="mt-0.5 font-stat text-[7px] text-ink-faint">{Math.round(record.best_set_volume_kg)} kg/série</p></div></div></Card>)}</div>}</div><div><SectionHeader eyebrow="Sessões concluídas" title="Histórico detalhado" />{sessions.length === 0 ? <Card className="p-8 text-center"><Dumbbell size={22} className="mx-auto text-ink-faint" /><p className="mt-3 text-[12px] font-semibold text-ink-secondary">Nenhuma sessão concluída</p><p className="mt-2 text-[9px] text-ink-muted">Inicie um treino na aba Semana e conclua as séries.</p></Card> : <div className="space-y-3">{sessions.map((session) => <SessionHistoryCard key={session.id} session={session} />)}</div>}</div></section>
  </div>;
}

function HistoryMetric({ label, value, detail, Icon, emphasis = false }: { label: string; value: string; detail: string; Icon: typeof Dumbbell; emphasis?: boolean }) { return <Card emphasis={emphasis} className="p-4"><div className="flex items-start justify-between"><p className="apex-kicker">{label}</p><IconTile Icon={Icon} active={emphasis} size="sm" /></div><p className={`mt-4 font-stat text-[21px] font-semibold ${emphasis ? "text-accent" : "text-ink"}`}>{value}</p><p className="mt-1 text-[8px] text-ink-muted">{detail}</p></Card>; }

function SessionHistoryCard({ session }: { session: TrainingSession }) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<string, TrainingSession["sets"]>();
    for (const set of session.sets) { const key = `${set.exercise_order}-${set.exercise_name_snapshot}`; map.set(key, [...(map.get(key) ?? []), set]); }
    return [...map.values()];
  }, [session.sets]);
  return <Card className="overflow-hidden"><button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-4 text-left"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: WORKOUT_TYPE_COLORS[session.workout_type_snapshot] }} /><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-ink">{session.template_name_snapshot}</p><p className="mt-1 text-[8px] text-ink-muted">{session.completed_at ? new Date(session.completed_at).toLocaleString("pt-BR") : ""} · {WORKOUT_TYPE_LABELS[session.workout_type_snapshot]}</p></div><div className="text-right"><p className="font-stat text-[9px] text-ink-secondary">{session.duration_minutes ?? 0} min</p><p className="mt-1 font-stat text-[7px] text-ink-faint">{Math.round(session.total_volume_kg).toLocaleString("pt-BR")} kg</p></div></button>{open && <div className="space-y-2 border-t border-line-subtle p-4">{groups.map((sets) => <div key={`${sets[0].exercise_order}-${sets[0].exercise_name_snapshot}`} className="rounded-control border border-line-subtle bg-surface p-3"><p className="text-[9px] font-semibold text-ink-secondary">{sets[0].exercise_name_snapshot}</p><div className="mt-2 flex flex-wrap gap-2">{sets.map((set) => <span key={set.id} className={`rounded-full border px-2 py-1 font-stat text-[7px] ${set.is_completed ? "border-emerald-400/20 text-emerald-300" : "border-line text-ink-faint"}`}>{set.set_order}: {set.actual_reps ?? "—"} reps{set.actual_load_kg !== null ? ` × ${set.actual_load_kg} kg` : ""}</span>)}</div></div>)}{session.notes && <p className="text-[8px] leading-relaxed text-ink-muted">{session.notes}</p>}</div>}</Card>;
}
