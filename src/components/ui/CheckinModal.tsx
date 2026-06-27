"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import LucideIcon from "@/components/ui/LucideIcon";
import { CHECKIN_FIELDS, type CheckinEntry } from "@/data/extraData";

interface Props { onComplete:(e:CheckinEntry)=>void; onSkip:()=>void; }

export default function CheckinModal({ onComplete, onSkip }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [values, setValues] = useState<Record<string,number>>({ energia:3,sono:3,humor:3,estresse:2,dorMuscular:1 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.75)"}}>
      <motion.div initial={{opacity:0,scale:0.95,y:10}} animate={{opacity:1,scale:1,y:0}}
        className="bg-apex-surface border border-apex-border rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-[10px] text-gold tracking-[2px] uppercase mb-1">Bom dia</p>
          <p className="text-[16px] font-medium text-apex-white">Como você está hoje?</p>
          <p className="text-[11px] text-apex-faint mt-1">Check-in rápido para começar o dia</p>
        </div>
        <div className="space-y-4 mb-6">
          {CHECKIN_FIELDS.map((field)=>(
            <div key={field.key}>
              <div className="flex items-center gap-2 mb-2">
                <LucideIcon name={field.lucideIcon} size={13} color="#c9a84c"/>
                <span className="text-[12px] text-apex-white">{field.label}</span>
                <span className="ml-auto text-[10px] text-gold font-mono">{values[field.key]}/5</span>
              </div>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map((n)=>{
                  const active=values[field.key]>=n;
                  return (
                    <button key={n} onClick={()=>setValues((p)=>({...p,[field.key]:n}))}
                      className="flex-1 h-7 rounded-lg border transition-all"
                      style={{background:active?"#c9a84c22":"transparent",borderColor:active?"#c9a84c":"#1e1e1e"}}/>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>onComplete({date:today,energia:values.energia,sono:values.sono,humor:values.humor,estresse:values.estresse,dorMuscular:values.dorMuscular})}
            className="flex-1 py-2.5 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors">
            Salvar check-in
          </button>
          <button onClick={onSkip} className="px-4 border border-apex-border text-apex-muted rounded-xl text-[12px] hover:border-apex-border2 transition-colors">
            Pular
          </button>
        </div>
      </motion.div>
    </div>
  );
}
