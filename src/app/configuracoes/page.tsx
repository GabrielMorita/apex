"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle2, AlertCircle, Settings, ChevronDown, ChevronUp, Activity, Target, Library, Cloud, LogOut, LoaderCircle } from "lucide-react";
import type { LucideIcon as LucideIconType } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProfileSettings from "@/components/profile/ProfileSettings";
import ReadingHistory from "@/components/reading/ReadingHistory";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ReadingProject, ReadingSession } from "@/data/readingData";
import type { CheckinEntry, FocusSession } from "@/lib/productivity/types";
import { loadCheckins, loadFocusSessions, loadReadingData } from "@/lib/productivity/service";
import { buildAccountExport, downloadAccountExport } from "@/lib/account/service";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import NotificationSettingsCard from "@/components/notifications/NotificationSettingsCard";
import BillingCard from "@/components/billing/BillingCard";
import PrivacyCenterCard from "@/components/privacy/PrivacyCenterCard";

// Section wrapper
function Section({ title, icon: Icon, children, defaultOpen=true }: { title:string; icon:LucideIconType; children:React.ReactNode; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-apex-card border border-apex-border rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-apex-surface transition-colors">
        <Icon size={15} className="text-gold flex-shrink-0"/>
        <p className="text-[12px] font-medium text-apex-white flex-1 text-left">{title}</p>
        {open?<ChevronUp size={13} className="text-apex-faint"/>:<ChevronDown size={13} className="text-apex-faint"/>}
      </button>
      <AnimatePresence>
        {open&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="px-5 pb-5 border-t border-apex-border pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [status, setStatus]   = useState<"idle"|"exporting"|"exported"|"error">("idle");
  const [cloudStatus, setCloudStatus] = useState<"syncing"|"synced"|"error">("syncing");
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const [readingProjects, setReadingProjects] = useState<ReadingProject[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(()=>setMounted(true),[]);

  useEffect(() => {
    if (!user) { setHistoryLoading(false); setCloudStatus("error"); return; }
    let active = true;
    setHistoryLoading(true); setHistoryError(""); setCloudStatus("syncing");
    void Promise.all([loadReadingData(user.id), loadFocusSessions(user.id), loadCheckins(user.id, "1900-01-01", "2999-12-31")])
      .then(([reading, focus, loadedCheckins]) => {
        if (!active) return;
        setReadingProjects(reading.projects); setReadingSessions(reading.sessions); setSessions(focus); setCheckins(loadedCheckins); setCloudStatus("synced");
      })
      .catch((error) => { if (active) { setHistoryError(friendlyProductivityError(error)); setCloudStatus("error"); } })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [user]);

  async function handleExport() {
    if (!user || status === "exporting") return;
    setStatus("exporting");
    try {
      downloadAccountExport(await buildAccountExport(user));
      setStatus("exported");
      window.setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 3000);
    }
  }



  if (!mounted) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Configurações" subtitle="Perfil, preferências, histórico e backup"/>
      <div className="apex-page max-w-2xl space-y-5">

        <ProfileSettings />
        <NotificationSettingsCard />
        <PrivacyCenterCard />
        <BillingCard />
        {historyError && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-[10px] text-red-300"><AlertCircle size={13}/>{historyError}</div>}

        {/* Configurações da conta já existentes */}
        <Section title="Configurações da conta" icon={Settings} defaultOpen={false}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-apex-border bg-apex-surface px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Cloud size={14} className={cloudStatus==="error"?"text-red-400":cloudStatus==="syncing"?"text-amber-300":"text-emerald-400"}/>
                <div>
                  <p className="text-[10px] font-medium text-apex-white">Sincronização em nuvem</p>
                  <p className="text-[9px] text-apex-faint">{cloudStatus==="error"?"Erro ao sincronizar":cloudStatus==="syncing"?"Sincronizando alterações...":"Dados protegidos e sincronizados"}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wider ${cloudStatus==="error"?"bg-red-400/10 text-red-300":cloudStatus==="syncing"?"bg-amber-300/10 text-amber-200":"bg-emerald-400/10 text-emerald-300"}`}>{cloudStatus==="error"?"Erro":cloudStatus==="syncing"?"Enviando":"Ativo"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>void signOut()} className="flex items-center gap-2 px-4 py-2.5 bg-apex-surface border border-apex-border text-apex-muted rounded-lg text-[12px] hover:border-red-400/40 hover:text-red-300 transition-colors">
                <LogOut size={13}/> Sair da conta
              </button>
            </div>
          </div>
        </Section>

        {/* Histórico de Check-ins / Energia */}
        <Section title="Histórico de Energia & Check-ins" icon={Activity} defaultOpen={false}>
          {historyLoading
            ?<p className="flex items-center gap-2 text-[11px] text-apex-faint"><LoaderCircle size={13} className="animate-spin"/>Carregando histórico...</p>
            :checkins.length===0
            ?<p className="text-[11px] text-apex-faint italic">Nenhum check-in registrado ainda.</p>
            :<div className="space-y-2">
              {[...checkins].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14).map((c)=>(
                <div key={c.date} className="bg-apex-surface border border-apex-border rounded-xl px-4 py-3">
                  <p className="text-[10px] text-apex-muted font-mono mb-2">{new Date(c.date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"})}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      {label:"Energia",val:c.energia,color:"#c9a84c"},
                      {label:"Sono",val:c.sono,color:"#3B82F6"},
                      {label:"Humor",val:c.humor,color:"#10b981"},
                      {label:"Estresse",val:c.estresse,color:"#ef4444"},
                      {label:"Dor musc.",val:c.dorMuscular,color:"#f97316"},
                    ].map((f)=>(
                      <div key={f.label} className="text-center">
                        <p className="text-[8px] text-apex-faint mb-1">{f.label}</p>
                        <div className="flex justify-center gap-0.5">
                          {[1,2,3,4,5].map((n)=>(
                            <div key={n} className="w-1.5 h-3 rounded-sm" style={{background:n<=f.val?f.color:"#222"}}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        </Section>

        {/* Histórico de Deep Work */}
        <Section title="Histórico de Foco" icon={Target} defaultOpen={false}>
          {historyLoading
            ?<p className="flex items-center gap-2 text-[11px] text-apex-faint"><LoaderCircle size={13} className="animate-spin"/>Carregando histórico...</p>
            :sessions.length===0
            ?<p className="text-[11px] text-apex-faint italic">Nenhuma sessão registrada ainda.</p>
            :<div className="space-y-1.5">
              {[...sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map((s)=>(
                <div key={s.id} className="flex items-center justify-between bg-apex-surface border border-apex-border rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-[11px] text-apex-white">{s.task}</p>
                    <p className="text-[9px] text-apex-faint font-mono">{new Date(s.date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"})}</p>
                  </div>
                  <span className="text-[10px] text-gold font-mono">{s.minutes} min</span>
                </div>
              ))}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-apex-border">
                <p className="text-[11px] text-apex-muted">Total acumulado</p>
                <p className="text-[13px] text-gold font-mono font-medium">{sessions.reduce((a,s)=>a+s.minutes,0)} min</p>
              </div>
            </div>
          }
        </Section>

        {/* Histórico de Leitura */}
        <Section title="Histórico de Leitura" icon={Library} defaultOpen={false}>
          {historyLoading ? <p className="flex items-center gap-2 text-[11px] text-apex-faint"><LoaderCircle size={13} className="animate-spin"/>Carregando histórico...</p> : <ReadingHistory projects={readingProjects} sessions={readingSessions} />}
        </Section>

        {/* Backup */}
        <Section title="Backup dos Dados" icon={Download}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-apex-faint mb-3 leading-relaxed">Exporte uma cópia dos dados reais da sua conta, incluindo Perfil, Dieta, Treino, produtividade, notificações, assinatura e registros de privacidade.</p>
              <button disabled={!user || status==="exporting"} onClick={()=>void handleExport()} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-apex-bg rounded-lg text-[12px] font-medium hover:bg-amber-500 transition-colors disabled:opacity-50">
                {status==="exporting"?<LoaderCircle size={13} className="animate-spin"/>:<Download size={13}/>} {status==="exporting"?"Preparando backup...":"Baixar backup (.json)"}
              </button>
              {status==="exported"&&<div className="flex items-center gap-1.5 mt-2 text-emerald-400"><CheckCircle2 size={12}/><span className="text-[11px]">Backup salvo!</span></div>}
              {status==="error"&&<div className="flex items-center gap-1.5 mt-2 text-red-400"><AlertCircle size={12}/><span className="text-[11px]">Não foi possível gerar o backup.</span></div>}
            </div>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
