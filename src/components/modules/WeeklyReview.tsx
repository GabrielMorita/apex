"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { currentWeekDates, doneCount } from "@/lib/productivity/date";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import { loadHabitEntries, loadHabits, loadWeeklyReview, saveWeeklyReview } from "@/lib/productivity/service";
import { loadTrainingSchedule } from "@/lib/training/service";

const QUESTIONS = [
  { id: "vitoria", label: "Qual foi sua maior vitória da semana?" },
  { id: "aprendido", label: "O que você aprendeu sobre si mesmo?" },
  { id: "melhorar", label: "O que pode melhorar na próxima semana?" },
  { id: "gratidao", label: "Pelo que você é grato esta semana?" },
  { id: "foco", label: "Qual será o foco da próxima semana?" },
];

export default function WeeklyReview() {
  const { user, loading: authLoading } = useAuth();
  const week = useMemo(() => currentWeekDates(), []);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState({ habitDone: 0, habitGoal: 0, trainingDone: 0, trainingTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível."); return; }
    let active = true; setLoading(true); setError("");
    void Promise.all([loadWeeklyReview(user.id, week[0]), loadHabits(user.id), loadHabitEntries(user.id, week[0], week[6]), loadTrainingSchedule(user.id, week[0], week[6])])
      .then(([review, habits, entries, training]) => { if (!active) return; setAnswers(review?.answers ?? {}); setSummary({ habitDone: habits.reduce((sum, habit) => sum + doneCount(entries, habit.id, week), 0), habitGoal: habits.reduce((sum, habit) => sum + habit.weeklyGoal, 0), trainingDone: training.filter((item) => item.status === "completed").length, trainingTotal: training.length }); })
      .catch((loadError) => { if (active) setError(friendlyProductivityError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user, week]);

  async function submit() {
    if (!user || saving) return; setSaving(true); setSaved(false); setError("");
    try { await saveWeeklyReview(user.id, { weekStart: week[0], answers, updatedAt: new Date().toISOString() }); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }
    catch (saveError) { setError(friendlyProductivityError(saveError)); }
    finally { setSaving(false); }
  }

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando revisão...</Card>;

  const consistency = summary.habitGoal ? Math.round((summary.habitDone / summary.habitGoal) * 100) : 0;
  return <div className="mx-auto max-w-3xl space-y-7">
    {error && <p className="flex items-center gap-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300"><AlertCircle size={13} />{error}</p>}
    <section><SectionHeader eyebrow={`${week[0]} a ${week[6]}`} title="Resumo real da semana" /><div className="grid grid-cols-3 gap-3"><Summary value={`${consistency}%`} label="Consistência" /><Summary value={`${summary.habitDone}/${summary.habitGoal}`} label="Hábitos" /><Summary value={`${summary.trainingDone}/${summary.trainingTotal}`} label="Treinos" /></div></section>
    <section><SectionHeader eyebrow="Reflexão persistente" title="Transforme sinais em ajustes" /><div className="space-y-3">{QUESTIONS.map((question) => <Card key={question.id} className="p-4"><label className="block"><span className="mb-2 block text-[10px] font-semibold text-ink-secondary">{question.label}</span><textarea rows={3} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} maxLength={4000} className="apex-input min-h-24 resize-y" placeholder="Escreva aqui..." /></label></Card>)}</div></section>
    <button type="button" onClick={() => void submit()} disabled={saving} className={`apex-button-primary w-full ${saved ? "bg-emerald-500" : ""}`}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}{saving ? "Salvando..." : saved ? "Revisão salva" : "Salvar revisão"}</button>
  </div>;
}

function Summary({ value, label }: { value: string; label: string }) { return <Card className="p-4 text-center"><p className="font-stat text-[22px] font-semibold text-accent">{value}</p><p className="mt-1 text-[8px] uppercase text-ink-muted">{label}</p></Card>; }
