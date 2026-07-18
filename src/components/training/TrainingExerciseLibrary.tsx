"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { friendlyTrainingError } from "@/lib/training/errors";
import { saveCustomTrainingExercise, setCustomExerciseArchived } from "@/lib/training/service";
import type { ExerciseCategory, ExerciseDraft, TrainingExercise } from "@/lib/training/types";

const EMPTY: ExerciseDraft = { id: null, name_pt: "", category: "strength", primary_muscle_group: "", equipment: "", instructions: "", video_url: "" };
const CATEGORY_LABELS: Record<ExerciseCategory, string> = { strength: "Força", cardio: "Cardio", mobility: "Mobilidade" };

export default function TrainingExerciseLibrary({ userId, exercises, onChanged }: { userId: string; exercises: TrainingExercise[]; onChanged: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "all">("all");
  const [draft, setDraft] = useState<ExerciseDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visible = useMemo(() => exercises.filter((exercise) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (category === "all" || exercise.category === category) && (!term || `${exercise.name_pt} ${exercise.primary_muscle_group} ${exercise.equipment}`.toLocaleLowerCase("pt-BR").includes(term));
  }), [category, exercises, search]);

  async function save() {
    if (!draft || saving) return;
    if (draft.name_pt.trim().length < 2 || draft.name_pt.trim().length > 120) return setError("Use um nome entre 2 e 120 caracteres.");
    if (draft.video_url.trim() && !/^https?:\/\//i.test(draft.video_url.trim())) return setError("O vídeo deve usar um endereço iniciado por http:// ou https://.");
    setSaving(true); setError("");
    try { await saveCustomTrainingExercise(userId, draft); await onChanged(); setDraft(null); }
    catch (saveError) { setError(friendlyTrainingError(saveError)); }
    finally { setSaving(false); }
  }

  async function archive(exercise: TrainingExercise) {
    if (saving || !window.confirm(`Arquivar “${exercise.name_pt}”? As fichas existentes serão preservadas.`)) return;
    setSaving(true); setError("");
    try { await setCustomExerciseArchived(userId, exercise.id, true); await onChanged(); }
    catch (actionError) { setError(friendlyTrainingError(actionError)); }
    finally { setSaving(false); }
  }

  return <section>
    <SectionHeader eyebrow="Referência e itens pessoais" title="Biblioteca de exercícios" action={<button type="button" onClick={() => { setDraft({ ...EMPTY }); setError(""); }} className="apex-button-primary h-10 min-h-10 px-3 text-[9px]"><Plus size={13} />Novo exercício</button>} />
    <Card className="mb-4 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_180px]"><label className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="apex-input pl-9" placeholder="Buscar exercício, grupo ou equipamento" /></label><select value={category} onChange={(event) => setCategory(event.target.value as ExerciseCategory | "all")} className="apex-input"><option value="all">Todas as categorias</option><option value="strength">Força</option><option value="cardio">Cardio</option><option value="mobility">Mobilidade</option></select></div></Card>
    {error && !draft && <p className="mb-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
    <div className="grid gap-3 lg:grid-cols-2">{visible.map((exercise) => <Card key={exercise.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold text-ink">{exercise.name_pt}</p><span className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold uppercase ${exercise.source_type === "custom" ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{exercise.source_type === "custom" ? "Pessoal" : "Referência"}</span></div><p className="mt-1 text-[8px] text-ink-muted">{CATEGORY_LABELS[exercise.category]}{exercise.primary_muscle_group ? ` · ${exercise.primary_muscle_group}` : ""}{exercise.equipment ? ` · ${exercise.equipment}` : ""}</p></div>{exercise.user_id === userId && <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Editar ${exercise.name_pt}`} onClick={() => { setDraft({ id: exercise.id, name_pt: exercise.name_pt, category: exercise.category, primary_muscle_group: exercise.primary_muscle_group, equipment: exercise.equipment, instructions: exercise.instructions, video_url: exercise.video_url ?? "" }); setError(""); }} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:text-accent"><Pencil size={12} /></button><button type="button" aria-label={`Arquivar ${exercise.name_pt}`} onClick={() => void archive(exercise)} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:text-red-300"><Trash2 size={12} /></button></div>}</div>{exercise.instructions && <p className="mt-3 text-[8px] leading-relaxed text-ink-muted">{exercise.instructions}</p>}{exercise.video_url && <a href={exercise.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[8px] font-semibold text-accent">Abrir vídeo <ExternalLink size={10} /></a>}</Card>)}{visible.length === 0 && <Card className="col-span-full p-8 text-center"><p className="text-[10px] text-ink-muted">Nenhum exercício corresponde aos filtros.</p></Card>}</div>
    {draft && <ExerciseForm draft={draft} setDraft={setDraft} saving={saving} error={error} onSave={() => void save()} onClose={() => { if (!saving) { setDraft(null); setError(""); } }} />}
  </section>;
}

function ExerciseForm({ draft, setDraft, saving, error, onSave, onClose }: { draft: ExerciseDraft; setDraft: (draft: ExerciseDraft) => void; saving: boolean; error: string; onSave: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><div className="w-full rounded-t-panel border border-line bg-surface-overlay shadow-float sm:max-w-xl sm:rounded-panel"><div className="flex items-center justify-between border-b border-line p-4"><div><p className="apex-kicker">Exercício pessoal</p><h3 className="mt-2 text-[15px] font-semibold text-ink">{draft.id ? "Editar exercício" : "Novo exercício"}</h3></div><button type="button" onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted"><X size={14} /></button></div><div className="max-h-[75vh] space-y-3 overflow-y-auto p-4">
    <Field label="Nome"><input value={draft.name_pt} maxLength={120} onChange={(event) => setDraft({ ...draft, name_pt: event.target.value })} className="apex-input" /></Field>
    <div className="grid grid-cols-2 gap-3"><Field label="Categoria"><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ExerciseCategory })} className="apex-input"><option value="strength">Força</option><option value="cardio">Cardio</option><option value="mobility">Mobilidade</option></select></Field><Field label="Grupo principal"><input value={draft.primary_muscle_group} maxLength={80} onChange={(event) => setDraft({ ...draft, primary_muscle_group: event.target.value })} className="apex-input" placeholder="Ex.: Costas" /></Field></div>
    <Field label="Equipamento"><input value={draft.equipment} maxLength={120} onChange={(event) => setDraft({ ...draft, equipment: event.target.value })} className="apex-input" placeholder="Ex.: Halteres" /></Field>
    <Field label="Instruções"><textarea value={draft.instructions} maxLength={1000} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} rows={4} className="apex-input min-h-24 resize-y" /></Field>
    <Field label="Vídeo opcional"><input value={draft.video_url} maxLength={500} onChange={(event) => setDraft({ ...draft, video_url: event.target.value })} className="apex-input" placeholder="https://..." /></Field>
    {error && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-line p-4"><button type="button" onClick={onClose} className="apex-button-secondary">Cancelar</button><button type="button" onClick={onSave} disabled={saving} className="apex-button-primary">{saving ? "Salvando..." : "Salvar exercício"}</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}</label>; }
