"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MetricCardProps { label: string; value: string|number; sub?: string; gold?: boolean; index?: number; }

export function MetricCard({ label, value, sub, gold=false, index=0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:index*0.07,duration:0.4,ease:[.22,.61,.36,1]}}
      className={`relative overflow-hidden rounded-2xl p-5 hover-lift ${gold?"surface-raised":"surface-card"}`}>
      {gold && (
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full"
          style={{background:"radial-gradient(circle, rgba(227,173,82,0.22), transparent 70%)"}}/>
      )}
      <p className="text-[8px] text-apex-faint tracking-[2.5px] uppercase mb-3 relative">{label}</p>
      <p className={`font-stat text-[30px] font-medium leading-none relative ${gold?"text-gold text-glow-gold":"text-apex-white"}`}
        style={{letterSpacing:"-1px"}}>{value}</p>
      {sub && <p className="text-[9.5px] text-apex-faint mt-2 relative">{sub}</p>}
    </motion.div>
  );
}

interface Props { scoreSemanal:number; consistencia:number; habitosHoje:number; habitosTotal:number; treinosConcluidos:number; treinosTotal:number; }

export default function DashboardSummary({ scoreSemanal, consistencia, habitosHoje, habitosTotal, treinosConcluidos, treinosTotal }: Props) {
  const [m, setM] = useState(false);
  useEffect(()=>setM(true),[]);
  const h=m?habitosHoje:0, t=m?habitosTotal:1, tc=m?treinosConcluidos:0, tt=m?treinosTotal:1;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Score semanal"     value={scoreSemanal}       sub="↑ 12 vs semana passada" gold index={0}/>
      <MetricCard label="Hábitos hoje"      value={`${h}/${t}`}        sub={`${Math.round((h/t)*100)}% concluídos`}  index={1}/>
      <MetricCard label="Treinos na semana" value={`${tc}/${tt}`}      sub={`${tt-tc} restante(s)`}                  index={2}/>
      <MetricCard label="Consistência"      value={`${consistencia}%`} sub="últimos 30 dias"    gold index={3}/>
    </div>
  );
}
