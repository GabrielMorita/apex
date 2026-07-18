"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, LoaderCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import DietHome from "@/components/diet/DietHome";
import DietOnboarding from "@/components/diet/DietOnboarding";
import { ageFromBirthDate, canCalculateTargets } from "@/lib/diet/calculation";
import { loadDietState } from "@/lib/diet/service";
import type { DietState } from "@/lib/diet/types";
import { getProfileCompleteness } from "@/lib/profile/completeness";
import { navigateTo } from "@/lib/navigationEvents";
import SensitiveDataNotice from "@/components/privacy/SensitiveDataNotice";

function friendlyLoadError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("diet_preferences") || message.includes("nutrition_targets")) return "A migration v0.12.0 da Dieta ainda não foi executada no Supabase.";
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  return "Não foi possível carregar a Dieta. Atualize a página ou entre novamente.";
}

export default function DietModule() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DietState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Sua sessão não está disponível. Entre novamente para acessar a Dieta.");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void loadDietState(user)
      .then((loaded) => { if (active) setState(loaded); })
      .catch((loadError) => { if (active) setError(friendlyLoadError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  const configured = Boolean(state?.preferences?.onboarding_completed && state.targets);
  const isMinor = Boolean(state?.profile.date_of_birth && ageFromBirthDate(state.profile.date_of_birth) < 18);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Dieta" subtitle="Plano, alimentos, compras e ajustes nutricionais" />
      <div className="apex-page max-w-3xl">
        <SensitiveDataNotice area="Dieta" />
        {loading && <div className="flex items-center gap-2 rounded-card border border-line bg-surface-raised px-5 py-4 text-[11px] text-ink-muted"><LoaderCircle size={14} className="animate-spin text-accent" />Carregando sua Dieta...</div>}
        {!loading && error && <div className="flex items-start gap-2 rounded-card border border-red-400/20 bg-red-400/5 px-5 py-4 text-[11px] leading-relaxed text-red-300"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}
        {!loading && !error && state && isMinor && (
          <div className="apex-card p-5">
            <div className="flex items-start gap-3"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" /><div><p className="text-[13px] font-semibold text-ink">A Dieta do Apex não atende menores de 18 anos</p><p className="mt-2 text-[10px] leading-relaxed text-ink-muted">Esta versão foi delimitada para adultos saudáveis. Procure orientação profissional adequada; o restante do aplicativo continua disponível.</p></div></div>
          </div>
        )}
        {!loading && !error && state && !isMinor && !canCalculateTargets(state.profile) && (
          <div className="apex-card p-5">
            <div className="flex items-start gap-3"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-300" /><div><p className="text-[13px] font-semibold text-ink">Complete os dados essenciais do Perfil</p><p className="mt-2 text-[10px] leading-relaxed text-ink-muted">Para gerar uma estimativa inicial, faltam: {getProfileCompleteness(state.profile).missing.join(", ").toLowerCase()}. O restante do Apex continua disponível.</p></div></div>
            <button type="button" onClick={() => navigateTo("configuracoes")} className="apex-button-primary mt-4">Completar Perfil</button>
          </div>
        )}
        {!loading && !error && state && !isMinor && canCalculateTargets(state.profile) && (!configured || editing) && <DietOnboarding state={state} onSaved={(saved) => { setState(saved); setEditing(false); }} onCancel={configured ? () => setEditing(false) : undefined} />}
        {!loading && !error && state && !isMinor && configured && !editing && state.preferences && state.targets && <DietHome state={state} onEdit={() => setEditing(true)} onTargetsChange={(targets) => setState((current) => current ? { ...current, targets } : current)} />}
      </div>
    </motion.div>
  );
}
