import type { AccountDraft, FieldErrors, GoalDraft, PhysicalDraft } from "@/lib/profile/types";

function parseDecimal(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function validateAccount(draft: AccountDraft) {
  const errors: FieldErrors<"fullName" | "dateOfBirth" | "requestedEmail"> = {};
  const name = draft.fullName.trim();
  if (!name) errors.fullName = "Informe seu nome completo.";
  else if (name.length < 2 || name.length > 120) errors.fullName = "Use entre 2 e 120 caracteres.";

  if (!draft.dateOfBirth) errors.dateOfBirth = "Informe sua data de nascimento.";
  else {
    const birthDate = new Date(`${draft.dateOfBirth}T12:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const beforeBirthday = today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
    if (beforeBirthday) age -= 1;
    if (Number.isNaN(birthDate.getTime()) || age < 18 || age > 120) errors.dateOfBirth = "Informe uma data válida para uma pessoa adulta.";
  }

  const email = draft.requestedEmail.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.requestedEmail = "Informe um e-mail válido.";
  return errors;
}

export function validatePhysical(draft: PhysicalDraft) {
  const errors: FieldErrors<"biologicalSex" | "heightCm" | "weightKg" | "bodyFatPercentage"> = {};
  const height = parseDecimal(draft.heightCm);
  const weight = parseDecimal(draft.weightKg);
  const bodyFat = parseDecimal(draft.bodyFatPercentage);

  if (!draft.biologicalSex) errors.biologicalSex = "Selecione uma opção.";
  if (height === null) errors.heightCm = "Informe sua altura.";
  else if (Number.isNaN(height) || height < 100 || height > 250) errors.heightCm = "Use um valor entre 100 e 250 cm.";
  if (weight === null) errors.weightKg = "Informe seu peso atual.";
  else if (Number.isNaN(weight) || weight < 30 || weight > 350) errors.weightKg = "Use um valor entre 30 e 350 kg.";
  if (bodyFat !== null && (Number.isNaN(bodyFat) || bodyFat < 2 || bodyFat > 75)) errors.bodyFatPercentage = "Use um valor entre 2% e 75%.";

  return { errors, values: { height, weight, bodyFat } };
}

export function validateGoal(draft: GoalDraft, currentWeight: number | null) {
  const errors: FieldErrors<"goal" | "targetWeightKg" | "activityLevelSelected" | "trainingFrequency" | "goalPace" | "assessment"> = {};
  const targetWeight = parseDecimal(draft.targetWeightKg);
  const trainingFrequency = parseDecimal(draft.trainingFrequency);

  if (!draft.goal) errors.goal = "Selecione seu objetivo.";
  if (draft.goal === "lose_weight" || draft.goal === "gain_muscle") {
    if (targetWeight === null) errors.targetWeightKg = "Informe o peso-meta.";
    else if (Number.isNaN(targetWeight) || targetWeight < 30 || targetWeight > 350) errors.targetWeightKg = "Use um valor entre 30 e 350 kg.";
    else if (currentWeight === null) errors.targetWeightKg = "Preencha primeiro o peso atual em Dados físicos.";
    else if (currentWeight !== null && draft.goal === "lose_weight" && targetWeight >= currentWeight) errors.targetWeightKg = "Para emagrecer, o peso-meta deve ser menor que o atual.";
    else if (currentWeight !== null && draft.goal === "gain_muscle" && targetWeight <= currentWeight) errors.targetWeightKg = "Para ganhar massa, o peso-meta deve ser maior que o atual.";
  }
  if (!draft.activityAssessment.workRoutine || !draft.activityAssessment.stepsRange || !draft.activityAssessment.dailyMovement) errors.assessment = "Responda às três perguntas para gerar a sugestão.";
  if (!draft.activityLevelSelected) errors.activityLevelSelected = "Escolha o nível que melhor representa sua rotina.";
  if (trainingFrequency !== null && (Number.isNaN(trainingFrequency) || !Number.isInteger(trainingFrequency) || trainingFrequency < 0 || trainingFrequency > 14)) errors.trainingFrequency = "Use um número inteiro entre 0 e 14.";
  if (!draft.goalPace) errors.goalPace = "Selecione o ritmo da meta.";

  return { errors, values: { targetWeight, trainingFrequency } };
}

export function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}
