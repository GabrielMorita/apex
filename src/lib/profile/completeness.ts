import type { ApexProfile } from "@/lib/profile/types";

type CompletenessField = { complete: boolean; label: string };

export type ProfileCompleteness = {
  complete: boolean;
  completed: number;
  total: number;
  percentage: number;
  missing: string[];
};

export function getProfileCompleteness(profile: ApexProfile | null): ProfileCompleteness {
  if (!profile) return { complete: false, completed: 0, total: 6, percentage: 0, missing: ["Dados do perfil"] };

  const goalComplete = Boolean(
    profile.goal &&
      (profile.goal === "maintain_weight" || (profile.target_weight_kg !== null && profile.target_weight_kg > 0)),
  );

  const fields: CompletenessField[] = [
    { label: "Nome", complete: Boolean(profile.full_name?.trim()) },
    { label: "Data de nascimento", complete: Boolean(profile.date_of_birth) },
    { label: "Sexo biológico", complete: Boolean(profile.biological_sex) },
    { label: "Altura", complete: profile.height_cm !== null && profile.height_cm > 0 },
    { label: "Peso atual", complete: profile.weight_kg !== null && profile.weight_kg > 0 },
    { label: profile.goal === "maintain_weight" ? "Objetivo" : "Objetivo e peso-meta", complete: goalComplete },
  ];
  const completed = fields.filter((field) => field.complete).length;

  return {
    complete: completed === fields.length,
    completed,
    total: fields.length,
    percentage: Math.round((completed / fields.length) * 100),
    missing: fields.filter((field) => !field.complete).map((field) => field.label),
  };
}
