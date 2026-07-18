"use client";

import { useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
import { CollapsibleCard, Field, SaveActions, SelectInput, TextInput, friendlyProfileError, type SaveStatus } from "@/components/profile/ProfileFields";
import { suggestActivityLevel } from "@/lib/profile/activity";
import type { ActivityAssessment, ApexProfile, GoalDraft } from "@/lib/profile/types";
import { hasErrors, validateGoal } from "@/lib/profile/validation";
import { updateGoal } from "@/lib/profile/service";

type GoalField = "goal" | "targetWeightKg" | "activityLevelSelected" | "trainingFrequency" | "goalPace" | "assessment";

const EMPTY_ASSESSMENT: ActivityAssessment = { workRoutine: "", stepsRange: "", dailyMovement: "" };
const activityLabels = { sedentary: "Sedentário", light: "Leve", moderate: "Moderado", high: "Alto" };

function makeDraft(profile: ApexProfile): GoalDraft {
  return {
    goal: profile.goal ?? "",
    targetWeightKg: profile.target_weight_kg === null ? "" : String(profile.target_weight_kg).replace(".", ","),
    activityLevelSuggested: profile.activity_level_suggested ?? "",
    activityLevelSelected: profile.activity_level_selected ?? "",
    activityAssessment: profile.activity_assessment ?? EMPTY_ASSESSMENT,
    trainingFrequency: profile.training_frequency === null ? "" : String(profile.training_frequency),
    goalPace: profile.goal_pace ?? "moderate",
  };
}

export default function GoalCard({ profile, onProfileChange, onDirtyChange }: { profile: ApexProfile; onProfileChange: (profile: ApexProfile) => void; onDirtyChange: (dirty: boolean) => void }) {
  const initial = makeDraft(profile);
  const [draft, setDraft] = useState<GoalDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<GoalField, string>>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const generatedSuggestion = useMemo(() => {
    const frequency = draft.trainingFrequency.trim() ? Number(draft.trainingFrequency) : null;
    return suggestActivityLevel(draft.activityAssessment, Number.isFinite(frequency) ? frequency : null);
  }, [draft.activityAssessment, draft.trainingFrequency]);

  useEffect(() => {
    if (!generatedSuggestion) return;
    setDraft((current) => {
      if (current.activityLevelSuggested === generatedSuggestion) return current;
      return {
        ...current,
        activityLevelSuggested: generatedSuggestion,
        activityLevelSelected: current.activityLevelSelected || generatedSuggestion,
      };
    });
    setErrors((current) => ({ ...current, assessment: undefined, activityLevelSelected: undefined }));
  }, [generatedSuggestion]);

  function setField<K extends keyof GoalDraft>(field: K, value: GoalDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value, ...(field === "goal" && value === "maintain_weight" ? { targetWeightKg: "" } : {}) }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
  }

  function setAssessment<K extends keyof ActivityAssessment>(field: K, value: ActivityAssessment[K]) {
    setDraft((current) => ({ ...current, activityAssessment: { ...current.activityAssessment, [field]: value } }));
    setErrors((current) => ({ ...current, assessment: undefined }));
    if (status !== "idle") setStatus("idle");
  }

  async function save() {
    const result = validateGoal(draft, profile.weight_kg);
    setErrors(result.errors);
    if (hasErrors(result.errors)) return;
    setStatus("saving");
    try {
      const updated = await updateGoal(profile.id, draft);
      onProfileChange(updated);
      setDraft(makeDraft(updated));
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setErrorMessage(friendlyProfileError(error));
      setStatus("error");
    }
  }

  function discard() {
    if (!window.confirm("Descartar as alterações do cartão Objetivo?")) return;
    setDraft(makeDraft(profile));
    setErrors({});
    setStatus("idle");
  }

  return (
    <CollapsibleCard title="Objetivo" icon={Target}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Objetivo" error={errors.goal}>
            <SelectInput value={draft.goal} onChange={(event) => setField("goal", event.target.value as GoalDraft["goal"])} error={Boolean(errors.goal)}>
              <option value="">Selecione</option><option value="lose_weight">Emagrecer</option><option value="maintain_weight">Manter peso</option><option value="gain_muscle">Ganhar massa</option>
            </SelectInput>
          </Field>
          {draft.goal !== "maintain_weight" && <Field label="Peso-meta (kg)" error={errors.targetWeightKg} hint={profile.weight_kg ? `Peso atual: ${profile.weight_kg.toLocaleString("pt-BR")} kg` : "Preencha primeiro o peso atual em Dados físicos."}><TextInput inputMode="decimal" value={draft.targetWeightKg} onChange={(event) => setField("targetWeightKg", event.target.value)} error={Boolean(errors.targetWeightKg)} placeholder="Ex.: 72" /></Field>}
          <Field label="Frequência de treinos por semana — opcional" error={errors.trainingFrequency}><TextInput inputMode="numeric" value={draft.trainingFrequency} onChange={(event) => setField("trainingFrequency", event.target.value)} error={Boolean(errors.trainingFrequency)} placeholder="Ex.: 4" /></Field>
          <Field label="Ritmo da meta" error={errors.goalPace} hint="Sugestão inicial: moderado. Você pode alterar.">
            <SelectInput value={draft.goalPace} onChange={(event) => setField("goalPace", event.target.value as GoalDraft["goalPace"])} error={Boolean(errors.goalPace)}><option value="conservative">Conservador</option><option value="moderate">Moderado</option><option value="accelerated">Acelerado</option></SelectInput>
          </Field>
        </div>

        <div className="rounded-xl border border-apex-border bg-apex-surface p-4">
          <div className="mb-3"><p className="text-[11px] font-medium text-apex-white">Avaliação do nível de atividade</p><p className="mt-1 text-[9px] leading-relaxed text-apex-faint">A sugestão considera sua rotina e serve apenas para personalização do Apex.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rotina de trabalho"><SelectInput value={draft.activityAssessment.workRoutine} onChange={(event) => setAssessment("workRoutine", event.target.value as ActivityAssessment["workRoutine"])}><option value="">Selecione</option><option value="seated">Principalmente sentado</option><option value="mixed">Alterna sentado e em movimento</option><option value="active">Maior parte em movimento</option><option value="very_active">Trabalho fisicamente intenso</option></SelectInput></Field>
            <Field label="Passos aproximados por dia"><SelectInput value={draft.activityAssessment.stepsRange} onChange={(event) => setAssessment("stepsRange", event.target.value as ActivityAssessment["stepsRange"])}><option value="">Selecione</option><option value="under_5000">Menos de 5 mil</option><option value="5000_7999">5 a 8 mil</option><option value="8000_11999">8 a 12 mil</option><option value="12000_plus">Mais de 12 mil</option></SelectInput></Field>
            <Field label="Movimento geral no dia"><SelectInput value={draft.activityAssessment.dailyMovement} onChange={(event) => setAssessment("dailyMovement", event.target.value as ActivityAssessment["dailyMovement"])}><option value="">Selecione</option><option value="low">Baixo</option><option value="medium">Moderado</option><option value="high">Alto</option><option value="very_high">Muito alto</option></SelectInput></Field>
            <Field label="Nível escolhido" error={errors.activityLevelSelected} hint={generatedSuggestion ? `Sugestão do Apex: ${activityLabels[generatedSuggestion]}.` : "Complete a avaliação para receber uma sugestão."}>
              <SelectInput value={draft.activityLevelSelected} onChange={(event) => setField("activityLevelSelected", event.target.value as GoalDraft["activityLevelSelected"])} error={Boolean(errors.activityLevelSelected)}><option value="">Selecione</option><option value="sedentary">Sedentário</option><option value="light">Leve</option><option value="moderate">Moderado</option><option value="high">Alto</option></SelectInput>
            </Field>
          </div>
          {errors.assessment && <p className="mt-3 text-[10px] text-red-300">{errors.assessment}</p>}
        </div>
        <SaveActions status={status} dirty={dirty} errorMessage={errorMessage} successMessage="Objetivo e nível de atividade salvos." onSave={() => void save()} onDiscard={discard} />
      </div>
    </CollapsibleCard>
  );
}
