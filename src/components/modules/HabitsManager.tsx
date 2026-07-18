"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import LucideIcon from "@/components/ui/LucideIcon";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import { archiveHabit, loadHabits, saveHabit } from "@/lib/productivity/service";
import type { Habit, HabitCategory, HabitDraft, HabitFrequency } from "@/lib/productivity/types";

const COLORS = ["#FBBF24", "#F59E0B", "#F97316", "#EF4444", "#F43F5E", "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#6366F1", "#3B82F6", "#0EA5E9", "#06B6D4", "#14B8A6", "#10B981", "#22C55E", "#84CC16", "#A3E635", "#D4A373", "#94A3B8"];
const ICONS = ["BookOpen", "Dumbbell", "Activity", "Brain", "BookMarked", "Heart", "Flame", "Star", "Moon", "Sun", "Coffee", "Music", "Zap", "Target", "Trophy"];
const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const CATEGORY_LABELS: Record<HabitCategory, string> = { espiritual: "Espiritual", treino: "Treino", foco: "Foco", saude: "Saúde", aprendizado: "Aprendizado", pessoal: "Pessoal" };

const EMPTY: HabitDraft = { id: null, name: "", time: "07:00", period: "morning", category: "foco", color: "#FBBF24", lucideIcon: "Star", frequency: { type: "daily" }, weeklyGoal: 7, durationMinutes: 30, opensReadingLog: false };

function draftFromHabit(habit: Habit): HabitDraft { return { id: habit.id, name: habit.name, time: habit.time, period: habit.period, category: habit.category, color: habit.color, lucideIcon: habit.lucideIcon, frequency: habit.frequency, weeklyGoal: habit.weeklyGoal, durationMinutes: habit.durationMinutes, opensReadingLog: habit.opensReadingLog }; }

function frequencyLabel(frequency: HabitFrequency) {
  if (frequency.type === "daily") return "Diário";
  if (frequency.type === "xPerWeek") return `${frequency.times}x por semana`;
  return frequency.days.map((day) => DOW[day]).join(" · ");
}

