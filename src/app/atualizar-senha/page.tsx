"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import { translateAuthError } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });

    if (updateError) {
      setError(translateAuthError(updateError.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    window.setTimeout(() => window.location.assign("/"), 1200);
  }

  return (
    <AuthShell eyebrow="Segurança" title="Crie uma nova senha" description="Use uma senha diferente das que você utiliza em outros serviços.">
      {success ? (
        <div className="rounded-card border border-emerald-400/25 bg-emerald-400/10 p-4 text-center">
          <CheckCircle2 size={26} className="mx-auto text-emerald-300" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">Senha atualizada</h2>
          <p className="mt-1 text-[12px] text-ink-muted">Redirecionando para o Apex...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="Nova senha" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" />
          <AuthField label="Confirmar nova senha" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita sua senha" />
          {error && <p role="alert" className="rounded-control border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-[12px] text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="apex-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {loading ? "Atualizando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
