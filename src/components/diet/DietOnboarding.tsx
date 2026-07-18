"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, LoaderCircle, Save, Sparkles } from "lucide-react";
import { Field, SelectInput, TextInput } from "@/components/profile/ProfileFields";
import { calculateProvisionalTargets } from "@/lib/diet/calculation";
import { saveDietOnboarding } from "@/lib/diet/service";
import type { DietOnboardingDraft, DietState } from "@/lib/diet/types";
import { navigateTo } from "@/lib/navigationEvents";
import { setUnsavedDietChanges } from "@/lib/profile/navigationGuard";

const STEP_TITLES = ["Objetivo", "Rotina", "Refeições", "Preferências", "Praticidade", "Metas", "Revisão"];
const goalLabels = { lose_weight: "Emagrecer", maintain_weight: "Manter peso", gain_muscle: "Ganhar massa" };
const activityLabels = { sedentary: "Sedentário", light: "Leve", moderate: "Moderado", high: "Alto" };

function joinList(values: string[]) {
  return values.join(", ");
}

function defaultTimes(count: number) {
  const options: Record<number, string[]> = {
    2: ["08:00", "19:00"],
    3: ["08:00", "13:00", "19:00"],
    4: ["08:00", "12:30", "16:30", "20:00"],
    5: ["07:30", "10:30", "13:30", "17:00", "20:30"],
    6: ["07:00", "10:00", "13:00", "16:00", "19:00", "21:30"],
  };
  return options[count] ?? options[4];
}

function makeDraft(state: DietState): DietOnboardingDraft {
  const calculated = calculateProvisionalTargets(state.profile);
  const preferences = state.preferences;
  const targets = state.targets ?? calculated;
  return {
    healthEligibilityConfirmed: preferences?.health_eligibility_confirmed ?? false,
    mealCount: preferences?.meal_count ?? 4,
    mealTimes: preferences?.meal_times?.map((time) => time.slice(0, 5)) ?? defaultTimes(4),
    trainingTime: preferences?.training_time ?? (state.profile.training_frequency ? "varies" : "none"),
    dietaryPattern: preferences?.dietary_pattern ?? "omnivore",
    allergies: joinList(preferences?.allergies ?? []),
    restrictions: joinList(preferences?.restrictions ?? []),
    dislikedFoods: joinList(preferences?.disliked_foods ?? []),
    favoriteFoods: joinList(preferences?.favorite_foods ?? []),
    cookingTimeMinutes: preferences?.cooking_time_minutes ?? 30,
    budgetLevel: preferences?.budget_level ?? "moderate",
    varietyLevel: preferences?.variety_level ?? "balanced",
    mealStyle: preferences?.meal_style ?? "mixed",
    calories: String(Math.round(Number(targets.calories))),
    proteinG: String(Math.round(Number(targets.protein_g))),
    carbsG: String(Math.round(Number(targets.carbs_g))),
    fatG: String(Math.round(Number(targets.fat_g))),
  };
}

