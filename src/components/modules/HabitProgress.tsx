"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Flame, LoaderCircle, Minus, Plus, SlidersHorizontal, Target } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import LucideIcon from "@/components/ui/LucideIcon";
import ProgressRing from "@/components/ui/ProgressRing";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { currentWeekDates, doneCount, habitStreak, isoDate, shiftDate } from "@/lib/productivity/date";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import { loadHabitEntries, loadHabits, saveHabit } from "@/lib/productivity/service";
import type { Habit, HabitDraft, HabitEntry } from "@/lib/productivity/types";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function HabitProgress() {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const week = useMemo(() => currentWeekDates(), []);
  const today = isoDate(new Date());

  const refresh = useCallback(async () => {
    if (!user) return;
    const [loadedHabits, loadedEntries] = await Promise.all([loadHabits(user.id), loadHabitEntries(user.id, shiftDate(today, -90), today)]);
    setHabits(loadedHabits); setEntries(loadedEntries);
  }, [today, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível."); return; }
    let active = true; setLoading(true); setError("");
    void refresh().catch((loadError) => { if (active) setError(friendlyProductivityError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, refresh, user]);

  async function changeGoal(habit: Habit, goal: number) {
    if (!user || saving) return; setSaving(habit.id); setError("");
    const draft: HabitDraft = { id: habit.id, name: habit.name, time: habit.time, period: habit.period, category: habit.category, color: habit.color, lucideIcon: habit.lucideIcon, frequency: habit.frequency, weeklyGoal: goal, durationMinutes: habit.durationMinutes, opensReadingLog: habit.opensReadingLog };
    try { await saveHabit(user.id, draft); await refresh(); window.dispatchEvent(new CustomEvent("apex-productivity-changed")); }
    catch (saveError) { setError(friendlyProductivityError(saveError)); }
    finally { setSaving(null); }
  }

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando progresso dos hábitos...</Card>;
  if (error && habits.length === 0) return <Card className="flex items-center gap-2 p-5 text-[10px] text-red-300"><AlertCircle size={14} />{error}</Card>;

  const totalDone = habits.reduce((sum, habit) => sum + doneCount(entries, habit.id, week), 0);
  const totalGoal = habits.reduce((sum, habit) => sum + habit.weeklyGoal, 0);
  const onTrack = habits.filter((habit) => doneCount(entries, habit.id, week) >= habit.weeklyGoal).length;
  const bestStreak = Math.max(0, ...habits.map((habit) => habitStreak(entries, habit.id, today)));

  return <div className="space-y-6">
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    <Card emphasis className="p-5"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><ProgressRing done={totalDone} goal={totalGoal} color="#e3ad52" size={136} stroke={13} label="semana" /><div className="grid flex-1 grid-cols-3 gap-3"><Metric value={`${totalDone}/${totalGoal}`} label="execuções" Icon={Target} /><Metric value={String(onTrack)} label="metas batidas" Icon={Check} /><Metric value={String(bestStreak)} label="melhor sequência" Icon={Flame} /></div></div></Card>
    <section><SectionHeader eyebrow="Dados reais da semana" title="Hábitos e metas" />{habits.length === 0 ? <Card className="p-10 text-center"><p className="text-[12px] font-semibold text-ink-secondary">Nenhum hábito para acompanhar</p><p className="mt-2 text-[9px] text-ink-muted">Crie hábitos em Planejamento.</p></Card> : <div className="space-y-3">{habits.map((habit) => { const done = doneCount(entries, habit.id, week); const streak = habitStreak(entries, habit.id, today); return <Card key={habit.id} className="p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 items-center gap-3 lg:w-52"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border" style={{ background: `${habit.color}18`, borderColor: `${habit.color}35` }}><LucideIcon name={habit.lucideIcon} size={16} color={habit.color} /></span><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-ink">{habit.name}</p><p className="mt-1 text-[8px] text-ink-muted">{streak} dia(s) de sequência</p></div></div><div className="flex flex-1 justify-center gap-1.5">{week.map((date, index) => { const status = entries.find((entry) => entry.habitId === habit.id && entry.date === date)?.status ?? "pending"; return <div key={date} className="text-center"><p className="mb-1 text-[7px] text-ink-faint">{DAY_LABELS[index]}</p><span className="flex h-8 w-8 items-center justify-center rounded-control border text-[10px]" style={{ color: status === "done" ? habit.color : "var(--text-faint)", borderColor: date === today ? habit.color : "var(--border-default)", background: status === "done" ? `${habit.color}18` : "transparent" }}>{status === "done" ? "✓" : status === "skipped" ? "—" : ""}</span></div>; })}</div><GoalControl habit={habit} done={done} saving={saving === habit.id} onChange={(goal) => void changeGoal(habit, goal)} /></div></Card>; })}</div>}</section>
  </div>;
}

function GoalControl({ habit, done, saving, onChange }: { habit: Habit; done: number; saving: boolean; onChange: (goal: number) => void }) {
  const [editing, setEditing] = useState(false); const [value, setValue] = useState(habit.weeklyGoal);
  if (!editing) return <button type="button" onClick={() => setEditing(true)} className="flex min-h-10 items-center gap-2 rounded-control border border-line px-3 text-left"><span className="font-stat text-[12px]" style={{ color: habit.color }}>{done}/{habit.weeklyGoal}</span><span className="text-[7px] uppercase text-ink-muted">meta</span><SlidersHorizontal size={11} className="text-ink-faint" /></button>;
  return <div className="flex items-center gap-1 rounded-control border border-line-accent bg-accent-subtle p-1"><button type="button" onClick={() => setValue(Math.max(1, value - 1))} className="flex h-8 w-8 items-center justify-center"><Minus size={12} /></button><span className="w-7 text-center font-stat text-[12px] text-accent">{value}</span><button type="button" onClick={() => setValue(Math.min(7, value + 1))} className="flex h-8 w-8 items-center justify-center"><Plus size={12} /></button><button type="button" disabled={saving} onClick={() => { onChange(value); setEditing(false); }} className="flex h-8 w-8 items-center justify-center rounded-control bg-accent text-black">{saving ? <LoaderCircle size={11} className="animate-spin" /> : <Check size={12} />}</button></div>;
}

function Metric({ value, label, Icon }: { value: string; label: string; Icon: typeof Target }) { return <div className="rounded-control border border-line bg-surface p-3 text-center"><Icon size={14} className="mx-auto text-accent" /><p className="mt-2 font-stat text-[18px] font-semibold text-ink">{value}</p><p className="mt-1 text-[7px] uppercase text-ink-muted">{label}</p></div>; }
