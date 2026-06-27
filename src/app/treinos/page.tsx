"use client";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTemplates, workoutTypeLabel, workoutTypeColor } from "@/data/mockData";

export default function TreinosPage() {
  const [logs] = useLocalStorage<any[]>("apex-workout-logs",[]);
  const [templates] = useLocalStorage("apex-templates",defaultTemplates);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Treinos" subtitle="Histórico de treinos realizados"/>
      <div className="px-8 py-6 max-w-2xl">
        {logs.length===0?(
          <div className="text-center py-16">
            <p className="text-[13px] text-apex-muted mb-2">Nenhum treino registrado ainda</p>
            <p className="text-[11px] text-apex-faint max-w-xs mx-auto">Marque treinos como concluídos na aba Periodização para ver o histórico aqui.</p>
          </div>
        ):(
          <div className="space-y-3">
            {[...logs].sort((a,b)=>b.date.localeCompare(a.date)).map((log:any)=>(
              <div key={log.id} className="bg-apex-card border border-apex-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-medium mb-0.5" style={{color:workoutTypeColor[log.type as keyof typeof workoutTypeColor]}}>{workoutTypeLabel[log.type as keyof typeof workoutTypeLabel]}</p>
                    <p className="text-[13px] font-medium text-apex-white">{log.templateName}</p>
                  </div>
                  <p className="text-[10px] text-apex-faint font-mono">{new Date(log.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}</p>
                </div>
                {log.exerciseLogs?.length>0&&(
                  <div className="space-y-1 mt-3 pt-3 border-t border-apex-border">
                    {log.exerciseLogs.map((e:any)=>(
                      <div key={e.exerciseId} className="flex items-center justify-between text-[10px]">
                        <span className="text-apex-muted">{e.name}</span>
                        <div className="flex gap-3">
                          <span className="text-apex-faint">{e.setsPlanned}×{e.repsPlanned} planejado</span>
                          <span className="text-gold">{e.setsReal}×{e.repsReal} feito{e.weightReal?` · ${e.weightReal}`:""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