function numericError(value: string, label: string, min: number, max: number, maxDecimals: number) {
  if (!value.trim()) return `${label} é obrigatório.`;
  const normalized = value.trim().replace(",", ".");
  const pattern = maxDecimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:\\.\\d{1,${maxDecimals}})?$`);
  if (!pattern.test(normalized)) return maxDecimals === 0 ? `${label} deve ser um número inteiro.` : `${label} aceita no máximo ${maxDecimals} casa decimal.`;
  const number = Number(normalized);
  if (!Number.isFinite(number)) return `Informe ${label.toLowerCase()} em número.`;
  if (number < min || number > max) return `${label} deve ficar entre ${min} e ${max}.`;
  return "";
}

function friendlyDietError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("diet_preferences") || message.includes("nutrition_targets") || message.includes("save_diet_foundation")) return "Execute primeiro a migration v0.12.0 da Dieta no Supabase.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  if (message.includes("jwt") || message.includes("auth")) return "Sua sessão expirou. Entre novamente para salvar.";
  return "Não foi possível salvar a Dieta. Revise os dados e tente novamente.";
}

function ChoiceGrid<T extends string>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string; description?: string }>; onChange: (value: T) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`rounded-card border p-3 text-left transition-colors ${value === option.value ? "border-line-accent bg-accent-subtle" : "border-line bg-surface-raised hover:border-line-strong"}`}>
          <span className={`block text-[12px] font-semibold ${value === option.value ? "text-accent" : "text-ink"}`}>{option.label}</span>
          {option.description && <span className="mt-1 block text-[10px] leading-relaxed text-ink-muted">{option.description}</span>}
        </button>
      ))}
    </div>
  );
}

export default function DietOnboarding({ state, onSaved, onCancel }: { state: DietState; onSaved: (state: DietState) => void; onCancel?: () => void }) {
  const calculated = useMemo(() => calculateProvisionalTargets(state.profile), [state.profile]);
  const initialDraft = useMemo(() => makeDraft(state), [state]);
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    setUnsavedDietChanges(dirty);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      setUnsavedDietChanges(false);
    };
  }, [dirty, saving]);

  function update<K extends keyof DietOnboardingDraft>(field: K, value: DietOnboardingDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors({});
    setSaveError("");
  }

  function updateMealCount(value: number) {
    update("mealCount", value);
    setDraft((current) => ({ ...current, mealCount: value, mealTimes: defaultTimes(value) }));
  }

  function validateCurrentStep() {
    const next: Record<string, string> = {};
    if (step === 0 && !draft.healthEligibilityConfirmed) next.healthEligibilityConfirmed = "Confirme a elegibilidade para continuar.";
    if (step === 2) {
      if (draft.mealCount < 2 || draft.mealCount > 6) next.mealCount = "Escolha de 2 a 6 refeições.";
      if (draft.mealTimes.length !== draft.mealCount || draft.mealTimes.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) next.mealTimes = "Informe um horário válido para cada refeição.";
      if (new Set(draft.mealTimes).size !== draft.mealTimes.length) next.mealTimes = "Os horários das refeições não podem se repetir.";
    }
    if (step === 4 && (draft.cookingTimeMinutes < 0 || draft.cookingTimeMinutes > 240)) next.cookingTimeMinutes = "Use um tempo entre 0 e 240 minutos.";
    if (step === 5 || step === 6) {
      next.calories = numericError(draft.calories, "Calorias", 800, 6000, 0);
      next.proteinG = numericError(draft.proteinG, "Proteína", 0, 500, 1);
      next.carbsG = numericError(draft.carbsG, "Carboidratos", 0, 1000, 1);
      next.fatG = numericError(draft.fatG, "Gorduras", 0, 500, 1);
      Object.keys(next).forEach((key) => { if (!next[key]) delete next[key]; });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(STEP_TITLES.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!validateCurrentStep() || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const saved = await saveDietOnboarding(state.profile.id, draft, calculated);
      onSaved({ ...state, ...saved });
    } catch (error) {
      setSaveError(friendlyDietError(error));
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step + 1) / STEP_TITLES.length) * 100;

  return (
    <div className="space-y-4">
      <section className="apex-card-emphasis overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="apex-kicker mb-2">Configuração da Dieta</p><h2 className="text-[17px] font-semibold text-ink">{step + 1}. {STEP_TITLES[step]}</h2></div>
          <span className="font-stat rounded-full border border-line bg-surface px-3 py-1.5 text-[10px] text-ink-muted">{step + 1}/7</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {STEP_TITLES.map((title, index) => <span key={title} className={`shrink-0 text-[9px] ${index === step ? "font-semibold text-accent" : index < step ? "text-ink-secondary" : "text-ink-faint"}`}>{index < step ? "✓ " : ""}{title}</span>)}
        </div>
      </section>

      <section className="apex-card min-h-[330px] p-4 sm:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Vamos partir do seu Perfil</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">A meta nutricional usa os dados já confirmados no Perfil. Para alterá-los, volte ao Perfil antes de concluir.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Summary label="Objetivo" value={goalLabels[state.profile.goal!]} />
              <Summary label="Peso atual" value={`${state.profile.weight_kg?.toLocaleString("pt-BR")} kg`} />
              <Summary label="Peso-meta" value={state.profile.target_weight_kg ? `${state.profile.target_weight_kg.toLocaleString("pt-BR")} kg` : "Não se aplica"} />
              <Summary label="Ritmo" value={{ conservative: "Conservador", moderate: "Moderado", accelerated: "Acelerado" }[state.profile.goal_pace ?? "moderate"]} />
            </div>
            <label className={`flex cursor-pointer items-start gap-3 rounded-card border p-4 ${errors.healthEligibilityConfirmed ? "border-red-400/50 bg-red-400/5" : "border-line bg-surface-raised"}`}><input type="checkbox" checked={draft.healthEligibilityConfirmed} onChange={(event) => update("healthEligibilityConfirmed", event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]" /><span><span className="block text-[11px] font-semibold text-ink">Confirmo que este fluxo é adequado para mim</span><span className="mt-1 block text-[9px] leading-relaxed text-ink-muted">Tenho 18 anos ou mais, considero-me um adulto saudável, não estou em gestação ou amamentação (quando aplicável) e não possuo condição que exija acompanhamento nutricional clínico.</span>{errors.healthEligibilityConfirmed && <span className="mt-1 block text-[9px] text-red-300">{errors.healthEligibilityConfirmed}</span>}</span></label>
            <button type="button" onClick={() => navigateTo("configuracoes")} className="apex-button-secondary">Editar no Perfil</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Como o treino entra na sua rotina?</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Isso ajudará a distribuir refeições e energia quando o plano semanal for gerado.</p></div>
            <div className="grid gap-2 sm:grid-cols-2"><Summary label="Nível de atividade" value={activityLabels[state.profile.activity_level_selected!]} /><Summary label="Treinos por semana" value={state.profile.training_frequency === null ? "Não informado" : String(state.profile.training_frequency)} /></div>
            <Field label="Horário habitual do treino"><SelectInput value={draft.trainingTime} onChange={(event) => update("trainingTime", event.target.value as DietOnboardingDraft["trainingTime"])}><option value="morning">Manhã</option><option value="afternoon">Tarde</option><option value="evening">Noite</option><option value="varies">Varia conforme o dia</option><option value="none">Não treino atualmente</option></SelectInput></Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Quantas refeições fazem sentido?</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Escolha uma rotina realista. Você poderá mudar isso depois.</p></div>
            <Field label="Refeições por dia" error={errors.mealCount}><SelectInput value={draft.mealCount} onChange={(event) => updateMealCount(Number(event.target.value))}>{[2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} refeições</option>)}</SelectInput></Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{draft.mealTimes.map((time, index) => <Field key={index} label={`Refeição ${index + 1}`}><TextInput type="time" value={time} onChange={(event) => update("mealTimes", draft.mealTimes.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></Field>)}</div>
            {errors.mealTimes && <p className="text-[10px] text-status-error">{errors.mealTimes}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Preferências e restrições</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Separe vários itens com vírgulas. Alergias serão tratadas como restrições obrigatórias na geração.</p></div>
            <Field label="Padrão alimentar"><SelectInput value={draft.dietaryPattern} onChange={(event) => update("dietaryPattern", event.target.value as DietOnboardingDraft["dietaryPattern"])}><option value="omnivore">Onívoro</option><option value="vegetarian">Vegetariano</option><option value="vegan">Vegano</option><option value="pescatarian">Pescetariano</option></SelectInput></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Alergias" hint="Ex.: amendoim, leite"><TextInput value={draft.allergies} onChange={(event) => update("allergies", event.target.value)} placeholder="Nenhuma" /></Field>
              <Field label="Outras restrições" hint="Ex.: sem lactose"><TextInput value={draft.restrictions} onChange={(event) => update("restrictions", event.target.value)} placeholder="Nenhuma" /></Field>
              <Field label="Alimentos que não gosta"><TextInput value={draft.dislikedFoods} onChange={(event) => update("dislikedFoods", event.target.value)} placeholder="Ex.: berinjela" /></Field>
              <Field label="Alimentos favoritos"><TextInput value={draft.favoriteFoods} onChange={(event) => update("favoriteFoods", event.target.value)} placeholder="Ex.: arroz, frango" /></Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Praticidade do plano</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Essas escolhas orientarão variedade, custo e complexidade das refeições.</p></div>
            <Field label="Tempo disponível para preparar uma refeição" error={errors.cookingTimeMinutes}><div className="flex items-center gap-3"><input type="range" min="0" max="120" step="5" value={draft.cookingTimeMinutes} onChange={(event) => update("cookingTimeMinutes", Number(event.target.value))} className="min-w-0 flex-1 accent-[var(--accent-primary)]" /><span className="font-stat w-16 text-right text-[11px] text-ink-secondary">{draft.cookingTimeMinutes} min</span></div></Field>
            <ChoiceGrid value={draft.budgetLevel} onChange={(value) => update("budgetLevel", value)} options={[{ value: "economical", label: "Econômico", description: "Prioriza itens acessíveis." }, { value: "moderate", label: "Moderado", description: "Equilibra custo e opções." }, { value: "flexible", label: "Flexível", description: "Maior liberdade de ingredientes." }]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Variedade"><SelectInput value={draft.varietyLevel} onChange={(event) => update("varietyLevel", event.target.value as DietOnboardingDraft["varietyLevel"])}><option value="varied">Bem variada</option><option value="balanced">Equilibrada</option><option value="practical">Prática e repetível</option></SelectInput></Field>
              <Field label="Estilo das refeições"><SelectInput value={draft.mealStyle} onChange={(event) => update("mealStyle", event.target.value as DietOnboardingDraft["mealStyle"])}><option value="simple">Preparos simples</option><option value="mixed">Mistura simples e receitas</option><option value="recipes">Mais receitas completas</option></SelectInput></Field>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-card border border-amber-300/20 bg-amber-300/5 p-4"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" /><div><p className="text-[12px] font-semibold text-amber-200">Estimativa editável e provisória</p><p className="mt-1 text-[10px] leading-relaxed text-amber-100/75">Calculada a partir do Perfil para adultos saudáveis. Não é prescrição clínica e deve ser revisada por profissional antes de uso comercial.</p></div></div>
            <div><h3 className="text-[15px] font-semibold text-ink">Ajuste suas metas iniciais</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Alterar qualquer valor marcará a meta como ajustada manualmente. O Apex guardará os dados usados no cálculo.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Calorias (kcal)" error={errors.calories}><TextInput inputMode="numeric" value={draft.calories} onChange={(event) => update("calories", event.target.value)} error={Boolean(errors.calories)} /></Field>
              <Field label="Proteína (g)" error={errors.proteinG}><TextInput inputMode="decimal" value={draft.proteinG} onChange={(event) => update("proteinG", event.target.value)} error={Boolean(errors.proteinG)} /></Field>
              <Field label="Carboidratos (g)" error={errors.carbsG}><TextInput inputMode="decimal" value={draft.carbsG} onChange={(event) => update("carbsG", event.target.value)} error={Boolean(errors.carbsG)} /></Field>
              <Field label="Gorduras (g)" error={errors.fatG}><TextInput inputMode="decimal" value={draft.fatG} onChange={(event) => update("fatG", event.target.value)} error={Boolean(errors.fatG)} /></Field>
            </div>
            <button type="button" onClick={() => setDraft((current) => ({ ...current, calories: String(calculated.calories), proteinG: String(calculated.protein_g), carbsG: String(calculated.carbs_g), fatG: String(calculated.fat_g) }))} className="apex-button-secondary"><Sparkles size={15} />Restaurar estimativa do Apex</button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div><h3 className="text-[15px] font-semibold text-ink">Revise antes de salvar</h3><p className="mt-2 text-[11px] leading-relaxed text-ink-muted">Todos estes dados serão vinculados à sua conta no Supabase.</p></div>
            <div className="grid gap-2 sm:grid-cols-2"><Summary label="Objetivo" value={goalLabels[state.profile.goal!]} /><Summary label="Rotina" value={`${draft.mealCount} refeições · ${activityLabels[state.profile.activity_level_selected!]}`} /><Summary label="Padrão alimentar" value={{ omnivore: "Onívoro", vegetarian: "Vegetariano", vegan: "Vegano", pescatarian: "Pescetariano" }[draft.dietaryPattern]} /><Summary label="Preparo" value={`${draft.cookingTimeMinutes} min · ${{ economical: "econômico", moderate: "moderado", flexible: "flexível" }[draft.budgetLevel]}`} /></div>
            <div className="rounded-card border border-line-accent bg-accent-subtle p-4"><p className="apex-kicker mb-3">Metas provisórias</p><div className="grid grid-cols-4 gap-2 text-center"><Macro value={draft.calories} label="kcal" /><Macro value={draft.proteinG} label="proteína" /><Macro value={draft.carbsG} label="carbo" /><Macro value={draft.fatG} label="gordura" /></div></div>
            {saveError && <div className="flex items-start gap-2 rounded-card border border-red-400/20 bg-red-400/5 p-3 text-[10px] leading-relaxed text-red-300"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{saveError}</div>}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{step > 0 ? <button type="button" disabled={saving} onClick={() => setStep((current) => current - 1)} className="apex-button-secondary"><ArrowLeft size={15} />Voltar</button> : onCancel ? <button type="button" onClick={() => { if (!dirty || window.confirm("Descartar alterações da Dieta?")) onCancel(); }} className="apex-button-secondary">Cancelar</button> : null}</div>
        {step < STEP_TITLES.length - 1 ? <button type="button" onClick={nextStep} className="apex-button-primary">Continuar<ArrowRight size={15} /></button> : <button type="button" disabled={saving} onClick={() => void save()} className="apex-button-primary disabled:cursor-not-allowed disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Salvando..." : "Salvar e concluir"}</button>}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-card border border-line bg-surface-raised p-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p><p className="mt-1.5 text-[12px] font-semibold text-ink">{value}</p></div>;
}

function Macro({ value, label }: { value: string; label: string }) {
  return <div><p className="font-stat text-[15px] font-semibold text-accent">{value}</p><p className="mt-1 text-[8px] uppercase tracking-wide text-ink-muted">{label}</p></div>;
}
