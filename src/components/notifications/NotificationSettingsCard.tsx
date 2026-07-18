"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, ChevronDown, ChevronUp, LoaderCircle, Mail, Save, Smartphone } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { friendlyNotificationError } from "@/lib/notifications/errors";
import { loadNotificationPreferences, saveNotificationPreferences } from "@/lib/notifications/service";
import type { NotificationPreferences } from "@/lib/notifications/types";

export default function NotificationSettingsCard() {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savedPreferences, setSavedPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("Sua sessão não está disponível."); return; }
    let active = true;
    setLoading(true); setError("");
    void loadNotificationPreferences(user.id)
      .then((loaded) => { if (active) { setPreferences(loaded); setSavedPreferences(loaded); } })
      .catch((loadError) => { if (active) setError(friendlyNotificationError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user]);

  const dirty = Boolean(preferences && savedPreferences && JSON.stringify(preferences) !== JSON.stringify(savedPreferences));

  async function submit() {
    if (!user || !preferences || saving || !dirty) return;
    setSaving(true); setSaved(false); setError("");
    try {
      const updated = await saveNotificationPreferences(user.id, preferences);
      setPreferences(updated); setSavedPreferences(updated); setSaved(true);
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
      window.setTimeout(() => setSaved(false), 2200);
    } catch (saveError) {
      setError(friendlyNotificationError(saveError));
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPreferences((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  }

  return <div className="overflow-hidden rounded-xl border border-apex-border bg-apex-card">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-apex-surface">
      <BellRing size={15} className="shrink-0 text-gold" />
      <span className="flex-1 text-[12px] font-medium text-apex-white">Preferências de notificação</span>
      {open ? <ChevronUp size={13} className="text-apex-faint" /> : <ChevronDown size={13} className="text-apex-faint" />}
    </button>
    {open && <div className="space-y-5 border-t border-apex-border px-5 pb-5 pt-4">
      {loading && <p className="flex items-center gap-2 text-[10px] text-apex-muted"><LoaderCircle size={13} className="animate-spin text-gold" />Carregando preferências...</p>}
      {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
      {!loading && preferences && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <Channel title="No Apex" description="Central, badge e atalhos." Icon={BellRing} active={preferences.inAppEnabled} onClick={() => update("inAppEnabled", !preferences.inAppEnabled)} />
          <Channel title="Push" description="Base pronta; envio externo ainda não ativado." Icon={Smartphone} active={false} disabled />
          <Channel title="E-mail" description="Base pronta; provedor ainda não configurado." Icon={Mail} active={false} disabled />
        </div>

        <div>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-apex-faint">Tipos de lembrete</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Hábitos" checked={preferences.habitReminders} onChange={(value) => update("habitReminders", value)} />
            <Toggle label="Tarefas" checked={preferences.taskReminders} onChange={(value) => update("taskReminders", value)} />
            <Toggle label="Treinos" checked={preferences.trainingReminders} onChange={(value) => update("trainingReminders", value)} />
            <Toggle label="Refeições da Dieta" checked={preferences.dietReminders} onChange={(value) => update("dietReminders", value)} />
            <Toggle label="Revisão semanal" checked={preferences.weeklyReviewReminders} onChange={(value) => update("weeklyReviewReminders", value)} />
            <Toggle label="Resumo diário" checked={preferences.dailySummaryEnabled} onChange={(value) => update("dailySummaryEnabled", value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Avisar antes"><select value={preferences.reminderLeadMinutes} onChange={(event) => update("reminderLeadMinutes", Number(event.target.value))} className="apex-input"><option value={0}>No horário</option><option value={5}>5 minutos</option><option value={10}>10 minutos</option><option value={15}>15 minutos</option><option value={30}>30 minutos</option><option value={60}>1 hora</option></select></Field>
          <Field label="Resumo diário"><input type="time" value={preferences.dailySummaryTime} disabled={!preferences.dailySummaryEnabled} onChange={(event) => update("dailySummaryTime", event.target.value)} className="apex-input disabled:opacity-40" /></Field>
          <Field label="Revisão no domingo"><input type="time" value={preferences.weeklyReviewTime} disabled={!preferences.weeklyReviewReminders} onChange={(event) => update("weeklyReviewTime", event.target.value)} className="apex-input disabled:opacity-40" /></Field>
        </div>

        <div className="rounded-xl border border-apex-border bg-apex-surface p-3">
          <Toggle label="Horário silencioso" checked={preferences.quietHoursEnabled} onChange={(value) => update("quietHoursEnabled", value)} />
          {preferences.quietHoursEnabled && <div className="mt-3 grid grid-cols-2 gap-3"><Field label="Início"><input type="time" value={preferences.quietHoursStart} onChange={(event) => update("quietHoursStart", event.target.value)} className="apex-input" /></Field><Field label="Fim"><input type="time" value={preferences.quietHoursEnd} onChange={(event) => update("quietHoursEnd", event.target.value)} className="apex-input" /></Field></div>}
          <p className="mt-3 text-[8px] text-apex-faint">Fuso detectado: {preferences.timezone}. O horário silencioso será usado pelos canais externos quando forem ativados.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {saved && <span className="flex items-center gap-1 text-[9px] text-emerald-300"><CheckCircle2 size={12} />Preferências salvas</span>}
          <button type="button" disabled={!dirty || saving} onClick={() => void submit()} className="flex min-h-10 items-center gap-2 rounded-lg bg-gold px-4 text-[11px] font-semibold text-apex-bg disabled:opacity-40">{saving ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />}{saving ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </>}
    </div>}
  </div>;
}

function Channel({ title, description, Icon, active, disabled = false, onClick }: { title: string; description: string; Icon: typeof BellRing; active: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-xl border p-3 text-left ${active ? "border-gold/35 bg-apex-gold-bg" : "border-apex-border bg-apex-surface"} disabled:cursor-not-allowed disabled:opacity-55`}><div className="flex items-center gap-2"><Icon size={14} className={active ? "text-gold" : "text-apex-faint"} /><span className="text-[10px] font-semibold text-apex-white">{title}</span><span className={`ml-auto h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-apex-border"}`} /></div><p className="mt-2 text-[8px] leading-relaxed text-apex-faint">{description}</p></button>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-11 items-center justify-between rounded-lg border border-apex-border bg-apex-surface px-3 text-left"><span className="text-[10px] font-medium text-apex-muted">{label}</span><span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-gold" : "bg-apex-border"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} /></span></button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[8px] font-semibold uppercase tracking-wide text-apex-faint">{label}</span>{children}</label>;
}
