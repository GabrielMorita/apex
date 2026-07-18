"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  Lock,
  LockOpen,
  LoaderCircle,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  compatibleReplacements,
  currentWeekStart,
  generateWeeklyPlan,
  regenerateDay,
  regenerateMeal,
  regenerateWeek,
  replaceMealItem,
  toggleMealLock,
} from "@/lib/diet/generator";
import { loadDietConsumption, loadDietPlanSummaries, loadFavoriteFoodIds, loadFoodCatalog, loadMealTemplates, loadRecentFoodIds, loadWeeklyDietPlan, saveConsumptionItems, saveMealTemplate, saveWeeklyDietPlan, saveWeeklyDietPlanAndSyncConsumption, setFoodFavorite, setMealConsumption } from "@/lib/diet/service";
import { mergeRecentFoodIds } from "@/lib/diet/foodDiscovery";
import type { DietConsumptionEntry, DietConsumptionItem, DietMeal, DietMealItem, DietMealTemplate, DietPlanSummary, DietState, FoodCatalogItem, NutrientTotals, WeeklyDietPlan } from "@/lib/diet/types";
import IngredientPicker from "@/components/diet/IngredientPicker";
import DailyConsumption from "@/components/diet/DailyConsumption";
import ConsumptionEditor from "@/components/diet/ConsumptionEditor";
import ShoppingList from "@/components/diet/ShoppingList";
import PlannedMealEditor from "@/components/diet/PlannedMealEditor";
import CopyMealDialog from "@/components/diet/CopyMealDialog";
import WeekNavigator from "@/components/diet/WeekNavigator";
import { consumptionItemsFromPlannedMeal, copyPlannedMealToDays, updatePlannedMealItems } from "@/lib/diet/planEditing";
import { addWeeks, copyWeeklyPlanToWeek } from "@/lib/diet/weekPlanning";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
type PlannedConsumptionSync = { entry: DietConsumptionEntry; meal: DietMeal; items: DietConsumptionItem[] };

