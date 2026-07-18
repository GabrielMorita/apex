"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Dumbbell, LoaderCircle, Pause, Play, RefreshCw, Timer, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { currentWeekRange, formatTrainingDate, shiftDate } from "@/lib/training/date";
import { friendlyTrainingError } from "@/lib/training/errors";
import { cancelTrainingSession, finishTrainingSession, loadLatestSessionForSchedule, loadTrainingExercises, loadTrainingSchedule, loadTrainingSession, replaceTrainingSessionExercise, startTrainingSession, updateTrainingSessionSet } from "@/lib/training/service";
import type { ScheduledWorkout, TrainingExercise, TrainingSession, TrainingSessionSet, WorkoutType } from "@/lib/training/types";
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from "@/lib/training/types";

type Filter = "all" | WorkoutType;

export default function TrainingWeek() {
  const { user, loading: authLoading } = useAuth();
  const [weekStart, setWeekStart] = useState(currentWeekRange().start);
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([]);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState("");
  const weekEnd = shiftDate(weekStart, 6);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [loadedSchedule, loadedExercises] = await Promise.all([loadTrainingSchedule(user.id, weekStart, weekEnd), loadTrainingExercises(user.id)]);
    setSchedule(loadedSchedule); setExercises(loadedExercises);
  }, [user, weekEnd, weekStart]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível. Entre novamente para acessar o Treino."); return; }
    let active = true;
    setLoading(true); setError("");
    void refresh().catch((loadError) => { if (active) setError(friendlyTrainingError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, refresh, user]);

  const filtered = schedule.filter((item) => filter === "all" || item.template?.workout_type === filter);
  const completed = schedule.filter((item) => item.status === "completed").length;
  const inProgress = schedule.filter((item) => item.status === "in_progress").length;

  async function openWorkout(item: ScheduledWorkout) {
    if (!user || opening) return;
    setOpening(item.id); setError("");
    try {
      const loaded = item.status === "completed" ? await loadLatestSessionForSchedule(user.id, item.id) : await loadTrainingSession(user.id, await startTrainingSession(item.id));
      if (!loaded) throw new Error("Training session not found");
      setSession(loaded);
      await refresh();
    } catch (openError) { setError(friendlyTrainingError(openError)); }
    finally { setOpening(null); }
  }

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando treinos da semana...</Card>;
  if (error && schedule.length === 0) return <Card className="flex items-start gap-3 border-red-400/20 p-5 text-[10px] text-red-300"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</Card>;
  if (!user) return null;

  return <div className="space-y-6">
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Planejados" value={String(schedule.length)} detail={`${formatTrainingDate(weekStart, { day: "2-digit", month: "short" })} – ${formatTrainingDate(weekEnd, { day: "2-digit", month: "short" })}`} Icon={Dumbbell} emphasis /><Metric label="Concluídos" value={`${completed}/${schedule.length}`} detail={schedule.length ? `${Math.round((completed / schedule.length) * 100)}% da agenda` : "sem agenda nesta semana"} Icon={CheckCircle2} /><Metric label="Em execução" value={String(inProgress)} detail="sessões que podem ser retomadas" Icon={Timer} /></section>
    <section>
      <SectionHeader eyebrow="Execução real" title={`Semana de ${formatTrainingDate(weekStart, { day: "2-digit", month: "short" })}`} action={<div className="flex gap-1"><button type="button" onClick={() => setWeekStart(shiftDate(weekStart, -7))} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><ChevronLeft size={14} /></button><button type="button" onClick={() => setWeekStart(shiftDate(weekStart, 7))} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><ChevronRight size={14} /></button></div>} />
      <div className="mb-3 flex flex-wrap gap-2">{(["all", "strength", "running", "mobility", "recovery"] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-8 rounded-full border px-3 text-[8px] font-semibold ${filter === value ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{value === "all" ? "Todos" : WORKOUT_TYPE_LABELS[value]}</button>)}</div>
      {filtered.length === 0 ? <Card className="p-8 text-center"><Dumbbell size={22} className="mx-auto text-ink-faint" /><p className="mt-3 text-[12px] font-semibold text-ink-secondary">Nenhum treino planejado</p><p className="mt-2 text-[9px] text-ink-muted">Use Plano / ciclos para adicionar uma ficha a esta semana.</p></Card> : <div className="space-y-2">{filtered.map((item) => <Card key={item.id} emphasis={item.status === "in_progress"} className="p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.template ? WORKOUT_TYPE_COLORS[item.template.workout_type] : "var(--text-faint)" }} /><div className="min-w-0"><p className="text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{formatTrainingDate(item.scheduled_date, { weekday: "long", day: "2-digit", month: "short" })} · {item.scheduled_time.slice(0, 5)}</p><p className="mt-1 text-[13px] font-semibold text-ink">{item.template?.name ?? "Ficha indisponível"}</p><p className="mt-1 text-[9px] text-ink-muted">{item.template ? `${WORKOUT_TYPE_LABELS[item.template.workout_type]} · ${item.template.exercises.length} exercícios` : ""}{item.cycle ? ` · ${item.cycle.name}` : ""}</p></div></div><span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold ${item.status === "completed" ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-300" : item.status === "in_progress" ? "border-line-accent bg-accent-subtle text-accent" : item.status === "skipped" ? "border-line text-ink-faint" : "border-line text-ink-muted"}`}>{item.status === "completed" ? "Concluído" : item.status === "in_progress" ? "Em execução" : item.status === "skipped" ? "Ignorado" : "Planejado"}</span>{item.status !== "skipped" && <button type="button" onClick={() => void openWorkout(item)} disabled={opening === item.id} className="apex-button-primary h-10 min-h-10 px-4 text-[9px]">{opening === item.id ? <LoaderCircle size={12} className="animate-spin" /> : item.status === "completed" ? <CheckCircle2 size={12} /> : item.status === "in_progress" ? <RefreshCw size={12} /> : <Play size={12} />}{item.status === "completed" ? "Ver sessão" : item.status === "in_progress" ? "Retomar" : "Iniciar"}</button>}</div></Card>)}</div>}
    </section>
    {session && <WorkoutExecution userId={user.id} session={session} exercises={exercises} onSessionChange={setSession} onClose={async () => { setSession(null); await refresh(); }} />}
  </div>;
}

function Metric({ label, value, detail, Icon, emphasis = false }: { label: string; value: string; detail: string; Icon: typeof Dumbbell; emphasis?: boolean }) { return <Card emphasis={emphasis} className="p-4"><div className="flex items-start justify-between"><p className="apex-kicker">{label}</p><IconTile Icon={Icon} active={emphasis} size="sm" /></div><p className={`mt-4 font-stat text-[24px] font-semibold ${emphasis ? "text-accent" : "text-ink"}`}>{value}</p><p className="mt-1 text-[8px] text-ink-muted">{detail}</p></Card>; }

function WorkoutExecution({ userId, session, exercises, onSessionChange, onClose }: { userId: string; session: TrainingSession; exercises: TrainingExercise[]; onSessionChange: (session: TrainingSession) => void; onClose: () => Promise<void> }) {
  const [values, setValues] = useState<Record<string, { reps: string; load: string }>>(() => Object.fromEntries(session.sets.map((set) => [set.id, { reps: set.actual_reps === null ? "" : String(set.actual_reps), load: set.actual_load_kg === null ? "" : String(set.actual_load_kg) }])));
  const [savingSet, setSavingSet] = useState<string | null>(null);
  const [notes, setNotes] = useState(session.notes);
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  useEffect(() => {
    if (!restRunning || restSeconds <= 0) return;
    const timer = window.setInterval(() => setRestSeconds((value) => value <= 1 ? 0 : value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [restRunning, restSeconds]);
  useEffect(() => { if (restSeconds === 0) setRestRunning(false); }, [restSeconds]);
  const groups = useMemo(() => {
    const result = new Map<string, TrainingSessionSet[]>();
    for (const set of session.sets) {
      const key = set.template_exercise_id ?? `${set.exercise_order}-${set.exercise_id ?? set.exercise_name_snapshot}`;
      result.set(key, [...(result.get(key) ?? []), set]);
    }
    return [...result.entries()].map(([key, sets]) => ({ key, sets: sets.sort((a, b) => a.set_order - b.set_order) })).sort((a, b) => a.sets[0].exercise_order - b.sets[0].exercise_order);
  }, [session.sets]);
  const completedSets = session.sets.filter((set) => set.is_completed).length;
  const readOnly = session.status === "completed";

  async function toggleSet(set: TrainingSessionSet) {
    if (readOnly || savingSet) return;
    const value = values[set.id] ?? { reps: "", load: "" };
    const reps = value.reps.trim() === "" ? null : Number(value.reps.replace(",", "."));
    const load = value.load.trim() === "" ? null : Number(value.load.replace(",", "."));
    if (reps !== null && (!Number.isFinite(reps) || reps < 0 || reps > 1000)) return setError("Use repetições entre 0 e 1000.");
    if (load !== null && (!Number.isFinite(load) || load < 0 || load > 1000)) return setError("Use carga entre 0 e 1000 kg.");
    setSavingSet(set.id); setError("");
    try {
      const updated = await updateTrainingSessionSet(userId, set.id, { actual_reps: reps, actual_load_kg: load, is_completed: !set.is_completed });
      onSessionChange({ ...session, sets: session.sets.map((item) => item.id === set.id ? updated : item) });
      if (!set.is_completed && set.rest_seconds > 0) { setRestSeconds(set.rest_seconds); setRestRunning(true); }
    } catch (saveError) { setError(friendlyTrainingError(saveError)); }
    finally { setSavingSet(null); }
  }

  async function replace(group: { key: string; sets: TrainingSessionSet[] }, replacementId: string) {
    const templateExerciseId = group.sets[0].template_exercise_id;
    if (!templateExerciseId || !replacementId || finishing) return;
    setFinishing(true); setError("");
    try { await replaceTrainingSessionExercise(session.id, templateExerciseId, replacementId); onSessionChange(await loadTrainingSession(userId, session.id)); }
    catch (replaceError) { setError(friendlyTrainingError(replaceError)); }
    finally { setFinishing(false); }
  }

  async function finish() {
    if (readOnly || finishing) return;
    if (completedSets < session.sets.length && !window.confirm(`Concluir com ${completedSets} de ${session.sets.length} séries registradas?`)) return;
    setFinishing(true); setError("");
    try { const duration = Math.max(1, Math.round((Date.now() - Date.parse(session.started_at)) / 60000)); await finishTrainingSession(session.id, duration, notes); await onClose(); }
    catch (finishError) { setError(friendlyTrainingError(finishError)); setFinishing(false); }
  }

  async function cancel() {
    if (readOnly || finishing || !window.confirm("Cancelar esta execução? As séries registradas permanecerão no histórico técnico da sessão cancelada.")) return;
    setFinishing(true); setError("");
    try { await cancelTrainingSession(session.id); await onClose(); }
    catch (cancelError) { setError(friendlyTrainingError(cancelError)); setFinishing(false); }
  }

  return <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><div className="flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-panel border border-line bg-surface-overlay shadow-float sm:max-w-5xl sm:rounded-panel"><div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5"><div><p className="apex-kicker">{readOnly ? "Sessão concluída" : "Execução do treino"}</p><h3 className="mt-2 text-[17px] font-semibold text-ink">{session.template_name_snapshot}</h3><p className="mt-1 text-[9px] text-ink-muted">{WORKOUT_TYPE_LABELS[session.workout_type_snapshot]} · {completedSets}/{session.sets.length} séries concluídas</p></div><div className="flex items-center gap-2">{!readOnly && restSeconds > 0 && <button type="button" onClick={() => setRestRunning((value) => !value)} className="flex min-h-9 items-center gap-2 rounded-control border border-line-accent bg-accent-subtle px-3 font-stat text-[10px] text-accent">{restRunning ? <Pause size={11} /> : <Play size={11} />}{Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, "0")}</button>}<button type="button" onClick={() => void onClose()} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><X size={14} /></button></div></div><div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
    {groups.map((group) => {
      const first = group.sets[0];
      const libraryItem = exercises.find((exercise) => exercise.id === first.exercise_id);
      const canReplace = !readOnly && Boolean(first.template_exercise_id) && group.sets.every((set) => !set.is_completed);
      const candidates = exercises.filter((exercise) => exercise.id !== first.exercise_id && (!libraryItem || exercise.category === libraryItem.category));
      return <Card key={group.key} className="overflow-hidden"><div className="border-b border-line-subtle p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[12px] font-semibold text-ink">{first.exercise_name_snapshot}</p>{libraryItem && <p className="mt-1 text-[8px] text-ink-muted">{libraryItem.primary_muscle_group}{libraryItem.equipment ? ` · ${libraryItem.equipment}` : ""}</p>}{libraryItem?.instructions && <p className="mt-2 max-w-2xl text-[8px] leading-relaxed text-ink-faint">{libraryItem.instructions}</p>}</div>{canReplace && candidates.length > 0 && <ReplacementPicker candidates={candidates} onReplace={(id) => void replace(group, id)} />}</div></div><div className="divide-y divide-line-subtle">{group.sets.map((set) => { const value = values[set.id] ?? { reps: "", load: "" }; return <div key={set.id} className="grid grid-cols-[34px_1fr_1fr_42px] items-end gap-2 p-3 sm:grid-cols-[50px_130px_130px_1fr_44px]"><div><p className="apex-kicker">Série</p><p className="mt-2 font-stat text-[11px] text-ink">{set.set_order}</p></div><Field label={`Reps · alvo ${set.target_reps}`}><input inputMode="numeric" value={value.reps} disabled={readOnly} onChange={(event) => setValues({ ...values, [set.id]: { ...value, reps: event.target.value } })} className="apex-input h-9 min-h-9 font-stat" /></Field><Field label={`Carga${set.target_load_kg !== null ? ` · ${set.target_load_kg} kg` : ""}`}><input inputMode="decimal" value={value.load} disabled={readOnly} onChange={(event) => setValues({ ...values, [set.id]: { ...value, load: event.target.value } })} className="apex-input h-9 min-h-9 font-stat" placeholder="kg" /></Field><p className="hidden pb-2 text-[8px] text-ink-muted sm:block">Intervalo: {set.rest_seconds}s</p><button type="button" disabled={readOnly || savingSet === set.id} onClick={() => void toggleSet(set)} aria-label={set.is_completed ? "Reabrir série" : "Concluir série"} className={`flex h-9 w-9 items-center justify-center rounded-control border ${set.is_completed ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-line text-ink-muted"}`}>{savingSet === set.id ? <LoaderCircle size={12} className="animate-spin" /> : set.is_completed ? <Check size={13} /> : <Circle size={13} />}</button></div>; })}</div></Card>;
    })}
    {groups.length === 0 && <Card className="p-8 text-center"><p className="text-[10px] text-ink-muted">Esta sessão não possui exercícios estruturados. Você ainda pode registrar duração e observações.</p></Card>}
    <Field label="Observações da sessão"><textarea value={notes} disabled={readOnly} onChange={(event) => setNotes(event.target.value)} rows={3} className="apex-input min-h-20 resize-y" placeholder="Como foi o treino?" /></Field>
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
  </div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4"><p className="text-[8px] text-ink-muted">Iniciado em {new Date(session.started_at).toLocaleString("pt-BR")}{readOnly && session.duration_minutes !== null ? ` · ${session.duration_minutes} min` : ""}</p><div className="flex gap-2">{!readOnly && <><button type="button" onClick={() => void cancel()} disabled={finishing} className="apex-button-secondary text-red-300">Cancelar execução</button><button type="button" onClick={() => void finish()} disabled={finishing} className="apex-button-primary">{finishing ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}Concluir treino</button></>}</div></div></div></div>;
}

function ReplacementPicker({ candidates, onReplace }: { candidates: TrainingExercise[]; onReplace: (id: string) => void }) {
  const [value, setValue] = useState(candidates[0]?.id ?? "");
  return <div className="flex shrink-0 gap-2"><select value={value} onChange={(event) => setValue(event.target.value)} className="apex-input h-9 min-h-9 max-w-52 text-[8px]">{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name_pt}</option>)}</select><button type="button" disabled={!value} onClick={() => onReplace(value)} className="apex-button-secondary h-9 min-h-9 px-3 text-[8px]">Trocar</button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block truncate text-[7px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
