"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, X, Check, AlertCircle, Trash2, Target, BookOpen, CalendarRange } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LucideIcon from "@/components/ui/LucideIcon";
import BookCard from "@/components/reading/BookCard";
import BookForm from "@/components/reading/BookForm";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultHabits, defaultPresets, getCurrentWeekDates, DOW_NAMES, FULL_DAY_NAMES, type Habit, type DayPreset, type DayException } from "@/data/mockData";
import { defaultGoals, type Goal } from "@/data/extraData";
import {
  defaultReadingProjects, defaultReadingSessions, defaultReadingCycles,
  completedBooksForGoal, completedBooksForCycle,
  type ReadingProject, type ReadingSession, type ReadingCycle, type ReadingStatus,
} from "@/data/readingData";

function DayEditModal({ title, habitIds, allHabits, onSave, onClose, isException }: { title:string; habitIds:string[]; allHabits:Habit[]; onSave:(ids:string[])=>void; onClose:()=>void; isException?:boolean }) {
  const [selected,setSelected] = useState<string[]>(habitIds);
  function toggle(id:string){ setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.7)"}}>
      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} className="bg-apex-surface border border-apex-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-1"><div><p className="text-[13px] font-medium text-apex-white">{title}</p>{isException&&<p className="text-[9px] text-gold mt-0.5">Exceção — não afeta o preset</p>}</div><button onClick={onClose} className="text-apex-faint hover:text-apex-muted"><X size={16}/></button></div>
        <div className="space-y-1.5 my-4 max-h-64 overflow-y-auto">
          {allHabits.map(h=>{
            const on=selected.includes(h.id);
            return <button key={h.id} onClick={()=>toggle(h.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors" style={{background:on?`${h.color}15`:"transparent",borderColor:on?h.color:"#1e1e1e"}}>
              <div className="w-5 h-5 rounded border flex items-center justify-center" style={{background:on?h.color:"transparent",borderColor:on?h.color:"#333"}}>{on&&<Check size={10} color="#080808" strokeWidth={3}/>}</div>
              <LucideIcon name={h.lucideIcon??"Circle"} size={13} color={on?h.color:"#555"}/>
              <span className="text-[12px] flex-1 text-left" style={{color:on?"#f0f0f0":"#888"}}>{h.name}</span>
              <span className="text-[9px] font-mono" style={{color:on?h.color:"#444"}}>{h.time}</span>
            </button>;
          })}
        </div>
        <div className="flex gap-2"><button onClick={()=>onSave(selected)} className="flex-1 py-2.5 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors">Salvar</button><button onClick={onClose} className="px-4 border border-apex-border text-apex-muted rounded-xl text-[12px] hover:border-apex-border2 transition-colors">Cancelar</button></div>
      </motion.div>
    </div>
  );
}

