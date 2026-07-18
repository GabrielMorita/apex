"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { CollapsibleCard, Field, TextInput, friendlyProfileError } from "@/components/profile/ProfileFields";
import { signOutOtherSessions, updatePassword } from "@/lib/account/service";
import { translateAuthError } from "@/lib/authErrors";

type ActionStatus = "idle" | "loading" | "success" | "error";

export default function SecurityCard() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<ActionStatus>("idle");
  const [passwordError, setPasswordError] = useState("");
  const [sessionsStatus, setSessionsStatus] = useState<ActionStatus>("idle");
  const [sessionsError, setSessionsError] = useState("");

  async function savePassword() {
    setPasswordError("");
    if (password.length < 8) {
      setPasswordError("A senha precisa ter pelo menos 8 caracteres.");
      setPasswordStatus("error");
      return;
    }
    if (password !== confirmation) {
      setPasswordError("As senhas não coincidem.");
      setPasswordStatus("error");
      return;
    }
    setPasswordStatus("loading");
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmation("");
      setPasswordStatus("success");
      window.setTimeout(() => setPasswordStatus("idle"), 3500);
    } catch (error) {
      const message = error instanceof Error ? translateAuthError(error.message) : friendlyProfileError(error);
      setPasswordError(message);
      setPasswordStatus("error");
    }
  }

  async function closeOtherSessions() {
    if (!window.confirm("Encerrar todas as outras sessões do Apex? Esta sessão continuará ativa.")) return;
    setSessionsStatus("loading");
    setSessionsError("");
    try {
      await signOutOtherSessions();
      setSessionsStatus("success");
      window.setTimeout(() => setSessionsStatus("idle"), 3500);
    } catch (error) {
      setSessionsError(friendlyProfileError(error));
      setSessionsStatus("error");
    }
  }

  return (
    <CollapsibleCard title="Segurança" icon={ShieldCheck} defaultOpen={false}>
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2"><KeyRound size={13} className="text-gold" /><p className="text-[11px] font-medium text-apex-white">Alterar senha</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nova senha"><TextInput type="password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordStatus("idle"); }} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" /></Field>
            <Field label="Confirmar nova senha"><TextInput type="password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setPasswordStatus("idle"); }} autoComplete="new-password" placeholder="Repita a senha" /></Field>
          </div>
          <button type="button" onClick={() => void savePassword()} disabled={!password || !confirmation || passwordStatus === "loading"} className="mt-3 flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-[12px] font-medium text-apex-bg disabled:opacity-45">
            {passwordStatus === "loading" ? <LoaderCircle size={13} className="animate-spin" /> : <KeyRound size={13} />} {passwordStatus === "loading" ? "Atualizando..." : "Atualizar senha"}
          </button>
          {passwordStatus === "success" && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400"><CheckCircle2 size={12} />Senha atualizada.</p>}
          {passwordStatus === "error" && <p role="alert" className="mt-2 text-[10px] text-red-300">{passwordError}</p>}
        </div>

        <div className="border-t border-apex-border pt-4">
          <div className="mb-2 flex items-center gap-2"><LogOut size={13} className="text-gold" /><p className="text-[11px] font-medium text-apex-white">Outros dispositivos</p></div>
          <p className="mb-3 text-[10px] leading-relaxed text-apex-faint">Revoga as sessões em outros navegadores e dispositivos. Esta sessão permanece conectada.</p>
          <button type="button" onClick={() => void closeOtherSessions()} disabled={sessionsStatus === "loading"} className="flex items-center gap-2 rounded-lg border border-apex-border bg-apex-surface px-4 py-2.5 text-[11px] text-apex-muted hover:border-apex-border2 hover:text-apex-white disabled:opacity-50">
            {sessionsStatus === "loading" ? <LoaderCircle size={13} className="animate-spin" /> : <LogOut size={13} />} {sessionsStatus === "loading" ? "Encerrando..." : "Sair dos outros dispositivos"}
          </button>
          {sessionsStatus === "success" && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400"><CheckCircle2 size={12} />Outras sessões encerradas.</p>}
          {sessionsStatus === "error" && <p role="alert" className="mt-2 text-[10px] text-red-300">{sessionsError}</p>}
        </div>
      </div>
    </CollapsibleCard>
  );
}
