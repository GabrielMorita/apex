let unsavedContext: "Perfil" | "Dieta" | null = null;

export function setUnsavedProfileChanges(value: boolean) {
  unsavedContext = value ? "Perfil" : unsavedContext === "Perfil" ? null : unsavedContext;
}

export function setUnsavedDietChanges(value: boolean) {
  unsavedContext = value ? "Dieta" : unsavedContext === "Dieta" ? null : unsavedContext;
}

export function confirmDiscardChanges() {
  if (!unsavedContext) return true;
  const confirmed = window.confirm(`Existem alterações não salvas em ${unsavedContext}. Deseja descartá-las?`);
  if (confirmed) unsavedContext = null;
  return confirmed;
}

export const confirmDiscardProfileChanges = confirmDiscardChanges;