export default function PlanejamentoPage() {
  const [habits]    = useLocalStorage<Habit[]>("apex-habits-today",defaultHabits);
  const [presets,setPresets]       = useLocalStorage<DayPreset[]>("apex-day-presets",defaultPresets);
  const [exceptions,setExceptions] = useLocalStorage<DayException[]>("apex-day-exceptions",[]);
  const [goals,setGoals]           = useLocalStorage<Goal[]>("apex-goals",defaultGoals);
  const [mounted,setMounted]       = useState(false);
  const [editPreset,setEditPreset] = useState<number|null>(null);
  const [editExc,setEditExc]       = useState<string|null>(null);
  const [showGoalForm,setShowGoalForm] = useState(false);
  const [editGoalId,setEditGoalId]     = useState<string|null>(null);
  useEffect(()=>setMounted(true),[]);

  const weekDates = getCurrentWeekDates();

  function savePreset(dow:number,ids:string[]){ setPresets(p=>p.some(x=>x.dow===dow)?p.map(x=>x.dow===dow?{...x,habitIds:ids}:x):[...p,{dow,habitIds:ids}]); setEditPreset(null); }
  function saveException(date:string,ids:string[]){ setExceptions(p=>p.some(x=>x.date===date)?p.map(x=>x.date===date?{...x,habitIds:ids}:x):[...p,{date,habitIds:ids}]); setEditExc(null); }
  function removeException(date:string){ setExceptions(p=>p.filter(x=>x.date!==date)); }

  function saveGoal(data:Omit<Goal,"id">){
    if(editGoalId){ setGoals(p=>p.map(g=>g.id===editGoalId?{...g,...data}:g)); setEditGoalId(null); }
    else { setGoals(p=>[...p,{...data,id:`g${Date.now()}`}]); setShowGoalForm(false); }
  }

  if(!mounted) return null;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Planejamento" subtitle="Presets, exceções e metas de longo prazo"/>
      <div className="apex-page max-w-3xl space-y-10">

        {/* Presets */}
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Presets semanais</p>
          <div className="space-y-2">
            {Array.from({length:7},(_,i)=>i).map(dow=>{
              const preset=presets.find(p=>p.dow===dow);
              const pHabits=habits.filter(h=>(preset?.habitIds??[]).includes(h.id)).sort((a,b)=>a.time.localeCompare(b.time));
              return (
                <div key={dow} className="bg-apex-card border border-apex-border rounded-xl px-4 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-apex-surface border border-apex-border flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-medium text-apex-muted">{DOW_NAMES[dow]}</span></div>
                  <div className="flex-1 min-w-0">
                    {pHabits.length===0?<p className="text-[11px] text-apex-faint italic">Nenhum hábito</p>:(
                      <div className="flex flex-wrap gap-1.5">
                        {pHabits.map(h=><span key={h.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{background:`${h.color}18`,color:h.color,border:`0.5px solid ${h.color}40`}}><LucideIcon name={h.lucideIcon??"Circle"} size={10} color={h.color}/>{h.name}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>setEditPreset(dow)} className="p-1.5 text-apex-faint hover:text-gold transition-colors flex-shrink-0"><Pencil size={13}/></button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Exceções */}
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-1">Exceções desta semana</p>
          <p className="text-[10px] text-apex-faint mb-4">Edite um dia específico sem mudar o preset</p>
          <div className="space-y-2">
            {weekDates.map((date,i)=>{
              const dow=(i+1)%7;
              const exc=exceptions.find(e=>e.date===date);
              const isToday=date===new Date().toISOString().split("T")[0];
              const ids=exc?.habitIds??presets.find(p=>p.dow===dow)?.habitIds??[];
              const activeHabits=habits.filter(h=>ids.includes(h.id)).sort((a,b)=>a.time.localeCompare(b.time));
              return (
                <div key={date} className={`bg-apex-card border rounded-xl px-4 py-3 flex items-center gap-4 ${isToday?"border-gold/30":exc?"border-amber-900/40":"border-apex-border"}`}>
                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center border flex-shrink-0 ${isToday?"bg-apex-gold-bg border-gold":"bg-apex-surface border-apex-border"}`}>
                    <span className={`text-[8px] ${isToday?"text-gold":"text-apex-faint"}`}>{DOW_NAMES[dow]}</span>
                    <span className={`text-[13px] font-medium ${isToday?"text-apex-white":"text-apex-muted"}`}>{new Date(date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {exc&&<div className="flex items-center gap-1 mb-1"><AlertCircle size={9} className="text-gold"/><span className="text-[8px] text-gold">editado</span></div>}
                    {activeHabits.length===0?<p className="text-[11px] text-apex-faint italic">Nenhum hábito</p>:(
                      <div className="flex flex-wrap gap-1.5">{activeHabits.map(h=><span key={h.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{background:`${h.color}18`,color:h.color,border:`0.5px solid ${h.color}40`}}><LucideIcon name={h.lucideIcon??"Circle"} size={10} color={h.color}/>{h.name}</span>)}</div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>setEditExc(date)} className="p-1.5 text-apex-faint hover:text-gold transition-colors"><Pencil size={13}/></button>
                    {exc&&<button onClick={()=>removeException(date)} className="p-1.5 text-apex-faint hover:text-red-400 transition-colors"><X size={13}/></button>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Metas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase">Metas de longo prazo</p>
            {!showGoalForm&&!editGoalId&&<button onClick={()=>setShowGoalForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-apex-bg rounded-lg text-[10px] font-medium hover:bg-amber-500 transition-colors"><Plus size={11}/>Nova meta</button>}
          </div>
          <AnimatePresence>
            {(showGoalForm||editGoalId)&&(
              <GoalForm initial={goals.find(g=>g.id===editGoalId)} habits={habits} onSave={saveGoal} onCancel={()=>{setShowGoalForm(false);setEditGoalId(null);}}/>
            )}
          </AnimatePresence>
          <div className="space-y-3">
            {goals.map(goal=>{
              const isRed=goal.target<goal.current;
              const pct=isRed?Math.min(100,Math.max(0,((goal.current*1.2-goal.current)/(goal.current*1.2-goal.target))*100)):Math.min(100,Math.max(0,(goal.current/goal.target)*100));
              const linked=habits.filter(h=>goal.linkedHabitIds.includes(h.id));
              const days=Math.ceil((new Date(goal.targetDate).getTime()-Date.now())/86400000);
              return (
                <div key={goal.id} className="bg-apex-card border border-apex-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2"><Target size={14} className="text-gold"/><p className="text-[13px] font-medium text-apex-white">{goal.title}</p></div>
                    <div className="flex gap-1"><button onClick={()=>setEditGoalId(goal.id)} className="p-1 text-apex-faint hover:text-gold transition-colors"><Pencil size={12}/></button><button onClick={()=>setGoals(p=>p.filter(g=>g.id!==goal.id))} className="p-1 text-apex-faint hover:text-red-400 transition-colors"><Trash2 size={12}/></button></div>
                  </div>
                  <div className="flex justify-between mb-1.5"><span className="text-[11px] text-apex-muted">{goal.current}{goal.unit} → {goal.target}{goal.unit}</span><span className="text-[10px] text-gold font-mono">{Math.round(pct)}%</span></div>
                  <div className="h-1.5 bg-apex-border rounded-full overflow-hidden mb-3"><motion.div initial={{width:0}} animate={{width:`${pct}%`}} className="h-full bg-gold rounded-full"/></div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">{linked.map(h=><span key={h.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px]" style={{background:`${h.color}18`,color:h.color}}><LucideIcon name={h.lucideIcon??"Circle"} size={9} color={h.color}/>{h.name}</span>)}</div>
                    <span className="text-[9px] text-apex-faint flex-shrink-0">{days>0?`${days} dias`:""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Projetos de Leitura */}
        <ReadingProjectsSection />
      </div>

      <AnimatePresence>
        {editPreset!==null&&<DayEditModal title={`Preset — ${FULL_DAY_NAMES[editPreset]}`} habitIds={presets.find(p=>p.dow===editPreset)?.habitIds??[]} allHabits={habits} onSave={(ids)=>savePreset(editPreset,ids)} onClose={()=>setEditPreset(null)}/>}
        {editExc!==null&&<DayEditModal title={`Exceção — ${editExc}`} habitIds={exceptions.find(e=>e.date===editExc)?.habitIds??presets.find(p=>p.dow===(weekDates.indexOf(editExc)+1)%7)?.habitIds??[]} allHabits={habits} onSave={(ids)=>saveException(editExc,ids)} onClose={()=>setEditExc(null)} isException/>}
      </AnimatePresence>
    </motion.div>
  );
}

function GoalForm({ initial, habits, onSave, onCancel }: { initial?:Goal; habits:Habit[]; onSave:(d:Omit<Goal,"id">)=>void; onCancel:()=>void }) {
  const [title,setTitle]   = useState(initial?.title??"");
  const [date,setDate]     = useState(initial?.targetDate??"");
  const [cur,setCur]       = useState(initial?.current??0);
  const [tgt,setTgt]       = useState(initial?.target??0);
  const [unit,setUnit]     = useState(initial?.unit??"kg");
  const [linked,setLinked] = useState<string[]>(initial?.linkedHabitIds??[]);
  function toggle(id:string){ setLinked(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]); }
  function handleSave(){ if(!title.trim()||!date) return; onSave({title:title.trim(),targetDate:date,current:cur,target:tgt,unit,linkedHabitIds:linked,linkedWorkoutTemplateIds:[]}); }
  return (
    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="bg-apex-card border border-gold/30 rounded-xl p-4 space-y-3 mb-4">
      <input type="text" placeholder="Título da meta..." value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Atual</p><input type="number" value={cur} onChange={(e)=>setCur(+e.target.value)} className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white outline-none focus:border-gold"/></div>
        <div><p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Meta</p><input type="number" value={tgt} onChange={(e)=>setTgt(+e.target.value)} className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white outline-none focus:border-gold"/></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Unidade (kg, min, km)" value={unit} onChange={(e)=>setUnit(e.target.value)} className="bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold"/>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white outline-none focus:border-gold"/>
      </div>
      <div>
        <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Vincular hábitos</p>
        <div className="flex flex-wrap gap-1.5">{habits.map(h=>{const on=linked.includes(h.id); return <button key={h.id} onClick={()=>toggle(h.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition-colors" style={{background:on?`${h.color}18`:"transparent",borderColor:on?h.color:"#1e1e1e",color:on?h.color:"#888"}}><LucideIcon name={h.lucideIcon??"Circle"} size={10} color={on?h.color:"#555"}/>{h.name}</button>;})}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors">Salvar meta</button>
        <button onClick={onCancel} className="px-4 border border-apex-border text-apex-muted rounded-lg text-[11px] hover:border-apex-border2 transition-colors">Cancelar</button>
      </div>
    </motion.div>
  );
}

// ── Projetos de Leitura (Planejamento) ───────────────────────
function ReadingProjectsSection() {
  const [projects, setProjects] = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [sessions]              = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);
  const [cycles, setCycles]     = useLocalStorage<ReadingCycle[]>("apex-reading-cycles", defaultReadingCycles);
  const [goals]                 = useLocalStorage<Goal[]>("apex-goals", defaultGoals);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [showCycleForm, setShowCycleForm] = useState(false);

  function handleSave(data: Omit<ReadingProject, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    if (editId) { setProjects(p => p.map(b => b.id === editId ? { ...b, ...data, updatedAt: now } : b)); setEditId(null); }
    else { setProjects(p => [...p, { ...data, id: `bk${Date.now()}`, createdAt: now, updatedAt: now }]); setShowForm(false); }
  }
  function setStatus(id: string, status: ReadingStatus) {
    const today = new Date().toISOString().split("T")[0];
    setProjects(p => p.map(b => b.id === id ? { ...b, status, completedAt: status === "completed" ? (b.completedAt ?? today) : (status === "active" ? undefined : b.completedAt), updatedAt: new Date().toISOString() } : b));
  }

  const editingBook = projects.find(b => b.id === editId);
  const readingGoals = goals.filter(g => g.unit.toLowerCase().includes("livro") || projects.some(p => p.linkedGoalId === g.id));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] text-apex-faint tracking-[2.5px] uppercase">Projetos de leitura</p>
        {!showForm && !editId && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-apex-bg rounded-lg text-[10px] font-medium hover:bg-amber-500 transition-colors">
            <Plus size={11} /> Novo livro
          </button>
        )}
      </div>

      {/* metas anuais de leitura (progresso computado) */}
      {readingGoals.length > 0 && (
        <div className="space-y-2 mb-4">
          {readingGoals.map(g => {
            const done = completedBooksForGoal(projects, g.id);
            const pct = g.target > 0 ? Math.min(100, Math.round((done / g.target) * 100)) : 0;
            return (
              <div key={g.id} className="surface-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2"><Target size={12} className="text-gold" /><span className="text-[11px] text-apex-white">{g.title}</span></div>
                  <span className="text-[10px] font-stat text-gold">{done}/{g.target} livros</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(122,104,78,0.2)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-gold rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {(showForm || editId) && <BookForm initial={editingBook} goals={goals} cycles={cycles} onSave={handleSave} onCancel={() => { setShowForm(false); setEditId(null); }} />}
      </AnimatePresence>

      {/* livros em modo planning */}
      <div className="space-y-2.5">
        {projects.filter(b => b.status !== "abandoned").map(b => (
          <BookCard key={b.id} book={b} sessions={sessions} mode="planning"
            onEdit={() => setEditId(b.id)} onStatus={(s) => setStatus(b.id, s)}
            onDelete={() => setProjects(p => p.filter(x => x.id !== b.id))} />
        ))}
        {projects.length === 0 && <p className="text-[11px] text-apex-faint italic py-3">Nenhum livro cadastrado. Adicione um para planejar a leitura.</p>}
      </div>

      {/* ciclos trimestrais */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] text-apex-faint tracking-[2.5px] uppercase flex items-center gap-1.5"><CalendarRange size={11} /> Ciclos trimestrais</p>
          {!showCycleForm && <button onClick={() => setShowCycleForm(true)} className="text-[10px] text-gold hover:opacity-80 transition-opacity">+ ciclo</button>}
        </div>
        <AnimatePresence>
          {showCycleForm && <CycleForm onSave={(c) => { setCycles(p => [...p, { ...c, id: `cy${Date.now()}` }]); setShowCycleForm(false); }} onCancel={() => setShowCycleForm(false)} />}
        </AnimatePresence>
        <div className="space-y-2">
          {cycles.map(c => {
            const done = completedBooksForCycle(projects, c);
            const pct = c.targetBooks > 0 ? Math.min(100, Math.round((done / c.targetBooks) * 100)) : 0;
            return (
              <div key={c.id} className="surface-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[11px] text-apex-white">{c.label}</span>
                    <span className="text-[9px] text-apex-faint ml-2 font-stat">{c.startDate} → {c.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-stat text-gold">{done}/{c.targetBooks}</span>
                    <button onClick={() => setCycles(p => p.filter(x => x.id !== c.id))} className="text-apex-faint hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(122,104,78,0.2)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-gold rounded-full" />
                </div>
              </div>
            );
          })}
          {cycles.length === 0 && !showCycleForm && <p className="text-[10px] text-apex-faint italic">Nenhum ciclo. Ex: "Q1 2026 — 4 livros".</p>}
        </div>
      </div>
    </section>
  );
}

function CycleForm({ onSave, onCancel }: { onSave: (c: Omit<ReadingCycle, "id">) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [target, setTarget] = useState(4);
  const inputCls = "w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors";
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="surface-card border border-gold/30 rounded-xl p-3 space-y-2 mb-3">
      <input type="text" placeholder='Nome (ex: Q1 2026)' value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
      <div className="grid grid-cols-3 gap-2">
        <div><p className="text-[8px] text-apex-faint uppercase mb-1">Início</p><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} /></div>
        <div><p className="text-[8px] text-apex-faint uppercase mb-1">Fim</p><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} /></div>
        <div><p className="text-[8px] text-apex-faint uppercase mb-1">Livros</p><input type="number" value={target} onChange={(e) => setTarget(+e.target.value)} className={inputCls} /></div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (label.trim() && start && end) onSave({ label: label.trim(), startDate: start, endDate: end, targetBooks: target }); }} className="flex-1 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors">Criar ciclo</button>
        <button onClick={onCancel} className="px-4 border border-apex-border text-apex-muted rounded-lg text-[11px] hover:border-apex-border2 transition-colors">Cancelar</button>
      </div>
    </motion.div>
  );
}
