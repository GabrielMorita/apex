"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, CheckCircle2, AlertCircle, User, ChevronDown, ChevronUp, BookOpen, Dumbbell, Activity, Target, Library } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ReadingHistory from "@/components/reading/ReadingHistory";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { DiaryEntry } from "@/data/extraData";
import { defaultReadingProjects, defaultReadingSessions, type ReadingProject, type ReadingSession } from "@/data/readingData";

const APEX_KEYS = [
  "apex-habits-today","apex-day-presets","apex-day-exceptions",
  "apex-habit-histories","apex-today-statuses","apex-weekly-goals",
  "apex-tasks","apex-checkins","apex-favorites","apex-focus","apex-goals",
  "apex-workouts","apex-templates","apex-planned-workouts","apex-workout-logs",
  "apex-diet-presets","apex-diet-exceptions","apex-food-bank","apex-diet-goals",
  "apex-custom-quotes","apex-custom-verses","apex-diary-entries","apex-gratidao",
  "apex-deepwork-sessions","apex-review-current","apex-profile",
  "apex-reading-projects","apex-reading-sessions","apex-reading-cycles","apex-diet-done","apex-checkin-seen","apex-day-moods",
];

interface Profile { name: string; email: string; avatar: string; }

// Section wrapper
function Section({ title, icon: Icon, children, defaultOpen=true }: { title:string; icon:any; children:React.ReactNode; defaultOpen?:boolean }) {
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
  const [status, setStatus]   = useState<"idle"|"exported"|"imported"|"error">("idle");
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useLocalStorage<Profile>("apex-profile",{name:"",email:"",avatar:""});
  const [diaryEntries]        = useLocalStorage<DiaryEntry[]>("apex-diary-entries",[]);
  const [readingProjects]     = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [readingSessions]     = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);
  const [sessions]            = useLocalStorage<{id:string;date:string;minutes:number;task:string}[]>("apex-deepwork-sessions",[]);
  const [workoutLogs]         = useLocalStorage<any[]>("apex-workout-logs",[]);
  const [checkins]            = useLocalStorage<any[]>("apex-checkins",[]);

  useEffect(()=>setMounted(true),[]);

  function handleExport() {
    const data:Record<string,any>={};
    APEX_KEYS.forEach((k)=>{ const v=localStorage.getItem(k); if(v) data[k]=JSON.parse(v); });
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`apex-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url); setStatus("exported"); setTimeout(()=>setStatus("idle"),3000);
  }

  function handleImport(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const data=JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([k,v])=>{ if(APEX_KEYS.includes(k)) localStorage.setItem(k,JSON.stringify(v)); });
        setStatus("imported"); setTimeout(()=>window.location.reload(),1500);
      } catch { setStatus("error"); setTimeout(()=>setStatus("idle"),3000); }
    };
    reader.readAsText(file);
  }

  // Group diary by month
  const diaryByMonth = diaryEntries.reduce((acc,e)=>{
    const m=e.date.slice(0,7);
    if(!acc[m]) acc[m]=[];
    acc[m].push(e);
    return acc;
  },{} as Record<string,DiaryEntry[]>);

  if (!mounted) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Configurações" subtitle="Perfil, backup e histórico"/>
      <div className="px-8 py-6 max-w-2xl space-y-5">

        {/* Perfil */}
        <Section title="Perfil" icon={User}>
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1.5">Nome</p>
              <input type="text" value={profile.name} onChange={(e)=>setProfile(p=>({...p,name:e.target.value}))}
                placeholder="Seu nome" className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
            </div>
            <div>
              <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1.5">Email</p>
              <input type="email" value={profile.email} onChange={(e)=>setProfile(p=>({...p,email:e.target.value}))}
                placeholder="seu@email.com" className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
            </div>
            <p className="text-[10px] text-apex-faint leading-relaxed bg-apex-surface border border-apex-border rounded-lg px-3 py-2.5">
              🔒 Login e senha para uso online serão habilitados quando o app for publicado. Por enquanto, seus dados ficam salvos localmente no seu navegador.
            </p>
          </div>
        </Section>

        {/* Histórico do Diário */}
        <Section title="Histórico do Diário" icon={BookOpen} defaultOpen={false}>
          {diaryEntries.length===0
            ?<p className="text-[11px] text-apex-faint italic">Nenhuma entrada ainda. Escreva seu primeiro diário na aba Diário.</p>
            :Object.entries(diaryByMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,entries])=>(
              <div key={month} className="mb-5 last:mb-0">
                <p className="text-[9px] text-gold tracking-[2px] uppercase mb-2">{new Date(month+"-01").toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</p>
                <div className="space-y-2">
                  {entries.sort((a,b)=>b.date.localeCompare(a.date)).map((e)=>(
                    <div key={e.id} className="bg-apex-surface border border-apex-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] text-apex-muted font-mono">{new Date(e.date+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"short",day:"numeric",month:"short"})}</p>
                        {e.mood&&<span className="text-[14px]">{["😔","😐","🙂","😊","🤩"][e.mood-1]}</span>}
                      </div>
                      <p className="text-[11px] text-apex-faint leading-relaxed line-clamp-2">{e.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </Section>

        {/* Histórico de Check-ins / Energia */}
        <Section title="Histórico de Energia & Check-ins" icon={Activity} defaultOpen={false}>
          {checkins.length===0
            ?<p className="text-[11px] text-apex-faint italic">Nenhum check-in registrado ainda.</p>
            :<div className="space-y-2">
              {[...checkins].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14).map((c:any)=>(
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
        <Section title="Histórico de Foco (Deep Work)" icon={Target} defaultOpen={false}>
          {sessions.length===0
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
          <ReadingHistory projects={readingProjects} sessions={readingSessions} />
        </Section>

        {/* Backup */}
        <Section title="Backup dos Dados" icon={Download}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-apex-faint mb-3 leading-relaxed">Exporte seus dados para não perder nada se limpar o navegador ou trocar de computador.</p>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-apex-bg rounded-lg text-[12px] font-medium hover:bg-amber-500 transition-colors">
                <Download size={13}/> Baixar backup (.json)
              </button>
              {status==="exported"&&<div className="flex items-center gap-1.5 mt-2 text-emerald-400"><CheckCircle2 size={12}/><span className="text-[11px]">Backup salvo!</span></div>}
            </div>
            <div className="border-t border-apex-border pt-4">
              <p className="text-[11px] text-apex-faint mb-3">Restaurar a partir de um backup anterior.</p>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden"/>
              <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-apex-surface border border-apex-border text-apex-muted rounded-lg text-[12px] hover:border-apex-border2 transition-colors">
                <Upload size={13}/> Selecionar arquivo
              </button>
              {status==="imported"&&<div className="flex items-center gap-1.5 mt-2 text-emerald-400"><CheckCircle2 size={12}/><span className="text-[11px]">Importado! Recarregando...</span></div>}
              {status==="error"&&<div className="flex items-center gap-1.5 mt-2 text-red-400"><AlertCircle size={12}/><span className="text-[11px]">Arquivo inválido.</span></div>}
            </div>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
