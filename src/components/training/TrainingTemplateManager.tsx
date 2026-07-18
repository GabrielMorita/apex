"use client";

import { useMemo, useState } from "react";
import { Copy, Dumbbell, Pencil, Plus, Trash2, X } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { duplicateTrainingTemplate, saveTrainingTemplate, setTrainingTemplateArchived } from "@/lib/training/service";
import { friendlyTrainingError } from "@/lib/training/errors";
import type { TemplateDraft, TemplateExerciseInput, TrainingExercise, TrainingTemplate, WorkoutType } from "@/lib/training/types";
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from "@/lib/training/types";

const EMPTY_DRAFT: TemplateDraft = { id: null, name: "", workout_type: "strength", description: "", exercises: [] };

function templateDraft(template: TrainingTemplate): TemplateDraft {
  return {
    id: template.id,
    name: template.name,
    workout_type: template.workout_type,
    description: template.description,
    exercises: template.exercises.map((item) => ({ exercise_id: item.exercise_id, target_sets: item.target_sets, target_reps: item.target_reps, target_load_kg: item.target_load_kg, rest_seconds: item.rest_seconds, notes: item.notes })),
  };
}

export default function TrainingTemplateManager({ userId, templates, exercises, onChanged }: { userId: string; templates: TrainingTemplate[]; exercises: TrainingExercise[]; onChanged: () => Promise<void> }) {
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!draft || saving) return;
    if (draft.name.trim().length < 2 || draft.name.trim().length > 120) return setError("Use um nome entre 2 e 120 caracteres.");
    if (new Set(draft.exercises.map((item) => item.exercise_id)).size !== draft.exercises.length) return setError("Não repita o mesmo exercício na ficha.");
    if (draft.exercises.some((item) => item.target_sets < 1 || item.target_sets > 20 || item.target_reps < 1 || item.target_reps > 1000 || item.rest_seconds < 0 || item.rest_seconds > 3600 || (item.target_load_kg !== null && (item.target_load_kg < 0 || item.target_load_kg > 1000)))) return setError("Revise séries, repetições, carga e intervalo.");
    setSaving(true);
    setError("");
    try {
      await saveTrainingTemplate(draft);
      await onChanged();
      setDraft(null);
    } catch (saveError) {
      setError(friendlyTrainingError(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(templateId: string) {
    if (saving) return;
    setSaving(true);
    setError("");
    try { await duplicateTrainingTemplate(templateId); await onChanged(); }
    catch (actionError) { setError(friendlyTrainingError(actionError)); }
    finally { setSaving(false); }
  }

  async function archive(template: TrainingTemplate) {
    if (saving || !window.confirm(`Arquivar a ficha “${template.name}”? Treinos já realizados serão preservados.`)) return;
    setSaving(true);
    setError("");
    try { await setTrainingTemplateArchived(userId, template.id, true); await onChanged(); }
    catch (actionError) { setError(friendlyTrainingError(actionError)); }
    finally { setSaving(false); }
  }

  return <section>
    <SectionHeader eyebrow="Fichas privadas" title="Fichas de treino" action={<button type="button" onClick={() => { setDraft({ ...EMPTY_DRAFT, exercises: [] }); setError(""); }} className="apex-button-primary h-10 min-h-10 px-3 text-[9px]"><Plus size={13} />Nova ficha</button>} />
    {error && !draft && <p className="mb-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    {templates.length === 0 ? <Card className="p-8 text-center"><Dumbbell size={22} className="mx-auto text-ink-faint" /><p className="mt-3 text-[12px] font-semibold text-ink-secondary">Nenhuma ficha criada</p><p className="mt-2 text-[9px] text-ink-muted">Crie uma ficha e depois distribua-a no calendário semanal.</p></Card> : <div className="grid gap-3 lg:grid-cols-2">
      {templates.map((template) => <Card key={template.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: WORKOUT_TYPE_COLORS[template.workout_type] }}>{WORKOUT_TYPE_LABELS[template.workout_type]}</p><p className="mt-1 text-[13px] font-semibold text-ink">{template.name}</p><p className="mt-1 text-[9px] leading-relaxed text-ink-muted">{template.description || "Sem descrição"}</p></div><div className="flex shrink-0 gap-1"><ActionButton label="Editar ficha" onClick={() => { setDraft(templateDraft(template)); setError(""); }}><Pencil size={12} /></ActionButton><ActionButton label="Duplicar ficha" onClick={() => void duplicate(template.id)}><Copy size={12} /></ActionButton><ActionButton label="Arquivar ficha" danger onClick={() => void archive(template)}><Trash2 size={12} /></ActionButton></div></div><div className="mt-4 space-y-1.5">{template.exercises.length === 0 ? <p className="text-[8px] text-ink-faint">Sessão sem exercícios estruturados.</p> : template.exercises.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-control border border-line-subtle bg-surface px-3 py-2"><span className="truncate text-[9px] text-ink-secondary">{item.exercise?.name_pt ?? "Exercício indisponível"}</span><span className="shrink-0 font-stat text-[8px] text-ink-muted">{item.target_sets}×{item.target_reps}{item.target_load_kg !== null ? ` · ${item.target_load_kg} kg` : ""} · {item.rest_seconds}s</span></div>)}</div></Card>)}
    </div>}
    {draft && <TemplateForm draft={draft} setDraft={setDraft} exercises={exercises} saving={saving} error={error} onSave={() => void save()} onClose={() => { if (!saving) { setDraft(null); setError(""); } }} />}
  </section>;
}

function ActionButton({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover ${danger ? "hover:text-red-300" : "hover:text-accent"}`}>{children}</button>;
}

function TemplateForm({ draft, setDraft, exercises, saving, error, onSave, onClose }: { draft: TemplateDraft; setDraft: (draft: TemplateDraft) => void; exercises: TrainingExercise[]; saving: boolean; error: string; onSave: () => void; onClose: () => void }) {
  const available = useMemo(() => exercises.filter((exercise) => exercise.is_active), [exercises]);
  const addExercise = () => {
    const candidate = available.find((exercise) => !draft.exercises.some((item) => item.exercise_id === exercise.id));
    if (!candidate) return;
    setDraft({ ...draft, exercises: [...draft.exercises, { exercise_id: candidate.id, target_sets: 3, target_reps: 10, target_load_kg: null, rest_seconds: 60, notes: "" }] });
  };
  const updateItem = (index: number, patch: Partial<TemplateExerciseInput>) => setDraft({ ...draft, exercises: draft.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="template-form-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-[95vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-overlay shadow-float sm:max-w-4xl sm:rounded-panel"><div className="flex items-start justify-between border-b border-line p-4 sm:p-5"><div><p className="apex-kicker">Ficha de treino</p><h3 id="template-form-title" className="mt-2 text-[16px] font-semibold text-ink">{draft.id ? "Editar ficha" : "Nova ficha"}</h3></div><button type="button" onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><X size={15} /></button></div><div className="max-h-[calc(95vh-132px)] space-y-4 overflow-y-auto p-4 sm:p-5">
    <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><Field label="Nome"><input value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="apex-input" placeholder="Ex.: Força — superiores" /></Field><Field label="Tipo"><select value={draft.workout_type} onChange={(event) => setDraft({ ...draft, workout_type: event.target.value as WorkoutType })} className="apex-input"><option value="strength">Musculação</option><option value="running">Corrida</option><option value="mobility">Mobilidade</option><option value="recovery">Recuperação</option></select></Field></div>
    <Field label="Descrição"><textarea value={draft.description} maxLength={500} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={2} className="apex-input min-h-20 resize-y" placeholder="Objetivo e orientações desta ficha" /></Field>
    <div className="rounded-card border border-line bg-surface p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold text-ink-secondary">Exercícios</p><p className="mt-1 text-[8px] text-ink-muted">Escolha na Biblioteca e ajuste séries, repetições, carga e intervalo.</p></div><button type="button" onClick={addExercise} disabled={available.length === draft.exercises.length} className="apex-button-secondary h-9 min-h-9 px-3 text-[9px]"><Plus size={12} />Adicionar</button></div><div className="mt-3 space-y-3">{draft.exercises.map((item, index) => <div key={`${item.exercise_id}-${index}`} className="rounded-control border border-line-subtle bg-surface-raised p-3"><div className="flex items-center gap-2"><span className="font-stat text-[9px] text-ink-faint">{index + 1}</span><select value={item.exercise_id} onChange={(event) => updateItem(index, { exercise_id: event.target.value })} className="apex-input min-w-0 flex-1">{available.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name_pt}{exercise.source_type === "custom" ? " · Pessoal" : ""}</option>)}</select><button type="button" onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((_, itemIndex) => itemIndex !== index) })} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:text-red-300"><Trash2 size={12} /></button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><NumberField label="Séries" value={item.target_sets} min={1} max={20} onChange={(value) => updateItem(index, { target_sets: value })} /><NumberField label="Repetições" value={item.target_reps} min={1} max={1000} onChange={(value) => updateItem(index, { target_reps: value })} /><NullableNumberField label="Carga (kg)" value={item.target_load_kg} min={0} max={1000} onChange={(value) => updateItem(index, { target_load_kg: value })} /><NumberField label="Intervalo (s)" value={item.rest_seconds} min={0} max={3600} onChange={(value) => updateItem(index, { rest_seconds: value })} /></div><input value={item.notes} maxLength={240} onChange={(event) => updateItem(index, { notes: event.target.value })} className="apex-input mt-2" placeholder="Observação opcional" /></div>)}{draft.exercises.length === 0 && <p className="py-5 text-center text-[9px] text-ink-muted">Nenhum exercício adicionado.</p>}</div></div>
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-line p-4"><button type="button" onClick={onClose} disabled={saving} className="apex-button-secondary">Cancelar</button><button type="button" onClick={onSave} disabled={saving} className="apex-button-primary">{saving ? "Salvando..." : "Salvar ficha"}</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <Field label={label}><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} className="apex-input font-stat" /></Field>; }
function NullableNumberField({ label, value, min, max, onChange }: { label: string; value: number | null; min: number; max: number; onChange: (value: number | null) => void }) { return <Field label={label}><input type="number" value={value ?? ""} min={min} max={max} step="0.5" onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} className="apex-input font-stat" placeholder="Livre" /></Field>; }
