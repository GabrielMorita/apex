"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LucideIcon from "@/components/ui/LucideIcon";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultHabits, freqLabel, type Habit, type HabitStatus, type HabitFrequency } from "@/data/mockData";

const CATS: {value:Habit["category"];label:string}[] = [
  {value:"espiritual",label:"Espiritual"},{value:"treino",label:"Treino"},
  {value:"foco",label:"Foco"},{value:"saude",label:"Saúde"},{value:"aprendizado",label:"Aprendizado"},
];
const COLORS = ["#c9a84c","#3B82F6","#10b981","#8b5cf6","#ef4444","#f97316","#06b6d4","#ec4899"];
const ICONS = ["BookOpen","Dumbbell","Activity","Brain","BookMarked","Heart","Flame","Star","Moon","Sun","Coffee","Music","Zap","Target","Trophy"];
const DOW = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function HabitForm({ initial, onSave, onCancel }: { initial?: Partial<Habit>; onSave:(d:Partial<Habit>)=>void; onCancel:()=>void }) {
  const [name,setName] = useState(initial?.name??"");
  const [time,setTime] = useState(initial?.time??"07:00");
  const [cat,setCat]   = useState<Habit["category"]>(initial?.category??"foco");
  const [color,setColor] = useState(initial?.color??"#c9a84c");
  const [icon,setIcon]   = useState(initial?.lucideIcon??"Star");
  const [ft,setFt]       = useState<HabitFrequency["type"]>(initial?.frequency?.type??"daily");
  const [xt,setXt]       = useState(initial?.frequency?.type==="xPerWeek"?initial.frequency.times:3);
  const [sd,setSd]       = useState<number[]>(initial?.frequency?.type==="specificDays"?initial.frequency.days:[1,2,3,4,5]);
  const [dur,setDur]     = useState(initial?.duration??"30 min");

  function buildFreq(): HabitFrequency {
    if(ft==="daily") return {type:"daily"};
    if(ft==="xPerWeek") return {type:"xPerWeek",times:xt};
    return {type:"specificDays",days:sd};
  }
  function handleSave() {
    if(!name.trim()) return;
    onSave({name:name.trim(),time,category:cat,color,lucideIcon:icon,frequency:buildFreq(),duration:dur,weeklyGoal:ft==="daily"?7:ft==="xPerWeek"?xt:sd.length});
  }

  return (
    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="bg-apex-card border border-gold/30 rounded-xl p-4 space-y-3 mb-4">
      <input autoFocus type="text" placeholder="Nome do hábito..." value={name} onChange={(e)=>setName(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleSave()}
        className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
      <div className="flex gap-2">
        <input type="time" value={time} onChange={(e)=>setTime(e.target.value)} className="bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white font-mono outline-none focus:border-gold"/>
        <input type="text" placeholder="Duração (ex: 30 min)" value={dur} onChange={(e)=>setDur(e.target.value)} className="flex-1 bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
        <select value={cat} onChange={(e)=>setCat(e.target.value as Habit["category"])} className="bg-apex-surface border border-apex-border rounded-lg px-2 py-2 text-[11px] text-apex-white outline-none focus:border-gold">
          {CATS.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Cor</p>
        <div className="flex gap-2">{COLORS.map((c)=><button key={c} onClick={()=>setColor(c)} style={{background:c,width:22,height:22,borderRadius:"50%",border:color===c?"2px solid #fff":"2px solid transparent",outline:color===c?`2px solid ${c}`:"none"}}/>)}</div>
      </div>
      <div>
        <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Ícone</p>
        <div className="flex gap-1.5 flex-wrap">{ICONS.map((ic)=><button key={ic} onClick={()=>setIcon(ic)} className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors" style={{background:icon===ic?`${color}22`:"transparent",borderColor:icon===ic?color:"#1e1e1e"}}><LucideIcon name={ic} size={14} color={icon===ic?color:"#555"}/></button>)}</div>
      </div>
      <div>
        <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Frequência</p>
        <div className="flex gap-2 mb-2">{(["daily","xPerWeek","specificDays"] as const).map((t)=><button key={t} onClick={()=>setFt(t)} className={`px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${ft===t?"bg-apex-gold-bg border-gold text-gold":"bg-apex-surface border-apex-border text-apex-muted"}`}>{t==="daily"?"Diário":t==="xPerWeek"?"X vezes/sem":"Dias fixos"}</button>)}</div>
        {ft==="xPerWeek"&&<div className="flex items-center gap-3"><span className="text-[11px] text-apex-muted">Vezes por semana:</span><input type="number" min={1} max={7} value={xt} onChange={(e)=>setXt(Math.min(7,Math.max(1,+e.target.value)))} className="w-14 bg-apex-surface border border-apex-border rounded-lg px-2 py-1 text-[12px] text-apex-white font-mono outline-none focus:border-gold text-center"/></div>}
        {ft==="specificDays"&&<div className="flex gap-1.5 flex-wrap">{DOW.map((d,i)=><button key={i} onClick={()=>setSd(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i].sort())} className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${sd.includes(i)?"bg-apex-gold-bg border-gold text-gold":"bg-apex-surface border-apex-border text-apex-muted"}`}>{d}</button>)}</div>}
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-apex-bg text-[11px] font-medium rounded-lg py-2 hover:bg-amber-500 transition-colors"><Check size={12}/> Salvar</button>
        <button onClick={onCancel} className="px-4 text-apex-faint text-[11px] border border-apex-border rounded-lg hover:border-apex-border2 transition-colors">Cancelar</button>
      </div>
    </motion.div>
  );
}

export default function RotinaPage() {
  const [habits,setHabits]   = useLocalStorage<Habit[]>("apex-habits-today",defaultHabits);
  const [statuses,setStatuses] = useLocalStorage<Record<string,HabitStatus>>("apex-today-statuses",{});
  const [showForm,setShowForm] = useState(false);
  const [editId,setEditId]     = useState<string|null>(null);
  const [mounted,setMounted]   = useState(false);
  useEffect(()=>setMounted(true),[]);

  function toggle(id:string){ setStatuses(p=>{const c=p[id]??"pending";return{...p,[id]:c==="pending"?"done":c==="done"?"skipped":"pending"}}); }
  function handleAdd(d:Partial<Habit>){ setHabits(p=>[...p,{id:`h${Date.now()}`,name:d.name!,time:d.time!,category:d.category!,color:d.color!,lucideIcon:d.lucideIcon!,frequency:d.frequency!,status:"pending",streak:0,weeklyGoal:d.weeklyGoal??7,duration:d.duration}]); setShowForm(false); }
  function handleEdit(d:Partial<Habit>){ setHabits(p=>p.map(h=>h.id===editId?{...h,...d}:h)); setEditId(null); }
  function handleDel(id:string){ setHabits(p=>p.filter(h=>h.id!==id)); }

  if(!mounted) return null;
  const done = habits.filter(h=>(statuses[h.id]??"pending")==="done").length;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Rotina" subtitle="Seus hábitos diários"/>
      <div className="apex-page max-w-3xl">
        <div className="flex gap-3 mb-6">
          {[{v:done,l:"Concluídos",g:true},{v:habits.length-done,l:"Pendentes",g:false},{v:habits.length,l:"Total",g:false}].map(m=>(
            <div key={m.l} className="bg-apex-card border border-apex-border rounded-xl px-5 py-3 text-center flex-1">
              <p className={`text-[20px] font-medium ${m.g?"text-gold":"text-apex-white"}`}>{m.v}</p>
              <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-0.5">{m.l}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          {!showForm&&!editId&&<button onClick={()=>setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors"><Plus size={12}/> Novo hábito</button>}
          <button onClick={()=>setStatuses({})} className="flex items-center gap-1.5 px-3 py-2 bg-apex-card border border-apex-border text-apex-muted rounded-lg text-[11px] hover:border-apex-border2 transition-colors"><X size={12}/> Resetar dia</button>
        </div>
        <AnimatePresence>{showForm&&<HabitForm onSave={handleAdd} onCancel={()=>setShowForm(false)}/>}</AnimatePresence>
        <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-3">Hábitos — {habits.length} total</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AnimatePresence>
            {habits.map(h=>editId===h.id?(
              <div key={h.id} className="md:col-span-2"><HabitForm initial={h} onSave={handleEdit} onCancel={()=>setEditId(null)}/></div>
            ):(
              <div key={h.id} className="relative group">
                <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${(statuses[h.id]??"pending")==="done"?"bg-apex-gold-bg border-[#2a1f0a]":"bg-apex-card border-apex-border hover:border-apex-border2"}`}>
                  <div className="flex items-center gap-3">
                    <LucideIcon name={h.lucideIcon??"Circle"} size={14} color={(statuses[h.id]??"pending")==="done"?h.color:"#555"}/>
                    <div>
                      <p className="text-[12px] font-medium text-apex-white">{h.name}</p>
                      <p className="text-[9px] text-apex-faint font-mono">{h.time} · {freqLabel(h.frequency)}</p>
                    </div>
                  </div>
                  <button onClick={()=>toggle(h.id)} className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all"
                    style={{background:(statuses[h.id]??"pending")==="done"?h.color:"transparent",borderColor:(statuses[h.id]??"pending")==="done"?h.color:"#222"}}>
                    {(statuses[h.id]??"pending")==="done"&&<Check size={12} color="#080808" strokeWidth={3}/>}
                    {(statuses[h.id]??"pending")==="skipped"&&<X size={12} color="#ef4444"/>}
                  </button>
                </div>
                <div className="absolute top-2 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>setEditId(h.id)} className="p-1 text-apex-faint hover:text-gold transition-colors"><Pencil size={11}/></button>
                  <button onClick={()=>handleDel(h.id)} className="p-1 text-apex-faint hover:text-red-400 transition-colors"><Trash2 size={11}/></button>
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
        {habits.length===0&&<div className="text-center py-12 text-apex-faint text-[12px]">Nenhum hábito. Clique em "Novo hábito" para começar.</div>}
      </div>
    </motion.div>
  );
}
