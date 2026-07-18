"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import AccountCard from "@/components/profile/AccountCard";
import PhysicalDataCard from "@/components/profile/PhysicalDataCard";
import GoalCard from "@/components/profile/GoalCard";
import SecurityCard from "@/components/profile/SecurityCard";
import AccountDataCard from "@/components/profile/AccountDataCard";
import type { ApexProfile } from "@/lib/profile/types";
import { getProfileCompleteness } from "@/lib/profile/completeness";
import { getAvatarUrl, loadProfile } from "@/lib/profile/service";
import { setUnsavedProfileChanges } from "@/lib/profile/navigationGuard";
import { friendlyProfileError } from "@/components/profile/ProfileFields";

export default function ProfileSettings() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ApexProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dirtyCards, setDirtyCards] = useState({ account: false, physical: false, goal: false });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Sua sessão não está disponível. Entre novamente para carregar o Perfil.");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void loadProfile(user)
      .then(async (loaded) => {
        const signedUrl = await getAvatarUrl(loaded.avatar_path);
        if (!active) return;
        setProfile(loaded);
        setAvatarUrl(signedUrl);
      })
      .catch((loadError) => {
        if (active) setError(friendlyProfileError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, user]);

  const anyDirty = dirtyCards.account || dirtyCards.physical || dirtyCards.goal;
  useEffect(() => {
    setUnsavedProfileChanges(anyDirty);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      setUnsavedProfileChanges(false);
    };
  }, [anyDirty]);

  const accountDirty = useCallback((dirty: boolean) => setDirtyCards((current) => current.account === dirty ? current : { ...current, account: dirty }), []);
  const physicalDirty = useCallback((dirty: boolean) => setDirtyCards((current) => current.physical === dirty ? current : { ...current, physical: dirty }), []);
  const goalDirty = useCallback((dirty: boolean) => setDirtyCards((current) => current.goal === dirty ? current : { ...current, goal: dirty }), []);
  const completeness = useMemo(() => getProfileCompleteness(profile), [profile]);

  if (loading) return <div className="flex items-center gap-2 rounded-xl border border-apex-border bg-apex-card px-5 py-4 text-[11px] text-apex-muted"><LoaderCircle size={14} className="animate-spin text-gold" />Carregando dados do Perfil...</div>;
  if (error || !user || !profile) return <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-[11px] leading-relaxed text-red-300"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error || "Não foi possível carregar o Perfil."}</div>;

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border px-4 py-3 ${completeness.complete ? "border-emerald-400/20 bg-emerald-400/5" : "border-amber-300/20 bg-amber-300/5"}`}>
        <div className="flex items-start gap-3">
          {completeness.complete ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" /> : <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-300" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3"><p className={`text-[11px] font-medium ${completeness.complete ? "text-emerald-300" : "text-amber-200"}`}>{completeness.complete ? "Perfil completo" : "Complete seu Perfil para melhorar a personalização"}</p><span className="font-mono text-[10px] text-apex-muted">{completeness.percentage}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25"><div className={`h-full rounded-full ${completeness.complete ? "bg-emerald-400" : "bg-amber-300"}`} style={{ width: `${completeness.percentage}%` }} /></div>
            {!completeness.complete && <p className="mt-2 text-[9px] leading-relaxed text-apex-muted">Pendentes: {completeness.missing.join(", ")}. Você pode continuar usando o Apex normalmente.</p>}
          </div>
        </div>
      </div>
      <AccountCard user={user} profile={profile} avatarUrl={avatarUrl} onProfileChange={setProfile} onAvatarChange={setAvatarUrl} onDirtyChange={accountDirty} refreshUser={refreshUser} />
      <PhysicalDataCard profile={profile} onProfileChange={setProfile} onDirtyChange={physicalDirty} />
      <GoalCard profile={profile} onProfileChange={setProfile} onDirtyChange={goalDirty} />
      <SecurityCard />
      <AccountDataCard user={user} />
    </div>
  );
}
