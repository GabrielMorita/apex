"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Database, LoaderCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { archiveCustomFood, loadCustomFoods, saveCustomFood } from "@/lib/diet/service";
import { customFoodToForm, DIETARY_PATTERN_LABELS, emptyCustomFoodForm, FOOD_CATEGORY_LABELS, validateCustomFood, type CustomFoodFormErrors, type CustomFoodFormValues } from "@/lib/diet/customFood";
import type { DietaryPattern, FoodCatalogItem, FoodCategory } from "@/lib/diet/types";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : JSON.stringify(error).toLowerCase();
  if (message.includes("23505") || message.includes("duplicate") || message.includes("unique")) return "Você já possui um alimento ativo com esse nome.";
  if (message.includes("source_type") || message.includes("user_id") || message.includes("column")) return "A migration v0.17.0 de alimentos personalizados ainda não foi executada no Supabase.";
  if (message.includes("fetch") || message.includes("network")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  return "Não foi possível salvar o alimento agora.";
}

export default function CustomFoodManager({ userId, currentPattern, onCatalogChange }: { userId: string; currentPattern: DietaryPattern; onCatalogChange: () => void }) {
  const [foods, setFoods] = useState<FoodCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FoodCatalogItem | null>(null);
  const [form, setForm] = useState<CustomFoodFormValues>(() => emptyCustomFoodForm(currentPattern));
  const [formErrors, setFormErrors] = useState<CustomFoodFormErrors>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void loadCustomFoods(userId)
      .then((loaded) => { if (active) setFoods(loaded); })
      .catch((loadError) => { if (active) setError(friendlyError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  function openNew() {
    setEditing(null);
    setForm(emptyCustomFoodForm(currentPattern));
    setFormErrors({});
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(food: FoodCatalogItem) {
    setEditing(food);
    setForm(customFoodToForm(food));
    setFormErrors({});
    setMessage("");
    setFormOpen(true);
  }

  async function submit() {
    const validation = validateCustomFood(form);
    setFormErrors(validation.errors);
    if (!validation.input) return;
    setSaving(true);
    setError("");
    try {
      const saved = await saveCustomFood(userId, validation.input, editing?.id);
      setFoods((current) => editing ? current.map((food) => food.id === saved.id ? saved : food) : [saved, ...current]);
      setFormOpen(false);
      setEditing(null);
      setMessage(editing ? "Alimento atualizado. Novos usos considerarão os valores atuais." : "Alimento criado e adicionado aos seletores da Dieta.");
      onCatalogChange();
    } catch (saveError) {
      setFormErrors({ form: friendlyError(saveError) });
    } finally {
      setSaving(false);
    }
  }

  async function archive(food: FoodCatalogItem) {
    if (!window.confirm(`Arquivar “${food.name_pt}”? Planos e históricos já salvos serão preservados.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await archiveCustomFood(userId, food.id);
      setFoods((current) => current.filter((candidate) => candidate.id !== food.id));
      setMessage("Alimento arquivado. Registros anteriores foram preservados.");
      onCatalogChange();
    } catch (archiveError) {
      setError(friendlyError(archiveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="apex-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><Database size={17} /></span><div><p className="text-[13px] font-semibold text-ink">Meus alimentos</p><p className="mt-1 max-w-lg text-[10px] leading-relaxed text-ink-muted">Cadastre produtos por seus valores de rótulo a cada 100 g. Para combinar ingredientes e calcular uma preparação, use Minhas receitas.</p></div></div>
          <button type="button" disabled={loading || saving} onClick={openNew} className="apex-button-secondary shrink-0 disabled:opacity-40"><Plus size={14} />Novo alimento</button>
        </div>

        {loading && <div className="mt-4 flex items-center gap-2 rounded-control border border-line p-3 text-[9px] text-ink-muted"><LoaderCircle size={13} className="animate-spin text-accent" />Carregando seus alimentos...</div>}
        {!loading && error && <div className="mt-4 flex items-start gap-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</div>}
        {message && <p className="mt-4 rounded-control border border-emerald-300/20 bg-emerald-300/5 p-3 text-[9px] text-emerald-200">{message}</p>}

        {!loading && !error && foods.length === 0 && <div className="mt-4 rounded-card border border-dashed border-line p-5 text-center"><p className="text-[10px] font-semibold text-ink-secondary">Nenhum alimento personalizado</p><p className="mt-1 text-[8px] text-ink-muted">O catálogo TACO continua disponível normalmente.</p></div>}
        {foods.length > 0 && <div className="mt-4 grid gap-2 lg:grid-cols-2">{foods.map((food) => <article key={food.id} className="rounded-card border border-line bg-surface/60 p-3"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-[11px] font-semibold text-ink-secondary">{food.name_pt}</p><span className="rounded-full border border-line px-2 py-0.5 text-[7px] font-semibold uppercase text-ink-faint">Pessoal</span></div><p className="mt-1 text-[8px] text-ink-muted">{FOOD_CATEGORY_LABELS[food.category]} · {Math.round(food.serving_grams)} g · {food.serving_label}</p><p className="mt-2 font-stat text-[8px] text-ink-faint">100 g: {Math.round(food.calories)} kcal · P {Math.round(food.protein_g)} g · C {Math.round(food.carbs_g)} g · G {Math.round(food.fat_g)} g</p></div><div className="flex shrink-0 gap-1"><button type="button" disabled={saving} onClick={() => openEdit(food)} aria-label={`Editar ${food.name_pt}`} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"><Pencil size={12} /></button><button type="button" disabled={saving} onClick={() => void archive(food)} aria-label={`Arquivar ${food.name_pt}`} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:border-red-400/30 hover:bg-red-400/5 hover:text-red-300 disabled:opacity-40"><Trash2 size={12} /></button></div></div></article>)}</div>}
        <p className="mt-4 text-[8px] leading-relaxed text-ink-faint">Valores personalizados são informados por você e não são verificados pelo TACO. Confira o rótulo ou uma fonte confiável antes de usar.</p>
      </section>

      {formOpen && <CustomFoodForm form={form} setForm={setForm} errors={formErrors} saving={saving} editing={Boolean(editing)} onSubmit={() => void submit()} onClose={() => { if (!saving) setFormOpen(false); }} />}
    </>
  );
}

function CustomFoodForm({ form, setForm, errors, saving, editing, onSubmit, onClose }: { form: CustomFoodFormValues; setForm: (form: CustomFoodFormValues) => void; errors: CustomFoodFormErrors; saving: boolean; editing: boolean; onSubmit: () => void; onClose: () => void }) {
  const update = <K extends keyof CustomFoodFormValues>(key: K, value: CustomFoodFormValues[K]) => setForm({ ...form, [key]: value });
  const togglePattern = (pattern: DietaryPattern) => update("dietaryPatterns", form.dietaryPatterns.includes(pattern) ? form.dietaryPatterns.filter((item) => item !== pattern) : [...form.dietaryPatterns, pattern]);
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="custom-food-title" onMouseDown={(event) => { if (!saving && event.target === event.currentTarget) onClose(); }}><div className="max-h-[94vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-raised shadow-2xl sm:max-w-2xl sm:rounded-panel"><div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5"><div><p className="apex-kicker">Catálogo pessoal</p><h3 id="custom-food-title" className="mt-2 text-[16px] font-semibold text-ink">{editing ? "Editar alimento" : "Cadastrar alimento"}</h3><p className="mt-1 text-[9px] text-ink-muted">Informe a composição nutricional por 100 g.</p></div><button type="button" disabled={saving} onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted disabled:opacity-40"><X size={15} /></button></div>
    <div className="max-h-[68vh] space-y-4 overflow-y-auto p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Nome" error={errors.namePt}><input value={form.namePt} onChange={(event) => update("namePt", event.target.value)} className="apex-input" placeholder="Ex.: Iogurte da marca X" /></Field><Field label="Categoria" error={errors.category}><select value={form.category} onChange={(event) => update("category", event.target.value as FoodCategory)} className="apex-input">{(Object.entries(FOOD_CATEGORY_LABELS) as Array<[FoodCategory, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
      <div><p className="mb-2 text-[8px] font-semibold uppercase tracking-wide text-ink-faint">Compatível com</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.entries(DIETARY_PATTERN_LABELS) as Array<[DietaryPattern, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => togglePattern(value)} className={`min-h-9 rounded-control border px-2 text-[9px] font-semibold ${form.dietaryPatterns.includes(value) ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{label}</button>)}</div>{errors.dietaryPatterns && <p className="mt-1 text-[8px] text-red-300">{errors.dietaryPatterns}</p>}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><NumberField label="Calorias" unit="kcal" value={form.calories} error={errors.calories} onChange={(value) => update("calories", value)} /><NumberField label="Proteína" unit="g" value={form.proteinG} error={errors.proteinG} onChange={(value) => update("proteinG", value)} /><NumberField label="Carboidratos" unit="g" value={form.carbsG} error={errors.carbsG} onChange={(value) => update("carbsG", value)} /><NumberField label="Gorduras" unit="g" value={form.fatG} error={errors.fatG} onChange={(value) => update("fatG", value)} /></div>
      <div className="grid gap-3 sm:grid-cols-3"><NumberField label="Fibras" unit="g" value={form.fiberG} error={errors.fiberG} onChange={(value) => update("fiberG", value)} /><NumberField label="Peso da porção" unit="g" value={form.servingGrams} error={errors.servingGrams} onChange={(value) => update("servingGrams", value)} /><Field label="Descrição da porção" error={errors.servingLabel}><input value={form.servingLabel} onChange={(event) => update("servingLabel", event.target.value)} className="apex-input" placeholder="Ex.: 1 unidade" /></Field></div>
      <Field label="Alérgenos — opcional, separados por vírgula" error={errors.allergens}><input value={form.allergens} onChange={(event) => update("allergens", event.target.value)} className="apex-input" placeholder="Ex.: leite, lactose" /></Field>
      {errors.form && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{errors.form}</p>}
      <p className="rounded-control border border-amber-300/20 bg-amber-300/5 p-3 text-[8px] leading-relaxed text-amber-100">Use os dados do rótulo ou de uma fonte confiável. O Apex apenas calcula as porções a partir dos valores informados.</p>
    </div>
    <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={onClose} className="apex-button-secondary disabled:opacity-40">Cancelar</button><button type="button" disabled={saving} onClick={onSubmit} className="apex-button-primary disabled:opacity-50">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}{editing ? "Salvar alterações" : "Cadastrar alimento"}</button></div></div></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}{error && <span className="mt-1 block text-[8px] text-red-300">{error}</span>}</label>;
}

function NumberField({ label, unit, value, error, onChange }: { label: string; unit: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <Field label={label} error={error}><span className="flex items-center rounded-control border border-line bg-surface"><input type="number" min="0" max="1000" step="0.1" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent px-3 font-stat text-[11px] text-ink outline-none" /><span className="pr-3 text-[8px] text-ink-faint">{unit}</span></span></Field>;
}
