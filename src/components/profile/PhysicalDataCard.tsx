"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { CollapsibleCard, Field, SaveActions, SelectInput, TextInput, friendlyProfileError, type SaveStatus } from "@/components/profile/ProfileFields";
import type { ApexProfile, PhysicalDraft } from "@/lib/profile/types";
import { hasErrors, validatePhysical } from "@/lib/profile/validation";
import { updatePhysicalData } from "@/lib/profile/service";

type PhysicalField = "biologicalSex" | "heightCm" | "weightKg" | "bodyFatPercentage";

function displayNumber(value: number | null) {
  return value === null ? "" : String(value).replace(".", ",");
}

function makeDraft(profile: ApexProfile): PhysicalDraft {
  return {
    biologicalSex: profile.biological_sex ?? "",
    heightCm: displayNumber(profile.height_cm),
    weightKg: displayNumber(profile.weight_kg),
    bodyFatPercentage: displayNumber(profile.body_fat_percentage),
  };
}

export default function PhysicalDataCard({ profile, onProfileChange, onDirtyChange }: { profile: ApexProfile; onProfileChange: (profile: ApexProfile) => void; onDirtyChange: (dirty: boolean) => void }) {
  const initial = makeDraft(profile);
  const [draft, setDraft] = useState<PhysicalDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<PhysicalField, string>>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  function setField(field: keyof PhysicalDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
  }

  async function save() {
    const result = validatePhysical(draft);
    setErrors(result.errors);
    if (hasErrors(result.errors)) return;
    setStatus("saving");
    try {
      const updated = await updatePhysicalData(profile.id, draft);
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
    if (!window.confirm("Descartar as alterações do cartão Dados físicos?")) return;
    setDraft(makeDraft(profile));
    setErrors({});
    setStatus("idle");
  }

  return (
    <CollapsibleCard title="Dados físicos" icon={Activity}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sexo biológico" error={errors.biologicalSex}>
            <SelectInput value={draft.biologicalSex} onChange={(event) => setField("biologicalSex", event.target.value)} error={Boolean(errors.biologicalSex)}>
              <option value="">Selecione</option><option value="male">Masculino</option><option value="female">Feminino</option>
            </SelectInput>
          </Field>
          <Field label="Altura (cm)" error={errors.heightCm}><TextInput inputMode="decimal" value={draft.heightCm} onChange={(event) => setField("heightCm", event.target.value)} error={Boolean(errors.heightCm)} placeholder="Ex.: 175" /></Field>
          <Field label="Peso atual (kg)" error={errors.weightKg} hint="Uma alteração cria automaticamente um registro no histórico de peso."><TextInput inputMode="decimal" value={draft.weightKg} onChange={(event) => setField("weightKg", event.target.value)} error={Boolean(errors.weightKg)} placeholder="Ex.: 78,5" /></Field>
          <Field label="Gordura corporal (%) — opcional" error={errors.bodyFatPercentage}><TextInput inputMode="decimal" value={draft.bodyFatPercentage} onChange={(event) => setField("bodyFatPercentage", event.target.value)} error={Boolean(errors.bodyFatPercentage)} placeholder="Ex.: 18,5" /></Field>
        </div>
        <SaveActions status={status} dirty={dirty} errorMessage={errorMessage} successMessage="Dados físicos salvos." onSave={() => void save()} onDiscard={discard} />
      </div>
    </CollapsibleCard>
  );
}