export default function HabitsManager() {
  const { user, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [draft, setDraft] = useState<HabitDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => { if (!user) return; setHabits(await loadHabits(user.id)); }, [user]);
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível. Entre novamente."); return; }
    let active = true; setLoading(true); setError("");
    void refresh().catch((loadError) => { if (active) setError(friendlyProductivityError(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, refresh, user]);

  async function submit() {
    if (!user || !draft || saving) return;
    if (!draft.name.trim() || draft.name.trim().length > 120) return setError("Informe um nome de até 120 caracteres.");
    if (draft.frequency.type === "specificDays" && draft.frequency.days.length === 0) return setError("Escolha pelo menos um dia da semana.");
    if (draft.durationMinutes !== null && (draft.durationMinutes < 1 || draft.durationMinutes > 1440)) return setError("Use uma duração entre 1 e 1440 minutos.");
    setSaving(true); setError("");
    try { await saveHabit(user.id, { ...draft, name: draft.name.trim() }); await refresh(); window.dispatchEvent(new CustomEvent("apex-productivity-changed")); setDraft(null); }
    catch (saveError) { setError(friendlyProductivityError(saveError)); }
    finally { setSaving(false); }
  }

  async function remove(habit: Habit) {
    if (!user || saving || !window.confirm(`Arquivar o hábito “${habit.name}”? O histórico será preservado.`)) return;
    setSaving(true); setError("");
    try { await archiveHabit(user.id, habit.id); await refresh(); window.dispatchEvent(new CustomEvent("apex-productivity-changed")); }
    catch (removeError) { setError(friendlyProductivityError(removeError)); }
    finally { setSaving(false); }
  }

  if (loading) return <Card className="flex items-center gap-2 p-5 text-[10px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando hábitos...</Card>;

  return <section>
    <SectionHeader eyebrow="Planejamento pessoal" title="Hábitos" action={<button type="button" onClick={() => { setDraft({ ...EMPTY }); setError(""); }} className="apex-button-primary"><Plus size={13} />Novo hábito</button>} />
    <Card className="mb-4 p-4"><p className="text-[10px] leading-relaxed text-ink-muted">Crie sua rotina aqui. A execução aparece em Hoje e os resultados são derivados em Progresso.</p></Card>
    {error && !draft && <p className="mb-3 flex items-center gap-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300"><AlertCircle size={13} />{error}</p>}
    {habits.length === 0 ? <Card className="p-10 text-center"><p className="text-[12px] font-semibold text-ink-secondary">Nenhum hábito criado</p><p className="mt-2 text-[9px] text-ink-muted">Sua conta começa vazia. Crie somente os hábitos que fazem sentido para você.</p></Card> : <div className="grid gap-3 lg:grid-cols-2">{habits.map((habit) => <Card key={habit.id} className="p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border" style={{ background: `${habit.color}18`, borderColor: `${habit.color}40` }}><LucideIcon name={habit.lucideIcon} size={17} color={habit.color} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-ink">{habit.name}</p><p className="mt-1 text-[8px] text-ink-muted">{habit.time} · {frequencyLabel(habit.frequency)}{habit.durationMinutes ? ` · ${habit.durationMinutes} min` : ""}</p><p className="mt-2 text-[8px] text-ink-faint">{CATEGORY_LABELS[habit.category]} · meta {habit.weeklyGoal}x/semana</p></div><div className="flex gap-1"><button type="button" aria-label={`Editar ${habit.name}`} onClick={() => { setDraft(draftFromHabit(habit)); setError(""); }} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted"><Pencil size={12} /></button><button type="button" aria-label={`Arquivar ${habit.name}`} onClick={() => void remove(habit)} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:text-red-300"><Trash2 size={12} /></button></div></div></Card>)}</div>}
    {draft && <HabitForm draft={draft} setDraft={setDraft} saving={saving} error={error} onSave={() => void submit()} onClose={() => { if (!saving) { setDraft(null); setError(""); } }} />}
  </section>;
}

function HabitForm({ draft, setDraft, saving, error, onSave, onClose }: { draft: HabitDraft; setDraft: (draft: HabitDraft) => void; saving: boolean; error: string; onSave: () => void; onClose: () => void }) {
  const frequencyType = draft.frequency.type;
  function setFrequency(type: HabitFrequency["type"]) {
    const frequency: HabitFrequency = type === "daily" ? { type: "daily" } : type === "xPerWeek" ? { type: "xPerWeek", times: 3 } : { type: "specificDays", days: [1, 2, 3, 4, 5] };
    setDraft({ ...draft, frequency, weeklyGoal: type === "daily" ? 7 : type === "xPerWeek" ? 3 : 5 });
  }
  return <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><div className="max-h-[95vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-overlay shadow-float sm:max-w-3xl sm:rounded-panel"><div className="flex items-center justify-between border-b border-line p-4"><div><p className="apex-kicker">Configuração do hábito</p><h3 className="mt-2 text-[16px] font-semibold text-ink">{draft.id ? "Editar hábito" : "Novo hábito"}</h3></div><button type="button" onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><X size={14} /></button></div><div className="max-h-[calc(95vh-132px)] space-y-4 overflow-y-auto p-4 sm:p-5">
    <Field label="Nome"><input value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="apex-input" placeholder="Ex.: Meditar" /></Field>
    <div className="grid gap-3 sm:grid-cols-4"><Field label="Horário"><input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} className="apex-input" /></Field><Field label="Período"><select value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value as Habit["period"] })} className="apex-input"><option value="morning">Manhã</option><option value="afternoon">Tarde</option><option value="evening">Noite</option><option value="anytime">Qualquer horário</option></select></Field><Field label="Categoria"><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as HabitCategory })} className="apex-input">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Duração (min)"><input type="number" min={1} max={1440} value={draft.durationMinutes ?? ""} onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value === "" ? null : Number(event.target.value) })} className="apex-input" /></Field></div>
    <div><p className="apex-kicker mb-2">Cor</p><div className="grid grid-cols-10 gap-2">{COLORS.map((color) => <button key={color} type="button" onClick={() => setDraft({ ...draft, color })} aria-label={`Cor ${color}`} className="h-7 w-7 rounded-full" style={{ background: color, border: draft.color === color ? "2px solid white" : "2px solid transparent", outline: draft.color === color ? `2px solid ${color}` : "none" }} />)}</div></div>
    <div><p className="apex-kicker mb-2">Ícone</p><div className="flex flex-wrap gap-2">{ICONS.map((icon) => <button key={icon} type="button" onClick={() => setDraft({ ...draft, lucideIcon: icon })} className="flex h-9 w-9 items-center justify-center rounded-control border" style={{ borderColor: draft.lucideIcon === icon ? draft.color : "var(--border-default)", background: draft.lucideIcon === icon ? `${draft.color}18` : "transparent" }}><LucideIcon name={icon} size={14} color={draft.lucideIcon === icon ? draft.color : "var(--text-muted)"} /></button>)}</div></div>
    <div><p className="apex-kicker mb-2">Frequência</p><div className="mb-3 flex flex-wrap gap-2">{(["daily", "xPerWeek", "specificDays"] as HabitFrequency["type"][]).map((type) => <button key={type} type="button" onClick={() => setFrequency(type)} className={`rounded-control border px-3 py-2 text-[9px] font-semibold ${frequencyType === type ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{type === "daily" ? "Diário" : type === "xPerWeek" ? "X vezes por semana" : "Dias fixos"}</button>)}</div>{draft.frequency.type === "xPerWeek" && <Field label="Vezes por semana"><input type="number" min={1} max={7} value={draft.frequency.times} onChange={(event) => { const times = Math.min(7, Math.max(1, Number(event.target.value))); setDraft({ ...draft, frequency: { type: "xPerWeek", times }, weeklyGoal: times }); }} className="apex-input max-w-32" /></Field>}{draft.frequency.type === "specificDays" && <div className="flex flex-wrap gap-2">{DOW.map((day, index) => { const active = draft.frequency.type === "specificDays" && draft.frequency.days.includes(index); return <button key={day} type="button" onClick={() => { if (draft.frequency.type !== "specificDays") return; const days = active ? draft.frequency.days.filter((value) => value !== index) : [...draft.frequency.days, index].sort(); setDraft({ ...draft, frequency: { type: "specificDays", days }, weeklyGoal: Math.max(1, days.length) }); }} className={`rounded-control border px-3 py-2 text-[9px] ${active ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{day}</button>; })}</div>}</div>
    <label className="flex items-start gap-3 rounded-control border border-line p-3"><input type="checkbox" checked={draft.opensReadingLog} onChange={(event) => setDraft({ ...draft, opensReadingLog: event.target.checked })} className="mt-0.5" /><span><span className="block text-[10px] font-semibold text-ink-secondary">Abrir registro de leitura ao concluir</span><span className="mt-1 block text-[8px] text-ink-muted">Use em um hábito ligado à Biblioteca de leitura.</span></span></label>
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-line p-4"><button type="button" onClick={onClose} disabled={saving} className="apex-button-secondary">Cancelar</button><button type="button" onClick={onSave} disabled={saving} className="apex-button-primary">{saving ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}{saving ? "Salvando..." : "Salvar hábito"}</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
