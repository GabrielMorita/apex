"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import { translateAuthError } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/atualizar-senha`,
    });

    if (resetError) {
      setError(translateAuthError(resetError.message));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Recuperação"
      title="Redefina sua senha"
      description="Informe seu e-mail e enviaremos um link seguro para criar uma nova senha."
      footer={<Link href="/entrar" className="font-semibold text-accent">Voltar para o login</Link>}
    >
      {sent ? (
        <div className="rounded-card border border-emerald-400/25 bg-emerald-400/10 p-4 text-center">
          <CheckCircle2 size={26} className="mx-auto text-emerald-300" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">E-mail enviado</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">Confira sua caixa de entrada e também a pasta de spam.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="E-mail da conta" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
          {error && <p role="alert" className="rounded-control border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-[12px] text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="apex-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />}
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
