"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getProfileCompleteness } from "@/lib/profile/completeness";
import { loadProfile } from "@/lib/profile/service";
import { navigateTo } from "@/lib/navigationEvents";

export default function ProfileDependencyNotice({ feature }: { feature: "Treino" | "Dieta" }) {
  const { user, loading } = useAuth();
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void loadProfile(user)
      .then((profile) => {
        if (active) setMissing(getProfileCompleteness(profile).missing);
      })
      .catch(() => {
        if (active) setMissing(null);
      });
    return () => { active = false; };
  }, [loading, user]);

  if (!missing?.length) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" /><p className="text-[10px] leading-relaxed text-amber-100">Personalização limitada em {feature}: faltam {missing.join(", ").toLowerCase()}.</p></div>
      <button type="button" onClick={() => navigateTo("configuracoes")} className="shrink-0 rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] font-semibold text-amber-200 hover:bg-amber-300/10">Completar Perfil</button>
    </div>
  );
}
