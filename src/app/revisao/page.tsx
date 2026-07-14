"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { weekMetrics } from "@/data/mockData";

const QUESTIONS = [
  { id:"vitoria",   label:"Qual foi sua maior vitória da semana?" },
  { id:"aprendido", label:"O que você aprendeu sobre si mesmo?" },
  { id:"melhorar",  label:"O que pode melhorar na próxima semana?" },
  { id:"gratidao",  label:"Pelo que você é grato essa semana?" },
  { id:"foco",      label:"Qual será o foco da próxima semana?" },
];

export default function RevisaoPage() {
  const [review,setReview] = useLocalStorage<Record<string,string>>("apex-review-current",{});
  const [saved,setSaved]   = useState(false);
  function handleSave(){ setSaved(true); setTimeout(()=>setSaved(false),2500); }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Revisão Semanal" subtitle="Avalie sua semana"/>
      <div className="apex-page max-w-2xl space-y-8">
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Resumo</p>
          <div className="grid grid-cols-3 gap-3">
            {[{v:weekMetrics.scoreSemanal,l:"Score",g:true},{v:`${weekMetrics.treinosConcluidos}/${weekMetrics.treinosTotal}`,l:"Treinos",g:false},{v:weekMetrics.streakDias,l:"Streak",g:false}].map(m=>(
              <div key={m.l} className="bg-apex-card border border-apex-border rounded-xl p-4 text-center">
                <p className={`text-[22px] font-medium ${m.g?"text-gold":"text-apex-white"}`}>{m.v}</p>
                <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-1">{m.l}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Reflexão</p>
          <div className="space-y-4">
            {QUESTIONS.map((q,i)=>(
              <motion.div key={q.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}} className="bg-apex-card border border-apex-border rounded-xl p-4">
                <p className="text-[11px] text-apex-muted mb-2">{q.label}</p>
                <textarea rows={2} value={review[q.id]??""} onChange={(e)=>setReview(p=>({...p,[q.id]:e.target.value}))} placeholder="Escreva aqui..."
                  className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors resize-none"/>
              </motion.div>
            ))}
          </div>
        </section>
        <button onClick={handleSave} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-[12px] transition-all ${saved?"bg-emerald-900 border border-emerald-700 text-emerald-400":"bg-gold text-apex-bg hover:bg-amber-500"}`}>
          {saved?<><CheckCircle2 size={14}/> Salvo!</>:<><Save size={14}/> Salvar revisão</>}
        </button>
      </div>
    </motion.div>
  );
}
