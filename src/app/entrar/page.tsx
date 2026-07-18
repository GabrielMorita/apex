"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import { translateAuthError } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const accountDeleted = searchParams.get("conta") === "excluida";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (signInError) {
      setError(translateAuthError(signInError.message));
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect");
    const safeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    window.location.assign(safeRedirect);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {accountDeleted && <p className="rounded-control border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-[12px] text-emerald-300">Sua conta foi excluída definitivamente.</p>}
      <AuthField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
      <div>
        <AuthField label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" />
        <div className="mt-2 text-right">
          <Link href="/recuperar-senha" className="text-[11px] font-semibold text-accent hover:text-accent-strong">Esqueci minha senha</Link>
        </div>
      </div>

      {error && <p role="alert" className="rounded-control border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-[12px] text-red-300">{error}</p>}

      <button type="submit" disabled={loading} className="apex-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
        {loading ? "Entrando..." : "Entrar no Apex"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Acesso seguro"
      title="Bem-vindo de volta"
      description="Entre para acessar seus hábitos, treinos, alimentação e progresso sincronizados."
      footer={<>Ainda não tem conta? <Link href="/cadastro" className="font-semibold text-accent">Criar conta</Link></>}
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-surface" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
