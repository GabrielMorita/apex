"use client";

import { useState } from "react";
import { CalendarRange, Pencil, Plus } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { friendlyTrainingError } from "@/lib/training/errors";
import { saveTrainingCycle } from "@/lib/training/service";
import type { CycleDraft, CycleStatus, TrainingCycle } from "@/lib/training/types";
import { formatTrainingDate, isoDate, shiftDate } from "@/lib/training/date";

const STATUS_LABELS: Record<CycleStatus, string> = { planned: "Planejado", active: "Ativo", completed: "Concluído", archived: "Arquivado" };

function blankCycle(): CycleDraft {
  const today = isoDate(new Date());
  return { id: null, name: "", goal: "", start_date: today, end_date: shiftDate(today, 27), status: "planned", notes: "" };
}

function cycleDraft(cycle: TrainingCycle): CycleDraft { return { id: cycle.id, name: cycle.name, goal: cycle.goal, start_date: cycle.start_date, end_date: cycle.end_date, status: cycle.status, notes: cycle.notes }; }

export default function TrainingCycleManager({ userId, cycles, onChanged }: { userId: string; cycles: TrainingCycle[]; onChanged: () => Promise<void> }) {
  const [draft, setDraft] = useState<CycleDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (!draft || saving) return;
    if (draft.name.trim().length < 2 || draft.name.trim().length > 120) return setError("Use um nome entre 2 e 120 caracteres.");
    if (!draft.start_date || !draft.end_date || draft.end_date < draft.start_date) return setError("A data final deve ser igual ou posterior à inicial.");
    setSaving(true); setError("");
    try { await saveTrainingCycle(userId, draft); await onChanged(); setDraft(null); }
    catch (saveError) { setError(friendlyTrainingError(saveError)); }
    finally { setSaving(false); }
  }
  async function archive(cycle: TrainingCycle) {
    if (saving || !window.confirm(`Arquivar o ciclo “${cycle.name}”?`)) return;
    setSaving(true); setError("");
    try { await saveTrainingCycle(userId, { ...cycleDraft(cycle), status: "archived" }); await onChanged(); }
    catch (saveError) { setError(friendlyTrainingError(saveError)); }
    finally { setSaving(false); }
  }
  return <section>
    <SectionHeader eyebrow="Planejamento por período" title="Ciclos de treino" action={<button type="button" onClick={() => { setDraft(blankCycle()); setError(""); }} className="apex-button-primary h-10 min-h-10 px-3 text-[9px]"><Plus size={13} />Novo ciclo</button>} />
    {error && !draft && <p className="mb-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    {cycles.length === 0 ? <Card className="p-8 text-center"><CalendarRange size={22} className="mx-auto text-ink-faint" /><p className="mt-3 text-[12px] font-semibold text-ink-secondary">Nenhum ciclo criado</p><p className="mt-2 text-[9px] text-ink-muted">Ciclos agrupam semanas por período e objetivo definido por você.</p></Card> : <div className="grid gap-3 lg:grid-cols-2">{cycles.map((cycle) => <Card key={cycle.id} emphasis={cycle.status === "active"} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="text-[13px] font-semibold text-ink">{cycle.name}</p><span className="rounded-full border border-line px-2 py-0.5 text-[7px] font-semibold uppercase text-ink-muted">{STATUS_LABELS[cycle.status]}</span></div><p className="mt-1 text-[9px] text-ink-muted">{formatTrainingDate(cycle.start_date, { day: "2-digit", month: "short", year: "numeric" })} – {formatTrainingDate(cycle.end_date, { day: "2-digit", month: "short", year: "numeric" })}</p></div><button type="button" onClick={() => { setDraft(cycleDraft(cycle)); setError(""); }} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:text-accent"><Pencil size={12} /></button></div>{cycle.goal && <p className="mt-3 text-[9px] leading-relaxed text-ink-secondary"><span className="text-ink-faint">Objetivo: </span>{cycle.goal}</p>}{cycle.notes && <p className="mt-2 text-[8px] leading-relaxed text-ink-muted">{cycle.notes}</p>}<button type="button" onClick={() => void archive(cycle)} className="mt-3 text-[8px] font-semibold text-ink-faint hover:text-red-300">Arquivar ciclo</button></Card>)}</div>}
    {draft && <CycleForm draft={draft} setDraft={setDraft} saving={saving} error={error} onSave={() => void save()} onClose={() => { if (!saving) { setDraft(null); setError(""); } }} />}
  </section>;
}

function CycleForm({ draft, setDraft, saving, error, onSave, onClose }: { draft: CycleDraft; setDraft: (draft: CycleDraft) => void; saving: boolean; error: string; onSave: () => void; onClose: () => void }) {
  return <Card emphasis className="fixed inset-x-4 bottom-4 z-[100] max-h-[90vh] overflow-y-auto p-4 shadow-float sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2"><p className="apex-kicker">Plano / ciclos</p><h3 className="mt-2 text-[15px] font-semibold text-ink">{draft.id ? "Editar ciclo" : "Novo ciclo"}</h3><div className="mt-4 space-y-3"><Field label="Nome"><input value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="apex-input" /></Field><Field label="Objetivo do ciclo"><input value={draft.goal} maxLength={240} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} className="apex-input" placeholder="Definido por você" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Início"><input type="date" value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} className="apex-input" /></Field><Field label="Fim"><input type="date" value={draft.end_date} onChange={(event) => setDraft({ ...draft, end_date: event.target.value })} className="apex-input" /></Field></div><Field label="Status"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CycleStatus })} className="apex-input"><option value="planned">Planejado</option><option value="active">Ativo</option><option value="completed">Concluído</option><option value="archived">Arquivado</option></select></Field><Field label="Observações"><textarea rows={3} value={draft.notes} maxLength={1000} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="apex-input min-h-20 resize-y" /></Field>{error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}</div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="apex-button-secondary">Cancelar</button><button type="button" onClick={onSave} disabled={saving} className="apex-button-primary">{saving ? "Salvando..." : "Salvar ciclo"}</button></div></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
