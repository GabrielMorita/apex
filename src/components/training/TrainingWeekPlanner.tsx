"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Plus, Trash2 } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { friendlyTrainingError } from "@/lib/training/errors";
import { formatTrainingDate, isoDate, shiftDate } from "@/lib/training/date";
import { removeScheduledWorkout, scheduleTrainingWorkout, setScheduledWorkoutStatus } from "@/lib/training/service";
import type { ScheduleDraft, ScheduledWorkout, TrainingCycle, TrainingTemplate } from "@/lib/training/types";
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from "@/lib/training/types";

const STATUS_LABELS = { scheduled: "Planejado", in_progress: "Em execução", completed: "Concluído", skipped: "Ignorado" } as const;

export default function TrainingWeekPlanner({ userId, weekStart, templates, cycles, schedule, onWeekChange, onChanged }: { userId: string; weekStart: string; templates: TrainingTemplate[]; cycles: TrainingCycle[]; schedule: ScheduledWorkout[]; onWeekChange: (start: string) => void; onChanged: () => Promise<void> }) {
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index));
  const today = isoDate(new Date());

  async function add(draft: ScheduleDraft) {
    if (saving) return;
    setSaving(true); setError("");
    try { await scheduleTrainingWorkout(userId, draft); await onChanged(); setAddingDate(null); }
    catch (saveError) { setError(friendlyTrainingError(saveError)); }
    finally { setSaving(false); }
  }
  async function remove(item: ScheduledWorkout) {
    if (saving || !window.confirm(`Remover “${item.template?.name ?? "treino"}” do calendário?`)) return;
    setSaving(true); setError("");
    try { await removeScheduledWorkout(userId, item.id); await onChanged(); }
    catch (actionError) { setError(friendlyTrainingError(actionError)); }
    finally { setSaving(false); }
  }
  async function toggleSkipped(item: ScheduledWorkout) {
    if (saving) return;
    setSaving(true); setError("");
    try { await setScheduledWorkoutStatus(userId, item.id, item.status === "skipped" ? "scheduled" : "skipped"); await onChanged(); }
    catch (actionError) { setError(friendlyTrainingError(actionError)); }
    finally { setSaving(false); }
  }

  return <section>
    <SectionHeader eyebrow="Calendário" title={`Semana de ${formatTrainingDate(weekStart, { day: "2-digit", month: "short" })}`} action={<div className="flex gap-1"><button type="button" onClick={() => onWeekChange(shiftDate(weekStart, -7))} aria-label="Semana anterior" className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted hover:text-accent"><ChevronLeft size={14} /></button><button type="button" onClick={() => onWeekChange(shiftDate(weekStart, 7))} aria-label="Próxima semana" className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted hover:text-accent"><ChevronRight size={14} /></button></div>} />
    {error && <p className="mb-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    <div className="space-y-2">{days.map((date) => {
      const rows = schedule.filter((item) => item.scheduled_date === date);
      const isToday = date === today;
      return <Card key={date} emphasis={isToday} className="overflow-hidden"><div className="flex items-center gap-3 border-b border-line-subtle px-4 py-3"><div className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-control border ${isToday ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface text-ink-muted"}`}><span className="text-[7px] font-semibold uppercase">{formatTrainingDate(date, { weekday: "short" }).slice(0, 3)}</span><span className="font-stat text-[10px] font-semibold">{date.slice(8, 10)}</span></div><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold capitalize text-ink">{formatTrainingDate(date, { weekday: "long", day: "2-digit", month: "long" })}</p><p className="mt-0.5 text-[8px] text-ink-muted">{rows.length} {rows.length === 1 ? "treino planejado" : "treinos planejados"}</p></div><button type="button" onClick={() => { setAddingDate(date); setError(""); }} disabled={templates.length === 0} className="apex-button-secondary h-9 min-h-9 px-3 text-[9px]"><Plus size={12} />Adicionar</button></div><div className="space-y-2 p-3">{rows.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-control border border-line-subtle bg-surface p-3 sm:flex-row sm:items-center"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.template ? WORKOUT_TYPE_COLORS[item.template.workout_type] : "var(--text-faint)" }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold text-ink-secondary">{item.template?.name ?? "Ficha indisponível"}</p><span className="rounded-full border border-line px-2 py-0.5 text-[7px] text-ink-muted">{STATUS_LABELS[item.status]}</span></div><p className="mt-1 text-[8px] text-ink-muted"><Clock3 size={9} className="mr-1 inline" />{item.scheduled_time.slice(0, 5)}{item.template ? ` · ${WORKOUT_TYPE_LABELS[item.template.workout_type]}` : ""}{item.cycle ? ` · ${item.cycle.name}` : ""}</p></div>{(item.status === "scheduled" || item.status === "skipped") && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => void toggleSkipped(item)} className="min-h-8 text-[8px] font-semibold text-ink-muted hover:text-accent">{item.status === "skipped" ? "Reativar" : "Ignorar"}</button><button type="button" onClick={() => void remove(item)} aria-label="Remover do calendário" className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:text-red-300"><Trash2 size={11} /></button></div>}</div>)}{rows.length === 0 && <p className="py-2 text-center text-[8px] text-ink-faint">Sem treino neste dia.</p>}</div></Card>;
    })}</div>
    {addingDate && <ScheduleForm date={addingDate} templates={templates} cycles={cycles} saving={saving} error={error} onSave={(draft) => void add(draft)} onClose={() => { if (!saving) { setAddingDate(null); setError(""); } }} />}
  </section>;
}

function ScheduleForm({ date, templates, cycles, saving, error, onSave, onClose }: { date: string; templates: TrainingTemplate[]; cycles: TrainingCycle[]; saving: boolean; error: string; onSave: (draft: ScheduleDraft) => void; onClose: () => void }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [cycleId, setCycleId] = useState("");
  const [time, setTime] = useState("07:00");
  const [notes, setNotes] = useState("");
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><Card emphasis className="w-full rounded-b-none p-4 sm:max-w-lg sm:rounded-panel"><p className="apex-kicker">Adicionar ao calendário</p><h3 className="mt-2 text-[15px] font-semibold capitalize text-ink">{formatTrainingDate(date, { weekday: "long", day: "2-digit", month: "long" })}</h3><div className="mt-4 space-y-3"><Field label="Ficha"><select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="apex-input">{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Field><div className="grid grid-cols-2 gap-3"><Field label="Horário"><input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="apex-input" /></Field><Field label="Ciclo opcional"><select value={cycleId} onChange={(event) => setCycleId(event.target.value)} className="apex-input"><option value="">Sem ciclo</option>{cycles.filter((cycle) => cycle.status !== "archived").map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}</select></Field></div><Field label="Observação"><input value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} className="apex-input" /></Field>{error && <p className="text-[9px] text-red-300">{error}</p>}</div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="apex-button-secondary">Cancelar</button><button type="button" disabled={!templateId || saving} onClick={() => onSave({ template_id: templateId, cycle_id: cycleId || null, scheduled_date: date, scheduled_time: time, notes })} className="apex-button-primary">{saving ? "Salvando..." : "Adicionar"}</button></div></Card></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
