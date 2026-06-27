"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTemplates, defaultPlannedWorkouts, workoutTypeLabel, workoutTypeColor, type WorkoutTemplate, type PlannedWorkout, type Exercise } from "@/data/mockData";

const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

export default function PeriodizacaoPage() {
  const [templates,setTemplates]   = useLocalStorage<WorkoutTemplate[]>("apex-templates",defaultTemplates);
  const [planned,setPlanned]       = useLocalStorage<PlannedWorkout[]>("apex-planned-workouts",defaultPlannedWorkouts);
  const [showTemplateForm,setShowTF] = useState(false);
  const [editTemplateId,setEditTI]   = useState<string|null>(null);
  const [expandedDay,setExpandedDay] = useState<string|null>(null);
  const [assignDay,setAssignDay]     = useState<string|null>(null);

  function toggleDone(id:string){ setPlanned(p=>p.map(w=>w.id===id?{...w,done:!w.done}:w)); }
  function assignTemplate(day:string, templateId:string, time:string){
    const exists = planned.find(p=>p.day===day&&p.templateId===templateId);
    if(!exists) setPlanned(p=>[...p,{id:`pw${Date.now()}`,templateId,day,time,done:false}]);
    setAssignDay(null);
  }
  function removePlanned(id:string){ setPlanned(p=>p.filter(w=>w.id!==id)); }

  function saveTemplate(t: Omit<WorkoutTemplate,"id">) {
    if(editTemplateId) { setTemplates(p=>p.map(x=>x.id===editTemplateId?{...x,...t}:x)); setEditTI(null); }
    else { setTemplates(p=>[...p,{...t,id:`t${Date.now()}`}]); setShowTF(false); }
  }

  const editTemplate = templates.find(t=>t.id===editTemplateId);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Periodização" subtitle="Planejamento semanal de treinos"/>
      <div className="px-8 py-6 max-w-3xl space-y-8">

        {/* Semana */}
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Semana atual</p>
          <div className="space-y-3">
            {DAYS.map(day=>{
              const dayWorkouts = planned.filter(w=>w.day===day);
              const isExp = expandedDay===day;
              const todayName = new Date().toLocaleDateString("pt-BR",{weekday:"long"});
              const isToday = todayName.toLowerCase().startsWith(day.toLowerCase().slice(0,3));
              return (
                <div key={day} className={`bg-apex-card border rounded-xl overflow-hidden transition-colors ${isToday?"border-gold/30":"border-apex-border"}`}>
                  <button onClick={()=>setExpandedDay(isExp?null:day)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-apex-surface transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium border flex-shrink-0 ${isToday?"bg-apex-gold-bg border-gold text-gold":"bg-apex-surface border-apex-border text-apex-muted"}`}>{day.slice(0,3)}</div>
                    <p className={`text-[12px] font-medium flex-1 text-left ${isToday?"text-gold":"text-apex-white"}`}>{day}</p>
                    <span className="text-[10px] text-apex-faint">{dayWorkouts.filter(w=>w.done).length}/{dayWorkouts.length}</span>
                    {isExp?<ChevronUp size={13} className="text-apex-faint"/>:<ChevronDown size={13} className="text-apex-faint"/>}
                  </button>
                  <AnimatePresence>
                    {isExp&&(
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-apex-border pt-3 space-y-2">
                          {dayWorkouts.length===0&&<p className="text-[11px] text-apex-faint italic">Nenhum treino. Adicione abaixo.</p>}
                          {dayWorkouts.map(pw=>{
                            const t=templates.find(t=>t.id===pw.templateId);
                            if(!t) return null;
                            return (
                              <div key={pw.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${pw.done?"border-transparent":"border-apex-border"}`} style={{background:pw.done?`${workoutTypeColor[t.type]}18`:"transparent"}}>
                                <div className="flex-1">
                                  <p className="text-[11px] font-medium text-apex-white">{t.name}</p>
                                  <p className="text-[9px] font-mono text-apex-faint">{pw.time} · {t.exercises.length} exercícios</p>
                                </div>
                                <button onClick={()=>toggleDone(pw.id)} className="hover:scale-110 transition-transform">
                                  {pw.done?<Check size={14} color="#c9a84c"/>:<div className="w-4 h-4 rounded border border-apex-border"/>}
                                </button>
                                <button onClick={()=>removePlanned(pw.id)} className="text-apex-faint hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                              </div>
                            );
                          })}
                          {assignDay===day?(
                            <div className="bg-apex-surface border border-apex-border rounded-xl p-3 space-y-2">
                              <p className="text-[10px] text-apex-muted">Escolha um template:</p>
                              {templates.map(t=>(
                                <button key={t.id} onClick={()=>assignTemplate(day,t.id,"07:00")} className="w-full text-left px-3 py-2 rounded-lg border border-apex-border hover:border-apex-border2 text-[11px] text-apex-muted hover:text-apex-white transition-colors">
                                  <span style={{color:workoutTypeColor[t.type]}}>●</span> {t.name}
                                </button>
                              ))}
                              <button onClick={()=>setAssignDay(null)} className="text-[10px] text-apex-faint hover:text-apex-muted transition-colors">Cancelar</button>
                            </div>
                          ):(
                            <button onClick={()=>setAssignDay(day)} className="w-full flex items-center gap-1.5 text-[10px] text-apex-faint hover:text-gold transition-colors py-1"><Plus size={12}/>Adicionar treino</button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* Predefinições */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase">Predefinições de treino</p>
            {!showTemplateForm&&!editTemplateId&&<button onClick={()=>setShowTF(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-apex-bg rounded-lg text-[10px] font-medium hover:bg-amber-500 transition-colors"><Plus size={11}/>Nova predefinição</button>}
          </div>
          <AnimatePresence>{(showTemplateForm||editTemplateId)&&<TemplateForm initial={editTemplate} onSave={saveTemplate} onCancel={()=>{setShowTF(false);setEditTI(null);}}/>}</AnimatePresence>
          <div className="space-y-2">
            {templates.map(t=>(
              <div key={t.id} className="bg-apex-card border border-apex-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider mb-0.5 font-medium" style={{color:workoutTypeColor[t.type]}}>{workoutTypeLabel[t.type]}</p>
                    <p className="text-[12px] font-medium text-apex-white">{t.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>setEditTI(t.id)} className="p-1.5 text-apex-faint hover:text-gold transition-colors"><Pencil size={12}/></button>
                    <button onClick={()=>setTemplates(p=>p.filter(x=>x.id!==t.id))} className="p-1.5 text-apex-faint hover:text-red-400 transition-colors"><Trash2 size={12}/></button>
                  </div>
                </div>
                {t.exercises.length>0&&(
                  <div className="space-y-1 mt-2">
                    {t.exercises.map(e=>(
                      <div key={e.id} className="flex items-center justify-between text-[10px] py-1 border-b border-apex-border last:border-0">
                        <span className="text-apex-muted">{e.name}</span>
                        <span className="text-apex-faint font-mono">{e.sets}×{e.reps} · {e.rest}{e.weight?` · ${e.weight}`:""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function TemplateForm({ initial, onSave, onCancel }: { initial?: WorkoutTemplate; onSave:(t:Omit<WorkoutTemplate,"id">)=>void; onCancel:()=>void }) {
  const [name,setName]   = useState(initial?.name??"");
  const [type,setType]   = useState<WorkoutTemplate["type"]>(initial?.type??"musculacao");
  const [desc,setDesc]   = useState(initial?.description??"");
  const [exers,setExers] = useState<Exercise[]>(initial?.exercises??[]);

  function addEx(){ setExers(p=>[...p,{id:`e${Date.now()}`,name:"",sets:3,reps:10,rest:"60s",weight:""}]); }
  function updEx(id:string, field:keyof Exercise, val:string|number){ setExers(p=>p.map(e=>e.id===id?{...e,[field]:val}:e)); }
  function delEx(id:string){ setExers(p=>p.filter(e=>e.id!==id)); }
  function handleSave(){ if(!name.trim()) return; onSave({name:name.trim(),type,description:desc,exercises:exers.filter(e=>e.name.trim())}); }

  return (
    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="bg-apex-card border border-gold/30 rounded-xl p-4 space-y-3 mb-4">
      <input type="text" placeholder="Nome do treino..." value={name} onChange={(e)=>setName(e.target.value)} className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
      <div className="flex gap-2">
        <select value={type} onChange={(e)=>setType(e.target.value as WorkoutTemplate["type"])} className="bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white outline-none focus:border-gold">
          <option value="musculacao">Musculação</option><option value="corrida">Corrida</option><option value="mobilidade">Mobilidade</option><option value="descanso">Descanso</option>
        </select>
        <input type="text" placeholder="Descrição..." value={desc} onChange={(e)=>setDesc(e.target.value)} className="flex-1 bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
      </div>
      {exers.length>0&&(
        <div className="space-y-2">
          <p className="text-[9px] text-apex-faint uppercase tracking-wider">Exercícios</p>
          {exers.map(e=>(
            <div key={e.id} className="grid grid-cols-5 gap-1.5 items-center">
              <input type="text" placeholder="Exercício" value={e.name} onChange={(ev)=>updEx(e.id,"name",ev.target.value)} className="col-span-2 bg-apex-surface border border-apex-border rounded px-2 py-1.5 text-[11px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
              <input type="number" placeholder="Séries" value={e.sets} onChange={(ev)=>updEx(e.id,"sets",+ev.target.value)} className="bg-apex-surface border border-apex-border rounded px-2 py-1.5 text-[11px] text-apex-white outline-none focus:border-gold text-center"/>
              <input type="number" placeholder="Reps" value={e.reps} onChange={(ev)=>updEx(e.id,"reps",+ev.target.value)} className="bg-apex-surface border border-apex-border rounded px-2 py-1.5 text-[11px] text-apex-white outline-none focus:border-gold text-center"/>
              <button onClick={()=>delEx(e.id)} className="text-apex-faint hover:text-red-400 transition-colors flex items-center justify-center"><X size={13}/></button>
            </div>
          ))}
        </div>
      )}
      <button onClick={addEx} className="flex items-center gap-1.5 text-[10px] text-apex-faint hover:text-gold transition-colors"><Plus size={11}/>Adicionar exercício</button>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors">Salvar</button>
        <button onClick={onCancel} className="px-4 border border-apex-border text-apex-muted rounded-lg text-[11px] hover:border-apex-border2 transition-colors">Cancelar</button>
      </div>
    </motion.div>
  );
}
