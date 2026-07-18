"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChefHat, LoaderCircle, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { archiveDietRecipe, loadDietRecipes, loadFoodCatalog, saveDietRecipe } from "@/lib/diet/service";
import { isAllowed } from "@/lib/diet/generator";
import { FOOD_CATEGORY_LABELS } from "@/lib/diet/customFood";
import {
  calculateRecipePreview,
  emptyRecipeForm,
  recipeIngredientGrams,
  recipePerServing,
  recipeToForm,
  validateRecipeForm,
  type RecipeFormErrors,
  type RecipeFormValues,
} from "@/lib/diet/recipe";
import type { DietPreferences, DietRecipe, FoodCatalogItem, FoodCategory } from "@/lib/diet/types";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : JSON.stringify(error).toLowerCase();
  if (message.includes("23505") || message.includes("duplicate") || message.includes("unique")) return "Já existe um alimento ou receita ativa com esse nome.";
  if (message.includes("diet_recipes") || message.includes("recipe_id") || message.includes("save_diet_recipe")) return "A migration v0.20.0 de receitas ainda não foi executada no Supabase.";
  if (message.includes("ingrediente") || message.includes("rendimento") || message.includes("nome inválido")) return "Revise os dados da receita e tente novamente.";
  if (message.includes("fetch") || message.includes("network")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  return "Não foi possível salvar a receita agora.";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function RecipeManager({ userId, preferences, catalogRevision, onCatalogChange }: { userId: string; preferences: DietPreferences; catalogRevision: number; onCatalogChange: () => void }) {
  const [recipes, setRecipes] = useState<DietRecipe[]>([]);
  const [catalog, setCatalog] = useState<FoodCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DietRecipe | null>(null);
  const [form, setForm] = useState<RecipeFormValues>(emptyRecipeForm);
  const [formErrors, setFormErrors] = useState<RecipeFormErrors>({});
  const [yieldCustom, setYieldCustom] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([loadDietRecipes(userId), loadFoodCatalog()])
      .then(([loadedRecipes, loadedCatalog]) => {
        if (!active) return;
        setRecipes(loadedRecipes);
        setCatalog(loadedCatalog.filter((food) => !food.recipe_id));
      })
      .catch((loadError: unknown) => { if (active) setError(friendlyError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [catalogRevision, userId]);

  function openNew() {
    setEditing(null);
    setForm(emptyRecipeForm());
    setFormErrors({});
    setYieldCustom(false);
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(recipe: DietRecipe) {
    setEditing(recipe);
    setForm(recipeToForm(recipe));
    setFormErrors({});
    setYieldCustom(true);
    setMessage("");
    setFormOpen(true);
  }

  function updateItems(items: RecipeFormValues["items"]) {
    setForm((current) => ({
      ...current,
      items,
      yieldGrams: yieldCustom ? current.yieldGrams : String(recipeIngredientGrams(items) || ""),
    }));
    setFormErrors((current) => ({ ...current, items: undefined }));
  }

  async function submit() {
    const validation = validateRecipeForm(form, catalog);
    setFormErrors(validation.errors);
    if (!validation.input) return;
    setSaving(true);
    setError("");
    try {
      await saveDietRecipe(validation.input, editing?.id);
      setRecipes(await loadDietRecipes(userId));
      setFormOpen(false);
      setEditing(null);
      setMessage(editing ? "Receita atualizada. Novos usos considerarão a composição atual." : "Receita criada e adicionada aos seletores da Dieta.");
      onCatalogChange();
    } catch (saveError) {
      setFormErrors((current) => ({ ...current, form: friendlyError(saveError) }));
    } finally {
      setSaving(false);
    }
  }

  async function archive(recipe: DietRecipe) {
    if (!window.confirm(`Arquivar “${recipe.name_pt}”? Planos e históricos já salvos serão preservados.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await archiveDietRecipe(recipe.id);
      setRecipes((current) => current.filter((candidate) => candidate.id !== recipe.id));
      setMessage("Receita arquivada. Usos anteriores foram preservados.");
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
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><ChefHat size={17} /></span><div><p className="text-[13px] font-semibold text-ink">Minhas receitas</p><p className="mt-1 max-w-lg text-[10px] leading-relaxed text-ink-muted">Combine ingredientes do catálogo, informe o rendimento final e reutilize a preparação no plano e no consumo real.</p></div></div>
          <button type="button" disabled={loading || saving} onClick={openNew} className="apex-button-secondary shrink-0 disabled:opacity-40"><Plus size={14} />Nova receita</button>
        </div>

        {loading && <div className="mt-4 flex items-center gap-2 rounded-control border border-line p-3 text-[9px] text-ink-muted"><LoaderCircle size={13} className="animate-spin text-accent" />Carregando suas receitas...</div>}
        {!loading && error && <div className="mt-4 flex items-start gap-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</div>}
        {message && <p className="mt-4 rounded-control border border-emerald-300/20 bg-emerald-300/5 p-3 text-[9px] text-emerald-200">{message}</p>}

        {!loading && !error && recipes.length === 0 && <div className="mt-4 rounded-card border border-dashed border-line p-5 text-center"><p className="text-[10px] font-semibold text-ink-secondary">Nenhuma receita cadastrada</p><p className="mt-1 text-[8px] text-ink-muted">Crie uma preparação com pelo menos dois ingredientes.</p></div>}
        {recipes.length > 0 && <div className="mt-4 grid gap-2 lg:grid-cols-2">{recipes.map((recipe) => {
          const perServing = recipePerServing({ calories: recipe.total_calories, protein_g: recipe.total_protein_g, carbs_g: recipe.total_carbs_g, fat_g: recipe.total_fat_g }, recipe.servings);
          return <article key={recipe.id} className="rounded-card border border-line bg-surface/60 p-3"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-[11px] font-semibold text-ink-secondary">{recipe.name_pt}</p><span className="rounded-full border border-amber-300/25 bg-amber-300/5 px-2 py-0.5 text-[7px] font-semibold uppercase text-amber-200">Receita</span></div><p className="mt-1 text-[8px] text-ink-muted">{recipe.servings} {recipe.servings === 1 ? "porção" : "porções"} · {Math.round(recipe.yield_grams)} g · {recipe.preparation_minutes > 0 ? `${recipe.preparation_minutes} min` : "sem tempo informado"}</p><p className="mt-2 font-stat text-[8px] text-ink-faint">Porção: {Math.round(perServing.calories)} kcal · P {Math.round(perServing.protein_g)} g · C {Math.round(perServing.carbs_g)} g · G {Math.round(perServing.fat_g)} g</p><p className="mt-1 truncate text-[8px] text-ink-faint">{recipe.items.map((item) => item.food_name_snapshot).join(" · ")}</p></div><div className="flex shrink-0 gap-1"><button type="button" disabled={saving} onClick={() => openEdit(recipe)} aria-label={`Editar ${recipe.name_pt}`} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"><Pencil size={12} /></button><button type="button" disabled={saving} onClick={() => void archive(recipe)} aria-label={`Arquivar ${recipe.name_pt}`} className="flex h-8 w-8 items-center justify-center rounded-control border border-line text-ink-muted hover:border-red-400/30 hover:bg-red-400/5 hover:text-red-300 disabled:opacity-40"><Trash2 size={12} /></button></div></div></article>;
        })}</div>}
        <p className="mt-4 text-[8px] leading-relaxed text-ink-faint">Os nutrientes são calculados pelos ingredientes selecionados. O rendimento final influencia os valores por 100 g e por porção.</p>
      </section>

      {formOpen && <RecipeForm form={form} setForm={setForm} errors={formErrors} catalog={catalog} preferences={preferences} saving={saving} editing={Boolean(editing)} yieldCustom={yieldCustom} setYieldCustom={setYieldCustom} updateItems={updateItems} onSubmit={() => void submit()} onClose={() => { if (!saving) setFormOpen(false); }} />}
    </>
  );
}

function RecipeForm({ form, setForm, errors, catalog, preferences, saving, editing, yieldCustom, setYieldCustom, updateItems, onSubmit, onClose }: {
  form: RecipeFormValues;
  setForm: (form: RecipeFormValues) => void;
  errors: RecipeFormErrors;
  catalog: FoodCatalogItem[];
  preferences: DietPreferences;
  saving: boolean;
  editing: boolean;
  yieldCustom: boolean;
  setYieldCustom: (value: boolean) => void;
  updateItems: (items: RecipeFormValues["items"]) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const update = <K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) => setForm({ ...form, [key]: value });
  const usedIds = new Set(form.items.map((item) => item.foodId));
  const candidates = catalog.filter((food) => !food.recipe_id && isAllowed(food, preferences) && !usedIds.has(food.id) && normalize(food.name_pt).includes(normalize(search))).slice(0, 20);
  const preview = calculateRecipePreview(form.items, catalog);
  const perServing = recipePerServing(preview, Number(form.servings));

  function add(food: FoodCatalogItem) {
    updateItems([...form.items, { foodId: food.id, grams: String(Math.max(1, Math.round(food.serving_grams || 100))) }]);
    setSearch("");
  }

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="recipe-form-title" onMouseDown={(event) => { if (!saving && event.target === event.currentTarget) onClose(); }}><div className="max-h-[95vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-raised shadow-2xl sm:max-w-3xl sm:rounded-panel"><div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5"><div><p className="apex-kicker">Receita pessoal</p><h3 id="recipe-form-title" className="mt-2 text-[16px] font-semibold text-ink">{editing ? "Editar receita" : "Criar receita"}</h3><p className="mt-1 text-[9px] text-ink-muted">A composição é calculada automaticamente pelos ingredientes.</p></div><button type="button" disabled={saving} onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted disabled:opacity-40"><X size={15} /></button></div>
    <div className="max-h-[72vh] space-y-4 overflow-y-auto p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Nome" error={errors.namePt}><input value={form.namePt} onChange={(event) => update("namePt", event.target.value)} className="apex-input" placeholder="Ex.: Panqueca de banana" /></Field><Field label="Categoria"><select value={form.category} onChange={(event) => update("category", event.target.value as FoodCategory)} className="apex-input">{(Object.entries(FOOD_CATEGORY_LABELS) as Array<[FoodCategory, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
      <div className="grid gap-3 sm:grid-cols-3"><NumberField label="Porções" unit="un." value={form.servings} min="1" max="100" step="1" error={errors.servings} onChange={(value) => update("servings", value)} /><NumberField label="Rendimento final" unit="g" value={form.yieldGrams} min="1" max="10000" step="0.1" error={errors.yieldGrams} onChange={(value) => { setYieldCustom(true); update("yieldGrams", value); }} /><NumberField label="Tempo de preparo" unit="min" value={form.preparationMinutes} min="0" max="1440" step="1" error={errors.preparationMinutes} onChange={(value) => update("preparationMinutes", value)} /></div>
      <p className="-mt-2 text-[8px] text-ink-faint">O rendimento começa pela soma dos ingredientes. Edite-o se o peso mudar após cozinhar.{yieldCustom ? " Valor ajustado manualmente." : ""}</p>

      <div className="rounded-card border border-line bg-surface/50 p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold text-ink-secondary">Ingredientes</p><p className="mt-1 text-[8px] text-ink-muted">Use alimentos comuns; receitas dentro de receitas ficam desativadas nesta versão.</p></div><span className="text-[8px] text-ink-faint">{form.items.length}/30</span></div>
        <label className="relative mt-3 block"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="apex-input pl-9" placeholder="Buscar ingrediente..." /></label>
        {search && <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-control border border-line bg-surface-raised p-1">{candidates.map((food) => <button key={food.id} type="button" onClick={() => add(food)} className="flex min-h-9 w-full items-center justify-between gap-3 rounded-control px-3 text-left text-[9px] text-ink-secondary hover:bg-surface-hover"><span className="truncate">{food.name_pt}{food.source_type === "custom" ? " · Pessoal" : ""}</span><span className="shrink-0 text-[8px] text-ink-faint"><Plus size={10} className="mr-1 inline" />{Math.round(food.serving_grams)} g</span></button>)}{candidates.length === 0 && <p className="p-3 text-center text-[8px] text-ink-muted">Nenhum ingrediente compatível encontrado.</p>}</div>}
        <div className="mt-3 space-y-2">{form.items.map((item, index) => { const food = catalog.find((candidate) => candidate.id === item.foodId); return <div key={item.foodId} className="flex items-center gap-2 rounded-control border border-line bg-surface p-2"><span className="min-w-0 flex-1 truncate text-[9px] font-medium text-ink-secondary">{food?.name_pt ?? "Ingrediente indisponível"}</span><label className="flex shrink-0 items-center rounded-control border border-line bg-surface-raised"><input type="number" min="0.1" max="10000" step="0.1" value={item.grams} onChange={(event) => updateItems(form.items.map((current, itemIndex) => itemIndex === index ? { ...current, grams: event.target.value } : current))} className="h-8 w-20 bg-transparent px-2 text-right font-stat text-[10px] text-ink outline-none" /><span className="pr-2 text-[8px] text-ink-faint">g</span></label><button type="button" onClick={() => updateItems(form.items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover ${food?.name_pt ?? "ingrediente"}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:text-red-300"><Trash2 size={11} /></button></div>; })}</div>
        {errors.items && <p className="mt-2 text-[8px] text-red-300">{errors.items}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Total label="Energia/porção" value={perServing.calories} unit="kcal" /><Total label="Proteína/porção" value={perServing.protein_g} unit="g" /><Total label="Carboidrato/porção" value={perServing.carbs_g} unit="g" /><Total label="Gordura/porção" value={perServing.fat_g} unit="g" /></div>
      <Field label="Modo de preparo — opcional"><textarea value={form.instructions} onChange={(event) => update("instructions", event.target.value)} maxLength={5000} rows={5} className="apex-input h-auto resize-y py-3" placeholder="Descreva as etapas de preparo..." /></Field>
      {errors.form && <p className="rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{errors.form}</p>}
      <p className="rounded-control border border-amber-300/20 bg-amber-300/5 p-3 text-[8px] leading-relaxed text-amber-100">O cálculo usa os valores do catálogo e serve como estimativa. O modo de preparo pode alterar peso e composição final.</p>
    </div>
    <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={onClose} className="apex-button-secondary disabled:opacity-40">Cancelar</button><button type="button" disabled={saving} onClick={onSubmit} className="apex-button-primary disabled:opacity-50">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}{editing ? "Salvar alterações" : "Criar receita"}</button></div></div></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>{children}{error && <span className="mt-1 block text-[8px] text-red-300">{error}</span>}</label>;
}

function NumberField({ label, unit, value, min, max, step, error, onChange }: { label: string; unit: string; value: string; min: string; max: string; step: string; error?: string; onChange: (value: string) => void }) {
  return <Field label={label} error={error}><span className="flex items-center rounded-control border border-line bg-surface"><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent px-3 font-stat text-[11px] text-ink outline-none" /><span className="pr-3 text-[8px] text-ink-faint">{unit}</span></span></Field>;
}

function Total({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className="rounded-control border border-line bg-surface p-2.5"><p className="text-[7px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-stat text-[11px] font-semibold text-ink">{Math.round(value)} <span className="text-[8px] font-normal text-ink-muted">{unit}</span></p></div>;
}
