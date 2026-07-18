"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { Camera, Mail, Trash2, UserRound } from "lucide-react";
import AvatarEditor from "@/components/profile/AvatarEditor";
import { CollapsibleCard, Field, SaveActions, TextInput, friendlyProfileError, type SaveStatus } from "@/components/profile/ProfileFields";
import type { AccountDraft, ApexProfile } from "@/lib/profile/types";
import { hasErrors, validateAccount } from "@/lib/profile/validation";
import { removeAvatar, updateAccount, uploadAvatar } from "@/lib/profile/service";

type AccountField = "fullName" | "dateOfBirth" | "requestedEmail";

function makeDraft(profile: ApexProfile): AccountDraft {
  return { fullName: profile.full_name ?? "", dateOfBirth: profile.date_of_birth ?? "", requestedEmail: "" };
}

function calculateAge(date: string) {
  if (!date) return null;
  const birth = new Date(`${date}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export default function AccountCard({ user, profile, avatarUrl, onProfileChange, onAvatarChange, onDirtyChange, refreshUser }: {
  user: User;
  profile: ApexProfile;
  avatarUrl: string | null;
  onProfileChange: (profile: ApexProfile) => void;
  onAvatarChange: (url: string | null) => void;
  onDirtyChange: (dirty: boolean) => void;
  refreshUser: () => Promise<void>;
}) {
  const initial = makeDraft(profile);
  const [draft, setDraft] = useState<AccountDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<AccountField, string>>>({});
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>((user as User & { new_email?: string }).new_email ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<SaveStatus>("idle");
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = draft.fullName !== initial.fullName || draft.dateOfBirth !== initial.dateOfBirth || Boolean(draft.requestedEmail.trim());
  const age = calculateAge(draft.dateOfBirth);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  function setField(field: keyof AccountDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
  }

  async function save() {
    const nextErrors = validateAccount(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    setStatus("saving");
    try {
      const result = await updateAccount(user, draft);
      onProfileChange(result.profile);
      setDraft(makeDraft(result.profile));
      if (result.pendingEmail) setPendingEmail(result.pendingEmail);
      await refreshUser();
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setErrorMessage(friendlyProfileError(error));
      setStatus("error");
    }
  }

  function discard() {
    if (!window.confirm("Descartar as alterações do cartão Conta?")) return;
    setDraft(makeDraft(profile));
    setErrors({});
    setStatus("idle");
  }

  function chooseAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Use uma imagem JPG, PNG ou WebP.");
      setAvatarStatus("error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("A imagem deve ter no máximo 8 MB.");
      setAvatarStatus("error");
      return;
    }
    setAvatarError("");
    setAvatarStatus("idle");
    setAvatarFile(file);
  }

  async function confirmAvatar(blob: Blob) {
    setAvatarStatus("saving");
    try {
      const result = await uploadAvatar(user.id, blob, profile.avatar_path);
      onProfileChange(result.profile);
      onAvatarChange(result.avatarUrl);
      setAvatarFile(null);
      setAvatarStatus("saved");
      window.setTimeout(() => setAvatarStatus("idle"), 3000);
    } catch (error) {
      setAvatarFile(null);
      setAvatarError(friendlyProfileError(error));
      setAvatarStatus("error");
    }
  }

  async function deleteAvatar() {
    if (!window.confirm("Remover sua foto de perfil?")) return;
    setAvatarStatus("saving");
    try {
      const updated = await removeAvatar(user.id, profile.avatar_path);
      onProfileChange(updated);
      onAvatarChange(null);
      setAvatarStatus("saved");
      window.setTimeout(() => setAvatarStatus("idle"), 3000);
    } catch (error) {
      setAvatarError(friendlyProfileError(error));
      setAvatarStatus("error");
    }
  }

  const initials = (draft.fullName || user.email || "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <>
      <CollapsibleCard title="Conta" icon={UserRound}>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-apex-border bg-apex-surface text-xl font-semibold text-gold">
              {avatarUrl ? <Image src={avatarUrl} alt="Foto de perfil" width={80} height={80} unoptimized className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} className="hidden" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarStatus === "saving"} className="flex items-center gap-2 rounded-lg border border-apex-border bg-apex-surface px-3 py-2 text-[11px] text-apex-muted hover:border-apex-border2 hover:text-apex-white disabled:opacity-50"><Camera size={13} />{profile.avatar_path ? "Trocar foto" : "Enviar foto"}</button>
                {profile.avatar_path && <button type="button" onClick={() => void deleteAvatar()} disabled={avatarStatus === "saving"} className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-[11px] text-red-300 hover:border-red-400/40 disabled:opacity-50"><Trash2 size={13} />Remover</button>}
              </div>
              <p className="text-[9px] text-apex-faint">JPG, PNG ou WebP, até 8 MB. A imagem será recortada e otimizada.</p>
              {avatarStatus === "saving" && <p className="text-[10px] text-amber-200">Salvando foto...</p>}
              {avatarStatus === "saved" && <p className="text-[10px] text-emerald-400">Foto atualizada.</p>}
              {avatarStatus === "error" && <p className="text-[10px] text-red-300">{avatarError}</p>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.fullName}><TextInput value={draft.fullName} onChange={(event) => setField("fullName", event.target.value)} error={Boolean(errors.fullName)} autoComplete="name" /></Field>
            <Field label="Data de nascimento" error={errors.dateOfBirth} hint={age !== null ? `Idade calculada: ${age} anos` : undefined}><TextInput type="date" value={draft.dateOfBirth} onChange={(event) => setField("dateOfBirth", event.target.value)} error={Boolean(errors.dateOfBirth)} /></Field>
          </div>

          <div className="rounded-lg border border-apex-border bg-apex-surface p-3">
            <div className="mb-3 flex items-center gap-2"><Mail size={13} className="text-gold" /><p className="text-[10px] font-medium text-apex-white">E-mail da conta</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail atual"><TextInput type="email" value={user.email ?? ""} readOnly className="cursor-not-allowed opacity-70" /></Field>
              <Field label="Solicitar novo e-mail" error={errors.requestedEmail} hint="O e-mail atual continua válido até a confirmação."><TextInput type="email" value={draft.requestedEmail} onChange={(event) => setField("requestedEmail", event.target.value)} error={Boolean(errors.requestedEmail)} placeholder="novo@email.com" autoComplete="email" /></Field>
            </div>
            {pendingEmail && <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[10px] leading-relaxed text-amber-200">Confirmação pendente para <strong>{pendingEmail}</strong>. O e-mail atual não será substituído até a confirmação.</div>}
          </div>

          <SaveActions status={status} dirty={dirty} errorMessage={errorMessage} successMessage={pendingEmail ? "Dados salvos e confirmação de e-mail solicitada." : "Dados da conta salvos."} onSave={() => void save()} onDiscard={discard} />
        </div>
      </CollapsibleCard>
      {avatarFile && <AvatarEditor file={avatarFile} onCancel={() => setAvatarFile(null)} onConfirm={confirmAvatar} />}
    </>
  );
}