export default function WeeklyPlan({ state, catalogRevision = 0, templateRevision = 0, view = "plan", onTemplateChange, onOpenPlan }: { state: DietState; catalogRevision?: number; templateRevision?: number; view?: "plan" | "shopping"; onTemplateChange?: () => void; onOpenPlan?: () => void }) {
  const preferences = state.preferences!;
  const targets = state.targets!;
  const [currentStart] = useState(() => currentWeekStart());
  const [weekStart, setWeekStart] = useState(currentStart);
  const [catalog, setCatalog] = useState<FoodCatalogItem[]>([]);
  const [plan, setPlan] = useState<WeeklyDietPlan | null>(null);
  const [planSummaries, setPlanSummaries] = useState<DietPlanSummary[]>([]);
  const [undoPlan, setUndoPlan] = useState<WeeklyDietPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => (new Date().getDay() + 6) % 7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [picker, setPicker] = useState<{ mealIndex: number; itemIndex: number } | null>(null);
  const [consumption, setConsumption] = useState<DietConsumptionEntry[]>([]);
  const [consumptionSaving, setConsumptionSaving] = useState<string | null>(null);
  const [consumptionEditor, setConsumptionEditor] = useState<DietConsumptionEntry | null>(null);
  const [planEditor, setPlanEditor] = useState<number | null>(null);
  const [copyMealIndex, setCopyMealIndex] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentFoodIds, setRecentFoodIds] = useState<string[]>([]);
  const [favoriteSaving, setFavoriteSaving] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState("");
  const [mealTemplates, setMealTemplates] = useState<DietMealTemplate[]>([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const busy = saving || consumptionSaving !== null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([loadFoodCatalog(), loadWeeklyDietPlan(state.profile.id, weekStart), loadDietConsumption(state.profile.id, weekStart), loadFavoriteFoodIds(state.profile.id), loadRecentFoodIds(state.profile.id), loadDietPlanSummaries(state.profile.id)])
      .then(([loadedCatalog, loadedPlan, loadedConsumption, loadedFavorites, loadedRecent, loadedSummaries]) => {
        if (!active) return;
        setCatalog(loadedCatalog);
        setPlan(loadedPlan);
        setConsumption(loadedConsumption);
        setFavoriteIds(loadedFavorites);
        setRecentFoodIds(loadedRecent);
        setPlanSummaries(loadedSummaries);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        const text = loadError instanceof Error ? loadError.message.toLowerCase() : JSON.stringify(loadError).toLowerCase();
        setError(text.includes("recipe_id") || text.includes("diet_recipes") ? "A migration v0.20.0 de receitas ainda não foi executada no Supabase." : text.includes("diet_food_favorites") ? "A migration v0.18.0 de alimentos favoritos ainda não foi executada no Supabase." : text.includes("diet_consumption_entries") ? "A migration v0.14.0 do consumo alimentar ainda não foi executada no Supabase." : text.includes("source_type") || text.includes("user_id") ? "A migration v0.17.0 de alimentos personalizados ainda não foi executada no Supabase." : text.includes("food_catalog") || text.includes("diet_plans") ? "A migration v0.13.0 do gerador semanal ainda não foi executada no Supabase." : "Não foi possível carregar o plano semanal. Verifique sua conexão e tente novamente.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [catalogRevision, state.profile.id, weekStart]);

  useEffect(() => {
    let active = true;
    setTemplateError("");
    void loadMealTemplates(state.profile.id)
      .then((loaded) => { if (active) setMealTemplates(loaded); })
      .catch((loadError: unknown) => {
        if (!active) return;
        const text = loadError instanceof Error ? loadError.message.toLowerCase() : JSON.stringify(loadError).toLowerCase();
        setTemplateError(text.includes("diet_meal_templates") ? "A migration v0.23.0 de modelos ainda não foi executada no Supabase." : "Não foi possível carregar os modelos agora.");
      });
    return () => { active = false; };
  }, [state.profile.id, templateRevision]);

  function refreshPlanSummaries() {
    void loadDietPlanSummaries(state.profile.id)
      .then(setPlanSummaries)
      .catch(() => undefined);
  }

  function selectWeek(nextWeekStart: string) {
    if (nextWeekStart === weekStart) return;
    setLoading(true);
    setPlan(null);
    setConsumption([]);
    setWeekStart(nextWeekStart);
    setSelectedDay(nextWeekStart === currentStart ? (new Date().getDay() + 6) % 7 : 0);
    setUndoPlan(null);
    setPicker(null);
    setPlanEditor(null);
    setCopyMealIndex(null);
    setConsumptionEditor(null);
    setMessage("");
    setError("");
  }

  async function generateFirstPlan() {
    if (weekStart < currentStart) {
      setError("Semanas históricas não podem receber planos retroativos.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      if (catalog.length === 0) throw new Error("O catálogo de alimentos está vazio.");
      const saved = await saveWeeklyDietPlan(generateWeeklyPlan(catalog, preferences, targets, weekStart));
      setPlan(saved);
      setUndoPlan(null);
      setMessage("Plano de sete dias gerado e salvo no Supabase.");
      refreshPlanSummaries();
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Não foi possível gerar o plano agora.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPreviousWeek() {
    if (weekStart < currentStart) {
      setError("Semanas históricas não podem receber planos retroativos.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const previousWeekStart = addWeeks(weekStart, -1);
      const previousPlan = await loadWeeklyDietPlan(state.profile.id, previousWeekStart);
      if (!previousPlan) throw new Error("A semana anterior não possui um plano salvo para copiar.");
      const saved = await saveWeeklyDietPlan(copyWeeklyPlanToWeek(previousPlan, weekStart));
      setPlan(saved);
      setUndoPlan(null);
      setMessage("Semana anterior copiada. Bloqueios foram liberados para esta nova semana.");
      refreshPlanSummaries();
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Não foi possível copiar a semana anterior agora.");
    } finally {
      setSaving(false);
    }
  }

  async function persistChange(next: WeeklyDietPlan, successMessage: string, undoable = true, consumptionSync?: PlannedConsumptionSync) {
    if (!plan) return false;
    if (weekStart < currentStart) {
      setError("Este plano histórico está protegido contra alterações.");
      return false;
    }
    const previous = plan;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = consumptionSync
        ? await saveWeeklyDietPlanAndSyncConsumption(state.profile.id, next, consumptionSync.entry, consumptionSync.meal, consumptionSync.items)
        : { plan: await saveWeeklyDietPlan(next), consumption: null };
      const saved = result.plan;
      setPlan(saved);
      if (result.consumption) setConsumption(result.consumption);
      setUndoPlan(undoable ? previous : null);
      setMessage(successMessage);
      refreshPlanSummaries();
      return true;
    } catch (changeError) {
      const text = changeError instanceof Error ? changeError.message.toLowerCase() : JSON.stringify(changeError).toLowerCase();
      setError(text.includes("save_weekly_diet_plan_and_sync_consumption") ? "Execute a migration v0.24.1 para sincronizar a refeição planejada com o consumo." : "A alteração não foi salva. O plano anterior foi mantido.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function undoLastChange() {
    if (!undoPlan) return;
    const current = plan;
    setSaving(true);
    setError("");
    try {
      const saved = await saveWeeklyDietPlan(undoPlan);
      setPlan(saved);
      setUndoPlan(current);
      setMessage("Última alteração desfeita.");
    } catch {
      setError("Não foi possível desfazer agora.");
    } finally {
      setSaving(false);
    }
  }

  function selectIngredient(food: FoodCatalogItem) {
    if (!plan || !picker) return;
    const currentItem = plan.days[selectedDay]?.meals[picker.mealIndex]?.items[picker.itemIndex];
    if (!currentItem) return;
    const next = replaceMealItem(plan, selectedDay, picker.mealIndex, picker.itemIndex, food);
    setPicker(null);
    setPlanEditor(null);
    setCopyMealIndex(null);
    setConsumptionEditor(null);
    void persistChange(next, `${currentItem.food_name} foi substituído por ${food.name_pt}.`);
  }

  async function toggleFavorite(foodId: string) {
    const favorite = !favoriteIds.includes(foodId);
    setFavoriteSaving(foodId);
    setFavoriteError("");
    try {
      await setFoodFavorite(state.profile.id, foodId, favorite);
      setFavoriteIds((current) => favorite ? [...new Set([foodId, ...current])] : current.filter((id) => id !== foodId));
    } catch {
      setFavoriteError("Não foi possível atualizar o favorito agora.");
    } finally {
      setFavoriteSaving(null);
    }
  }

  async function saveActualConsumption(items: DietConsumptionItem[]) {
    if (!consumptionEditor) return;
    setConsumptionSaving(`${consumptionEditor.consumed_date}-${consumptionEditor.meal_order}`);
    setUndoPlan(null);
    setMessage("");
    setError("");
    try {
      setConsumption(await saveConsumptionItems(state.profile.id, consumptionEditor, items));
      setRecentFoodIds((current) => mergeRecentFoodIds(current, items.map((item) => item.food_id)));
      setConsumptionEditor(null);
      setMessage(`${consumptionEditor.meal_name} atualizada com o consumo real.`);
    } catch {
      setError("Não foi possível salvar as quantidades consumidas. O registro anterior foi mantido.");
    } finally {
      setConsumptionSaving(null);
    }
  }

  async function savePlannedMeal(items: DietMealItem[]) {
    if (!plan || planEditor === null) return;
    const meal = plan.days[selectedDay]?.meals[planEditor];
    if (!meal) return;
    const next = updatePlannedMealItems(plan, selectedDay, planEditor, items);
    const nextMeal = next.days[selectedDay]?.meals[planEditor];
    if (!nextMeal) return;
    const consumedEntry = consumption.find((entry) => entry.consumed_date === next.days[selectedDay].plan_date && entry.meal_order === meal.meal_order);
    const consumptionSync = consumedEntry ? {
      entry: consumedEntry,
      meal: nextMeal,
      items: consumptionItemsFromPlannedMeal(nextMeal, consumedEntry),
    } : undefined;
    const successMessage = consumedEntry ? `${meal.name} atualizada no plano e no consumo registrado.` : `${meal.name} atualizada no plano.`;
    if (await persistChange(next, successMessage, true, consumptionSync)) {
      if (consumptionSync) setRecentFoodIds((current) => mergeRecentFoodIds(current, consumptionSync.items.map((item) => item.food_id)));
      setPlanEditor(null);
    }
  }

  async function copyMealToDays(targetDayIndices: number[]) {
    if (!plan || copyMealIndex === null) return;
    const meal = plan.days[selectedDay]?.meals[copyMealIndex];
    if (!meal) return;
    const next = copyPlannedMealToDays(plan, selectedDay, copyMealIndex, targetDayIndices);
    if (await persistChange(next, `${meal.name} copiada para ${targetDayIndices.length} ${targetDayIndices.length === 1 ? "dia" : "dias"}.`)) setCopyMealIndex(null);
  }

  async function createMealTemplate(namePt: string, items: DietMealItem[]) {
    const name = namePt.trim();
    if (name.length < 2 || name.length > 80) {
      setTemplateError("Use um nome entre 2 e 80 caracteres.");
      return false;
    }
    if (items.some((item) => !catalog.some((food) => food.id === item.food_id))) {
      setTemplateError("Esta refeição contém um item arquivado ou indisponível. Remova-o antes de salvar o modelo.");
      return false;
    }
    setTemplateSaving(true);
    setTemplateError("");
    try {
      await saveMealTemplate(name, items);
      setMealTemplates(await loadMealTemplates(state.profile.id));
      onTemplateChange?.();
      return true;
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message.toLowerCase() : JSON.stringify(saveError).toLowerCase();
      setTemplateError(text.includes("23505") || text.includes("duplicate") || text.includes("unique") ? "Já existe um modelo ativo com esse nome." : text.includes("diet_meal_templates") || text.includes("save_diet_meal_template") ? "A migration v0.23.0 de modelos ainda não foi executada no Supabase." : "Não foi possível salvar o modelo agora.");
      return false;
    } finally {
      setTemplateSaving(false);
    }
  }

  async function toggleConsumption(mealIndex: number) {
    if (!plan) return;
    const selected = plan.days[selectedDay];
    const meal = selected?.meals[mealIndex];
    if (!selected || !meal) return;
    const existing = consumption.some((entry) => entry.consumed_date === selected.plan_date && entry.meal_order === meal.meal_order);
    setConsumptionSaving(`${selected.plan_date}-${meal.meal_order}`);
    setUndoPlan(null);
    setPicker(null);
    setPlanEditor(null);
    setCopyMealIndex(null);
    setMessage("");
    setError("");
    try {
      setConsumption(await setMealConsumption(state.profile.id, plan.week_start, selected.plan_date, meal, !existing));
      if (!existing) setRecentFoodIds((current) => mergeRecentFoodIds(current, meal.items.map((item) => item.food_id)));
      setMessage(existing ? `${meal.name} voltou para pendente.` : `${meal.name} registrada como consumida.`);
    } catch {
      setError("Não foi possível atualizar o consumo. O registro anterior foi mantido.");
    } finally {
      setConsumptionSaving(null);
    }
  }

  const historicalWeek = weekStart < currentStart;
  const weekNavigator = <WeekNavigator selectedWeekStart={weekStart} currentWeekStart={currentStart} plans={planSummaries} disabled={busy || loading} onSelect={selectWeek} />;

  if (loading) return <section className="apex-card flex items-center gap-2 p-5 text-[11px] text-ink-muted"><LoaderCircle size={15} className="animate-spin text-accent" />Carregando catálogo e plano semanal...</section>;

  if (error && !plan) return (
    <section className="apex-card p-5">
      <div className="mb-4 flex justify-end">{weekNavigator}</div>
      <div className="flex items-start gap-3 text-[11px] leading-relaxed text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>
    </section>
  );

  if (!plan) return (
    <section className="apex-card flex flex-col items-center px-6 py-5 text-center sm:py-6">
        <div className="mb-8 flex w-full justify-end">{weekNavigator}</div>
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-accent-subtle text-accent"><CalendarDays size={20} /></span>
        <p className="text-[14px] font-semibold text-ink">{view === "shopping" ? "Esta semana ainda não possui lista de compras" : historicalWeek ? "Nenhum plano foi salvo nesta semana" : weekStart > currentStart ? "Planeje esta semana futura" : "Seu plano semanal está pronto para ser criado"}</p>
        <p className="mt-2 max-w-lg text-[11px] leading-relaxed text-ink-muted">{view === "shopping" ? "A lista é criada automaticamente a partir de um plano semanal salvo." : historicalWeek ? "O histórico mostra apenas planos que realmente foram salvos; o Apex não cria registros retroativos." : `Gere uma nova combinação com suas metas atuais ou reutilize a semana anterior. O catálogo disponível possui ${catalog.length} alimentos.`}</p>
        {view === "shopping" && <button type="button" onClick={onOpenPlan} className="apex-button-primary mt-5">Ir para Plano</button>}
        {view === "plan" && !historicalWeek && <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" disabled={saving} onClick={() => void generateFirstPlan()} className="apex-button-primary disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}Gerar plano de 7 dias</button>
          {planSummaries.some((summary) => summary.week_start === addWeeks(weekStart, -1)) && <button type="button" disabled={saving} onClick={() => void copyPreviousWeek()} className="apex-button-secondary disabled:opacity-50"><Copy size={14} />Copiar semana anterior</button>}
        </div>}
        {view === "plan" && <SourceNote />}
    </section>
  );

  const day = plan.days[selectedDay] ?? plan.days[0];
  const dayConsumption = consumption.filter((entry) => entry.consumed_date === day.plan_date);
  const staleTargets = ["calories", "protein_g", "carbs_g", "fat_g"].some((key) => Math.abs(Number(plan.targets_snapshot[key as keyof NutrientTotals]) - Number(targets[key as keyof NutrientTotals])) > 0.5);

  if (view === "shopping") return <ShoppingList userId={state.profile.id} plan={plan} catalog={catalog} catalogRevision={catalogRevision} weekNavigation={weekNavigator} />;

  return (
    <section className="space-y-4">
      <div className="apex-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line-subtle p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="apex-kicker">Plano semanal</p><span className="rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2 py-1 text-[8px] font-semibold uppercase text-emerald-200"><Check size={10} className="mr-1 inline" />Salvo</span>{historicalWeek && <span className="rounded-full border border-line px-2 py-1 text-[8px] font-semibold uppercase text-ink-muted">Somente leitura</span>}</div>
            <h2 className="mt-2 text-[17px] font-semibold text-ink">Semana de {formatDate(plan.week_start)}</h2>
            <p className="mt-1 text-[10px] text-ink-muted">Escolha um dia para ver as porções e os macronutrientes estimados.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap justify-end gap-2">
              {!historicalWeek && undoPlan && <button type="button" disabled={busy} onClick={() => void undoLastChange()} className="apex-button-secondary min-h-9 px-3 text-[10px] disabled:opacity-50"><RotateCcw size={13} />Desfazer</button>}
              {!historicalWeek && <button type="button" disabled={busy} onClick={() => {
                if (window.confirm("Regerar todas as refeições desbloqueadas desta semana?")) void persistChange(regenerateWeek(plan, catalog, preferences, targets), "Semana regenerada. Refeições bloqueadas foram preservadas.");
              }} className="apex-button-secondary min-h-9 px-3 text-[10px] disabled:opacity-50"><RefreshCw size={13} />Regerar semana</button>}
            </div>
            {weekNavigator}
          </div>
        </div>

        <div className="no-scrollbar flex overflow-x-auto border-b border-line-subtle px-2 py-2 sm:px-3">
          {plan.days.map((planDay, index) => (
            <button key={planDay.plan_date} type="button" onClick={() => { setSelectedDay(index); setPicker(null); setPlanEditor(null); setCopyMealIndex(null); setConsumptionEditor(null); }} className={`min-w-[76px] flex-1 rounded-control px-2 py-2 text-center transition ${selectedDay === index ? "bg-accent-subtle text-accent" : "text-ink-muted hover:bg-surface-hover hover:text-ink"}`}>
              <span className="block text-[9px] font-semibold uppercase">{DAY_NAMES[index]}</span>
              <span className="mt-1 block font-stat text-[13px] font-semibold">{planDay.plan_date.slice(8, 10)}</span>
              <span className="mt-1 block text-[8px]">{Math.round(planDay.calories)} kcal</span>
            </button>
          ))}
        </div>

        {historicalWeek && <div className="mx-4 mt-4 flex items-start gap-2 rounded-card border border-line bg-surface-raised p-3 text-[10px] leading-relaxed text-ink-muted sm:mx-5"><Lock size={14} className="mt-0.5 shrink-0 text-accent" /><span>Este plano pertence ao histórico e está protegido contra alterações. Os registros de consumo continuam disponíveis para consulta e correção.</span></div>}
        {!historicalWeek && staleTargets && <div className="mx-4 mt-4 flex items-start gap-2 rounded-card border border-amber-300/20 bg-amber-300/5 p-3 text-[10px] leading-relaxed text-amber-100 sm:mx-5"><AlertCircle size={14} className="mt-0.5 shrink-0" /><span>Suas metas mudaram depois da geração. Use “Regerar semana” para aplicar os valores atuais; refeições bloqueadas serão mantidas.</span></div>}

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[14px] font-semibold text-ink">{fullDayName(day.plan_date)}</p><p className="mt-1 text-[9px] text-ink-muted">{day.meals.length} refeições planejadas</p></div>
            {!historicalWeek && <button type="button" disabled={busy || day.meals.every((meal) => meal.is_locked)} onClick={() => void persistChange(regenerateDay(plan, selectedDay, catalog, preferences, targets), "Dia regenerado. Refeições bloqueadas foram preservadas.")} className="apex-button-secondary min-h-9 px-3 text-[10px] disabled:opacity-40"><RefreshCw size={13} />Regerar dia</button>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DailyTotal label="Energia" value={day.calories} target={targets.calories} unit="kcal" />
            <DailyTotal label="Proteína" value={day.protein_g} target={targets.protein_g} unit="g" />
            <DailyTotal label="Carboidratos" value={day.carbs_g} target={targets.carbs_g} unit="g" />
            <DailyTotal label="Gorduras" value={day.fat_g} target={targets.fat_g} unit="g" />
          </div>
          <DailyConsumption day={day} entries={dayConsumption} />

          <div className="mt-5 space-y-3">
            {day.meals.map((meal, mealIndex) => {
              const consumedEntry = dayConsumption.find((entry) => entry.meal_order === meal.meal_order);
              const consumed = Boolean(consumedEntry);
              return (
              <article key={`${day.plan_date}-${meal.meal_order}`} className="rounded-card border border-line bg-surface/60 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><Clock3 size={14} /></span>
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-semibold text-ink">{meal.name}</h3>{meal.is_locked && <span className="rounded-full border border-line px-2 py-0.5 text-[8px] text-ink-muted">Bloqueada</span>}{consumed && <span className="rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2 py-0.5 text-[8px] font-semibold text-emerald-200">Consumida</span>}</div><p className="mt-1 text-[9px] text-ink-muted">{meal.scheduled_time || "Sem horário"} · {Math.round(meal.calories)} kcal · P {Math.round(meal.protein_g)} g · C {Math.round(meal.carbs_g)} g · G {Math.round(meal.fat_g)} g</p></div>
                  </div>
                  <div className="flex gap-1 self-end sm:self-auto">
                    <button type="button" disabled={busy || historicalWeek} aria-label={meal.is_locked ? "Desbloquear refeição" : "Bloquear refeição"} title={historicalWeek ? "Plano histórico protegido" : meal.is_locked ? "Desbloquear" : "Bloquear"} onClick={() => void persistChange(toggleMealLock(plan, selectedDay, mealIndex), meal.is_locked ? "Refeição desbloqueada." : "Refeição bloqueada.", false)} className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40">{meal.is_locked ? <Lock size={13} /> : <LockOpen size={13} />}</button>
                    <button type="button" disabled={busy || meal.is_locked || historicalWeek} onClick={() => { setPicker(null); setCopyMealIndex(null); setConsumptionEditor(null); setFavoriteError(""); setError(""); setPlanEditor(mealIndex); }} className="flex min-h-9 items-center gap-1.5 rounded-control border border-line px-3 text-[9px] font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><Pencil size={12} />Editar</button>
                    <button type="button" disabled={busy || historicalWeek} onClick={() => { setPicker(null); setPlanEditor(null); setConsumptionEditor(null); setFavoriteError(""); setError(""); setCopyMealIndex(mealIndex); }} className="flex min-h-9 items-center gap-1.5 rounded-control border border-line px-3 text-[9px] font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><Copy size={12} />Copiar</button>
                    <button type="button" disabled={busy || meal.is_locked || historicalWeek} onClick={() => void persistChange(regenerateMeal(plan, selectedDay, mealIndex, catalog, preferences, targets), `${meal.name} regenerada.`)} className="flex min-h-9 items-center gap-1.5 rounded-control border border-line px-3 text-[9px] font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><RefreshCw size={12} />Trocar</button>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-line-subtle border-t border-line-subtle">
                  {meal.items.map((item, itemIndex) => <div key={`${item.food_id}-${item.item_order}`} className="flex items-center justify-between gap-3 py-2.5 text-[10px]"><div className="min-w-0"><p className="truncate font-medium text-ink-secondary">{item.food_name}</p><p className="mt-0.5 text-[8px] text-ink-faint">{item.serving_label}</p></div><div className="flex shrink-0 items-center gap-2"><div className="text-right"><p className="font-stat font-semibold text-ink">{Math.round(item.grams)} g</p><p className="mt-0.5 text-[8px] text-ink-faint">{Math.round(item.calories)} kcal</p></div><button type="button" disabled={busy || meal.is_locked || historicalWeek} onClick={() => { setFavoriteError(""); setPicker({ mealIndex, itemIndex }); }} className="flex min-h-8 items-center gap-1 rounded-control border border-line px-2 text-[8px] font-semibold text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-35" aria-label={`Trocar ${item.food_name}`}><RefreshCw size={10} />Escolher</button></div></div>)}
                </div>
                <div className={`mt-3 grid gap-2 ${consumed ? "sm:grid-cols-2" : ""}`}>
                  <button type="button" disabled={busy} onClick={() => void toggleConsumption(mealIndex)} className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-control border text-[10px] font-semibold transition disabled:opacity-40 ${consumed ? "border-emerald-300/25 bg-emerald-300/5 text-emerald-200 hover:bg-emerald-300/10" : "border-line text-ink-secondary hover:bg-surface-hover hover:text-ink"}`}><CheckCircle2 size={13} />{consumed ? "Marcar como pendente" : "Registrar como consumida"}</button>
                  {consumedEntry && <button type="button" disabled={busy} onClick={() => { setPicker(null); setPlanEditor(null); setCopyMealIndex(null); setMessage(""); setError(""); setFavoriteError(""); setConsumptionEditor(consumedEntry); }} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-line text-[10px] font-semibold text-ink-secondary transition hover:bg-surface-hover hover:text-ink disabled:opacity-40"><Pencil size={12} />Editar consumido · {Math.round(consumedEntry.calories)} kcal</button>}
                </div>
              </article>
            );})}
          </div>
        </div>
      </div>

      <SourceNote />
      {(busy || message || error) && <div className={`fixed bottom-20 left-1/2 z-[80] flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-card border p-3 shadow-2xl sm:bottom-6 ${error ? "border-red-400/30 bg-[#261719] text-red-200" : "border-amber-300/25 bg-[#211b13] text-ink-secondary"}`}>
        {busy ? <LoaderCircle size={15} className="shrink-0 animate-spin text-accent" /> : error ? <AlertCircle size={15} className="shrink-0 text-red-300" /> : <Check size={15} className="shrink-0 text-emerald-300" />}
        <span className="min-w-0 flex-1 text-[10px] leading-relaxed">{busy ? consumptionSaving ? "Atualizando o consumo no Supabase..." : "Salvando o plano no Supabase..." : error || message}</span>
        {!busy && !error && undoPlan && <button type="button" onClick={() => void undoLastChange()} className="flex min-h-8 shrink-0 items-center gap-1 rounded-control border border-amber-300/25 px-2.5 text-[9px] font-semibold text-accent hover:bg-amber-300/5"><RotateCcw size={11} />Desfazer</button>}
      </div>}
      {picker && (() => {
        const currentMeal = day.meals[picker.mealIndex];
        const currentItem = currentMeal?.items[picker.itemIndex];
        if (!currentItem) return null;
        const usedFoodIds = new Set(currentMeal.items.map((item) => item.food_id));
        const alternatives = compatibleReplacements(currentItem, catalog, preferences).filter((food) => !usedFoodIds.has(food.id));
        return <IngredientPicker current={currentItem} alternatives={alternatives} favoriteIds={favoriteIds} recentFoodIds={recentFoodIds} favoriteSaving={favoriteSaving} favoriteError={favoriteError} onToggleFavorite={(foodId) => void toggleFavorite(foodId)} onSelect={selectIngredient} onClose={() => setPicker(null)} />;
      })()}
      {!historicalWeek && planEditor !== null && day.meals[planEditor] && <PlannedMealEditor meal={day.meals[planEditor]} catalog={catalog} preferences={preferences} favoriteIds={favoriteIds} recentFoodIds={recentFoodIds} favoriteSaving={favoriteSaving} onToggleFavorite={(foodId) => void toggleFavorite(foodId)} saving={saving} saveError={favoriteError || error} consumed={dayConsumption.some((entry) => entry.meal_order === day.meals[planEditor].meal_order)} templates={mealTemplates} templateSaving={templateSaving} templateError={templateError} onSaveTemplate={createMealTemplate} onSave={(items) => void savePlannedMeal(items)} onClose={() => { if (!busy && !templateSaving) setPlanEditor(null); }} />}
      {!historicalWeek && copyMealIndex !== null && day.meals[copyMealIndex] && <CopyMealDialog plan={plan} sourceDayIndex={selectedDay} mealIndex={copyMealIndex} consumption={consumption} saving={saving} saveError={error} onSave={(targets) => void copyMealToDays(targets)} onClose={() => { if (!busy) setCopyMealIndex(null); }} />}
      {consumptionEditor && <ConsumptionEditor entry={consumptionEditor} catalog={catalog} preferences={preferences} favoriteIds={favoriteIds} recentFoodIds={recentFoodIds} favoriteSaving={favoriteSaving} onToggleFavorite={(foodId) => void toggleFavorite(foodId)} saving={consumptionSaving !== null} saveError={favoriteError || error} onSave={(items) => void saveActualConsumption(items)} onClose={() => { if (!busy) setConsumptionEditor(null); }} />}
    </section>
  );
}

function DailyTotal({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const percentage = target > 0 ? Math.round((value / target) * 100) : 0;
  const distance = Math.abs(percentage - 100);
  return <div className="rounded-card border border-line bg-surface-raised p-3"><p className="text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-stat text-[14px] font-semibold text-ink">{Math.round(value)} <span className="text-[8px] font-normal text-ink-muted">{unit}</span></p><div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hover"><span className={`block h-full rounded-full ${distance <= 15 ? "bg-emerald-400" : "bg-accent"}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div><p className="mt-1.5 text-[8px] text-ink-faint">{percentage}% da meta</p></div>;
}

function SourceNote() {
  return <div className="mt-4 flex items-start justify-center gap-2 text-center text-[8px] leading-relaxed text-ink-faint"><Database size={11} className="mt-0.5 shrink-0" /><span>Composição por 100 g: TACO, 4ª edição, NEPA‑UNICAMP. Quantidades são estimativas provisórias. <a href="https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/" target="_blank" rel="noreferrer" className="inline-flex items-center text-accent hover:underline">Ver fonte <ChevronRight size={9} /></a></span></div>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}

function fullDayName(date: string) {
  const text = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${date}T12:00:00`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
