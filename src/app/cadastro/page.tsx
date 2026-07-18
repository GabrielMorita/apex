"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import { translateAuthError } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";
import { PRIVACY_DOCUMENT_VERSION } from "@/lib/privacy/documents";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthDataAccepted, setHealthDataAccepted] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);

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
    if (!termsAccepted || !healthDataAccepted || !adultConfirmed) {
      setError("Confirme os itens obrigatórios para criar sua conta.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          apex_adult_confirmed: true,
          apex_terms_accepted: true,
          apex_terms_version: PRIVACY_DOCUMENT_VERSION,
          apex_privacy_acknowledged: true,
          apex_privacy_version: PRIVACY_DOCUMENT_VERSION,
          apex_health_data_accepted: true,
          apex_health_data_version: PRIVACY_DOCUMENT_VERSION,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign("/");
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Nova conta"
      title="Comece sua evolução"
      description="Crie sua conta para manter seus dados protegidos e disponíveis em qualquer dispositivo."
      footer={<>Já possui conta? <Link href="/entrar" className="font-semibold text-accent">Entrar</Link></>}
    >
      {success ? (
        <div className="rounded-card border border-emerald-400/25 bg-emerald-400/10 p-4 text-center">
          <CheckCircle2 size={26} className="mx-auto text-emerald-300" />
          <h2 className="mt-3 text-[15px] font-semibold text-ink">Confirme seu e-mail</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">Enviamos um link de confirmação para <strong className="text-ink">{email}</strong>.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="Nome" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
          <AuthField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
          <AuthField label="Senha" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" />
          <AuthField label="Confirmar senha" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita sua senha" />

          <div className="space-y-3 rounded-card border border-line bg-surface p-4">
            <label className="flex cursor-pointer items-start gap-3 text-[10px] leading-relaxed text-ink-muted"><input type="checkbox" required checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-400" /><span>Confirmo que tenho 18 anos ou mais.</span></label>
            <label className="flex cursor-pointer items-start gap-3 text-[10px] leading-relaxed text-ink-muted"><input type="checkbox" required checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-400" /><span>Li e aceito os <Link href="/termos" target="_blank" className="font-semibold text-accent">Termos de Uso</Link> e declaro ciência do <Link href="/privacidade" target="_blank" className="font-semibold text-accent">Aviso de Privacidade</Link>, versão {PRIVACY_DOCUMENT_VERSION}.</span></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-amber-300/20 bg-amber-300/5 p-3 text-[10px] leading-relaxed text-amber-100"><input type="checkbox" required checked={healthDataAccepted} onChange={(event) => setHealthDataAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-400" /><span><strong className="font-semibold">Consentimento destacado:</strong> autorizo o tratamento dos meus dados corporais, alimentares, de treino e bem-estar para personalizar o Apex, conforme o documento de <Link href="/dados-saude" target="_blank" className="font-semibold text-accent">Dados de Saúde</Link>. Poderei revogar esta escolha.</span></label>
          </div>

          {error && <p role="alert" className="rounded-control border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-[12px] text-red-300">{error}</p>}

          <button type="submit" disabled={loading} className="apex-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {loading ? "Criando conta..." : "Criar minha conta"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
