"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Check, ChevronRight, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import HabitCircle from "@/components/ui/HabitCircle";
import WeeklyCalendar from "@/components/ui/WeeklyCalendar";
import DashboardSummary from "@/components/ui/DashboardSummary";
import CheckinModal from "@/components/ui/CheckinModal";
import LucideIcon from "@/components/ui/LucideIcon";
import { useLocalStorage } from "@/lib/useLocalStorage";
import ReadingLogSheet from "@/components/reading/ReadingLogSheet";
import {
  defaultHabits, defaultPresets, weekMetrics, getTodayHabits,
  getCurrentWeekDates, getMedalColor, DOW_NAMES,
  type Habit, type HabitStatus, type DayPreset, type DayException,
} from "@/data/mockData";
import {
  defaultTasks, isTaskScheduledToday,
  type Task, type CheckinEntry, type FocusItem,
} from "@/data/extraData";
import {
  defaultReadingProjects, defaultReadingSessions,
  type ReadingProject, type ReadingSession,
} from "@/data/readingData";

// ── Focus selector modal ─────────────────────────────────────
function FocusSelector({ habits, tasks, onSave, onClose }: {
  habits: Habit[]; tasks: Task[];
  onSave: (items: FocusItem[]) => void; onClose: () => void;
}) {
  const [primary,   setPrimary]   = useState<FocusItem|null>(null);
  const [secondary, setSecondary] = useState<FocusItem[]>([]);

  function toggleSecondary(item: FocusItem) {
    const exists = secondary.find((s)=>s.refId===item.refId&&s.type===item.type);
    if (exists) setSecondary((p)=>p.filter((s)=>!(s.refId===item.refId&&s.type===item.type)));
    else if (secondary.length<2) setSecondary((p)=>[...p,item]);
  }

  function isSel(type: "habit"|"task", refId: string) {
    return (primary?.type===type&&primary?.refId===refId) || secondary.some((s)=>s.type===type&&s.refId===refId);
  }

  function handleSave() {
    const items: FocusItem[] = [];
    if (primary) items.push({...primary, priority:"primary"});
    secondary.forEach((s)=>items.push({...s, priority:"secondary"}));
    onSave(items);
    onClose();
  }

  const allItems: {type:"habit"|"task";refId:string;name:string;color:string;icon:string}[] = [
    ...habits.map((h)=>({type:"habit" as const, refId:h.id, name:h.name, color:h.color, icon:h.lucideIcon??"Circle"})),
    ...tasks.filter(isTaskScheduledToday).map((t)=>({type:"task" as const, refId:t.id, name:t.name, color:"#666", icon:"CheckSquare"})),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.75)"}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
        className="bg-apex-surface border border-apex-border rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-medium text-apex-white">Foco do dia</p>
          <button onClick={onClose} className="text-apex-faint hover:text-apex-muted"><X size={16}/></button>
        </div>
        <p className="text-[10px] text-apex-faint mb-5">Escolha 1 principal e até 2 secundários</p>

        <div className="mb-4">
          <p className="text-[9px] text-gold tracking-[2px] uppercase mb-2">Principal</p>
          <div className="space-y-1.5">
            {allItems.map((item)=>{
              const isPrimary = primary?.refId===item.refId&&primary?.type===item.type;
              return (
                <button key={`${item.type}-${item.refId}`} onClick={()=>setPrimary(isPrimary?null:{refId:item.refId,type:item.type,priority:"primary"})}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
                  style={{background:isPrimary?`${item.color}15`:"transparent",borderColor:isPrimary?item.color:"#1e1e1e"}}>
                  <LucideIcon name={item.icon} size={14} color={isPrimary?item.color:"#555"}/>
                  <span className="text-[12px]" style={{color:isPrimary?item.color:"#888"}}>{item.name}</span>
                  {isPrimary&&<Star size={12} fill={item.color} color={item.color} className="ml-auto"/>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-2">Secundários ({secondary.length}/2)</p>
          <div className="space-y-1.5">
            {allItems.filter((i)=>!(primary?.refId===i.refId&&primary?.type===i.type)).map((item)=>{
              const isSec = secondary.some((s)=>s.refId===item.refId&&s.type===item.type);
              return (
                <button key={`sec-${item.type}-${item.refId}`} onClick={()=>toggleSecondary({refId:item.refId,type:item.type,priority:"secondary"})}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors text-left"
                  style={{background:isSec?`${item.color}10`:"transparent",borderColor:isSec?item.color+"80":"#1e1e1e",opacity:!isSec&&secondary.length>=2?0.4:1}}>
                  <LucideIcon name={item.icon} size={13} color={isSec?item.color:"#444"}/>
                  <span className="text-[11px]" style={{color:isSec?item.color:"#666"}}>{item.name}</span>
                  {isSec&&<Check size={11} color={item.color} className="ml-auto"/>}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-2.5 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors">
          Salvar foco
        </button>
      </motion.div>
    </div>
  );
}

// ── Tasks panel - full height beside timeline ────────────────
function TasksPanel({ tasks, onToggle, onAdd, collapsed, onCollapse }: {
  tasks: Task[]; onToggle:(id:string)=>void; onAdd:(name:string)=>void;
  collapsed:boolean; onCollapse:()=>void;
}) {
  const [text, setText] = useState("");
  function handleAdd() { if(!text.trim()) return; onAdd(text.trim()); setText(""); }

  if (collapsed) {
    return (
      <button onClick={onCollapse} className="bg-apex-card border border-apex-border rounded-xl px-2 py-4 flex flex-col items-center gap-2 hover:border-apex-border2 transition-colors self-stretch">
        <ChevronRight size={13} className="text-apex-faint"/>
        <span className="text-[9px] text-apex-faint" style={{writingMode:"vertical-rl"}}>Tarefas ({tasks.filter(t=>t.status==="done").length}/{tasks.length})</span>
      </button>
    );
  }

  return (
    <div className="bg-apex-card border border-apex-border rounded-xl flex flex-col self-stretch" style={{minWidth:220,maxWidth:240}}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-apex-border flex-shrink-0">
        <p className="text-[9px] text-apex-faint tracking-[2px] uppercase">Tarefas soltas</p>
        <button onClick={onCollapse} className="text-apex-faint hover:text-apex-muted transition-colors">
          <ChevronRight size={13}/>
        </button>
      </div>

      {/* Quick add */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-apex-border flex-shrink-0">
        <input type="text" placeholder="Nova tarefa..." value={text} onChange={(e)=>setText(e.target.value)}
          onKeyDown={(e)=>e.key==="Enter"&&handleAdd()}
          className="flex-1 bg-apex-surface border border-apex-border rounded-lg px-2.5 py-1.5 text-[11px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors"/>
        <button onClick={handleAdd} className="px-2 bg-apex-surface border border-apex-border rounded-lg text-apex-muted hover:border-gold hover:text-gold transition-colors">
          <Plus size={13}/>
        </button>
      </div>

      {/* Task list — fills remaining height */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {tasks.length===0
          ?<p className="text-[10px] text-apex-faint italic p-2">Nenhuma tarefa solta hoje</p>
          :tasks.map((task)=>{
            const isDone=task.status==="done";
            return (
              <button key={task.id} onClick={()=>onToggle(task.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-colors"
                style={{background:isDone?"rgba(255,255,255,0.03)":"transparent",borderColor:"rgba(255,255,255,0.05)"}}>
                <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{background:isDone?"#666":"transparent",borderColor:isDone?"#666":"#333"}}>
                  {isDone&&<Check size={9} color="#0a0a0a" strokeWidth={3}/>}
                </div>
                <span className={`text-[11px] ${isDone?"line-through text-apex-faint":"text-apex-muted"}`}>{task.name}</span>
              </button>
            );
          })
        }
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [habits]         = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [presets]        = useLocalStorage<DayPreset[]>("apex-day-presets", defaultPresets);
  const [exceptions]     = useLocalStorage<DayException[]>("apex-day-exceptions", []);
  const [histories]      = useLocalStorage<Record<string,Record<string,HabitStatus>>>("apex-habit-histories",{});
  const [habitStatuses, setHabitStatuses] = useLocalStorage<Record<string,HabitStatus>>("apex-today-statuses",{});
  const [tasks, setTasks] = useLocalStorage<Task[]>("apex-tasks", defaultTasks);
  const [checkins, setCheckins] = useLocalStorage<CheckinEntry[]>("apex-checkins",[]);
  const [, setCheckinSeen] = useLocalStorage<string>("apex-checkin-seen","");
  const [focusItems, setFocusItems] = useLocalStorage<FocusItem[]>("apex-focus",[]);
  const [readingProjects, setReadingProjects] = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [readingSessions, setReadingSessions] = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);

  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showReadingSheet, setShowReadingSheet] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(()=>{
    setMounted(true);
    // Mostra o check-in no máximo 1x por dia (não reaparece após salvar OU pular).
    try {
      const seenRaw = localStorage.getItem("apex-checkin-seen");
      const seen = seenRaw ? JSON.parse(seenRaw) : "";
      const listRaw = localStorage.getItem("apex-checkins");
      const list = listRaw ? JSON.parse(listRaw) : [];
      const hasToday = Array.isArray(list) && list.some((c:any)=>c.date===today);
      if (!hasToday && seen !== today) setShowCheckin(true);
    } catch { /* ignore */ }
  },[]);

  function handleCheckin(e: CheckinEntry) { setCheckins((p)=>[...p.filter((c)=>c.date!==e.date),e]); setCheckinSeen(today); setShowCheckin(false); }
  function dismissCheckin() { setCheckinSeen(today); setShowCheckin(false); }

  const todayHabits = mounted ? getTodayHabits(habits,presets,exceptions) : [];
  const habitsWithStatus = todayHabits.map((h)=>({...h, status: habitStatuses[h.id]??h.status}));
  const done = habitsWithStatus.filter((h)=>h.status==="done").length;

  const activeBooks = mounted ? readingProjects.filter((b)=>b.status==="active") : [];

  function handleToggleHabit(id: string, next: HabitStatus) {
    const habit = habits.find((h)=>h.id===id);
    if (habit?.opensReadingLog && activeBooks.length>0) { setShowReadingSheet(true); return; }
    setHabitStatuses((p)=>({...p,[id]:next}));
  }

  function logReading(bookId: string, toPage: number) {
    const book = readingProjects.find((b)=>b.id===bookId);
    if (!book) return;
    const fromPage = book.currentPage;
    const pagesRead = Math.max(0, toPage - fromPage);
    setReadingSessions((s)=>[...s,{id:`rs${Date.now()}`,bookId,date:today,fromPage,toPage,pagesRead,createdAt:new Date().toISOString()}]);
    const newCurrent = Math.min(toPage, book.totalPages);
    const reachedEnd = newCurrent >= book.totalPages;
    setReadingProjects((p)=>p.map((b)=>b.id===bookId?{...b,currentPage:newCurrent,status:reachedEnd?"completed":b.status,completedAt:reachedEnd?(b.completedAt??today):b.completedAt,updatedAt:new Date().toISOString()}:b));
    if (pagesRead>0) {
      const reading = habits.find((h)=>h.opensReadingLog);
      if (reading) setHabitStatuses((prev)=>({...prev,[reading.id]:"done"}));
    }
  }

  const todayTasksAll  = tasks.filter(isTaskScheduledToday);
  const tasksWithTime  = todayTasksAll.filter((t)=>t.time);
  const tasksNoTime    = todayTasksAll.filter((t)=>!t.time);

  function handleToggleTask(id: string) {
    setTasks((p)=>p.map((t)=>t.id===id?{...t,status:t.status==="done"?"pending":"done"}:t));
  }
  function handleAddTask(name: string) {
    setTasks((p)=>[...p,{id:`tk${Date.now()}`,name,frequency:{type:"once"},status:"pending",date:today}]);
  }

  // Focus items display
  const primaryFocus = focusItems.find((f)=>f.priority==="primary");
  const secondaryFocus = focusItems.filter((f)=>f.priority==="secondary");

  function getFocusDisplay(f: FocusItem) {
    if (f.type==="habit") {
      const h = habits.find((x)=>x.id===f.refId);
      if (!h) return null;
      const isDone = (habitStatuses[h.id]??h.status)==="done";
      return { name:h.name, color:h.color, icon:h.lucideIcon??"Circle", done:isDone };
    }
    const t = tasks.find((x)=>x.id===f.refId);
    if (!t) return null;
    return { name:t.name, color:"#888", icon:"CheckSquare", done:t.status==="done" };
  }

  // Week calendar data
  const weekDates = getCurrentWeekDates();
  const weekDaysReal = weekDates.map((date,i)=>{
    const d=new Date(date); const dow=(i+1)%7;
    const ids=(exceptions.find((e)=>e.date===date)?.habitIds ?? presets.find((p)=>p.dow===dow)?.habitIds ?? []);
    const dayH=habits.filter((h)=>ids.includes(h.id));
    const doneCount=dayH.filter((h)=>(histories[h.id]?.[date])==="done").length;
    return { shortDay:DOW_NAMES[dow], date:d.getDate(), isToday:date===today, fullDate:date, habitsDone:doneCount, habitsTotal:dayH.length };
  });

  function habitsForDay(date: string): Habit[] {
    const dow=new Date(date).getDay();
    const exc=exceptions.find((e)=>e.date===date);
    const ids=exc?exc.habitIds:(presets.find((p)=>p.dow===dow)?.habitIds??[]);
    return habits.filter((h)=>ids.includes(h.id)).sort((a,b)=>a.time.localeCompare(b.time));
  }
  function historyForHabit(hid: string, date: string): HabitStatus {
    if (date===today) return habitStatuses[hid]??"pending";
    return histories[hid]?.[date]??"pending";
  }

  // Timeline
  const timelineItems = [
    ...habitsWithStatus.map((h)=>({id:h.id,kind:"habit" as const,name:h.name,time:h.time,status:h.status,color:h.color,icon:h.lucideIcon??"Circle",category:h.category,duration:h.duration})),
    ...tasksWithTime.map((t)=>({id:t.id,kind:"task" as const,name:t.name,time:t.time!,status:t.status,color:"#5a5a5a",icon:"CheckSquare",category:"tarefa",duration:undefined})),
  ].sort((a,b)=>a.time.localeCompare(b.time));

  const hours = Array.from({length:17},(_,i)=>i+6);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu dia"/>
      <div className="px-8 py-6 space-y-8">

        {/* Foco do dia */}
        {mounted&&(
          <div className="surface-raised rounded-2xl p-5 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -left-10 -top-12 h-36 w-48 rounded-full" style={{background:"radial-gradient(circle, rgba(227,173,82,0.16), transparent 70%)"}}/>
            <div className="flex items-center justify-between mb-3.5 relative">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:"linear-gradient(135deg,#e3ad52,#c0822f)",boxShadow:"0 0 14px -2px rgba(227,173,82,0.55)"}}>
                  <Star size={12} fill="#14100b" color="#14100b"/>
                </div>
                <p className="text-[9px] text-gold tracking-[2.5px] uppercase font-semibold">Foco do dia</p>
              </div>
              <button onClick={()=>setShowFocusModal(true)} className="text-[10px] text-gold opacity-70 hover:opacity-100 transition-opacity">editar</button>
            </div>
            {focusItems.length===0?(
              <button onClick={()=>setShowFocusModal(true)} className="w-full text-left text-[11px] text-apex-muted hover:text-apex-white transition-colors py-2 relative">
                <span className="text-gold">+</span> Defina seu foco do dia — 1 missão principal e 2 secundárias
              </button>
            ):(
              <div className="space-y-2 relative">
                {primaryFocus&&(()=>{
                  const d=getFocusDisplay(primaryFocus);
                  if(!d) return null;
                  return (
                    <div key="primary" className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{background:`linear-gradient(180deg, ${d.color}1f, ${d.color}0a)`,borderColor:`${d.color}55`,boxShadow:`0 8px 24px -14px ${d.color}88`}}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${d.color}22`}}>
                        <LucideIcon name={d.icon} size={16} color={d.color}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Star size={9} fill={d.color} color={d.color}/>
                          <span className="text-[7.5px] uppercase tracking-[1.5px]" style={{color:d.color}}>principal</span>
                        </div>
                        <span className="text-[13px] font-semibold block truncate" style={{color:d.done?d.color:"var(--color-text-primary)"}}>{d.name}</span>
                      </div>
                      {d.done&&<div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:d.color}}><Check size={13} color="#14100b" strokeWidth={3}/></div>}
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-2">
                  {secondaryFocus.map((f)=>{
                    const d=getFocusDisplay(f); if(!d) return null;
                    return (
                      <div key={f.refId} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{background:`${d.color}10`,borderColor:`${d.color}33`}}>
                        <LucideIcon name={d.icon} size={13} color={d.color}/>
                        <span className="text-[11px] flex-1 truncate" style={{color:d.done?d.color:"#cdbfa6"}}>{d.name}</span>
                        {d.done&&<Check size={11} color={d.color} strokeWidth={3}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Métricas */}
        <DashboardSummary scoreSemanal={weekMetrics.scoreSemanal} consistencia={weekMetrics.consistencia} habitosHoje={done} habitosTotal={todayHabits.length} treinosConcluidos={weekMetrics.treinosConcluidos} treinosTotal={weekMetrics.treinosTotal}/>

        {/* Círculos estilo Streaks */}
        {mounted&&(
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] text-apex-faint tracking-[2px] uppercase">Hábitos de hoje</p>
              <p className="text-[10px] text-apex-muted font-mono">{done}/{todayHabits.length}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:16}}>
              {habitsWithStatus.map((h)=><HabitCircle key={h.id} habit={h} onToggle={handleToggleHabit}/>)}
            </div>
          </section>
        )}

        {/* Timeline + Tarefas */}
        {mounted&&(
          <section>
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Timeline do dia</p>
            <div className="flex gap-4 items-stretch">
              {/* Timeline */}
              <div className="flex-1 relative min-w-0">
                {hours.map((hour)=>{
                  const timeStr=`${String(hour).padStart(2,"0")}:00`;
                  const items=timelineItems.filter((h)=>parseInt(h.time.split(":")[0])===hour);
                  if (items.length===0) return (
                    <div key={hour} className="flex gap-3 items-center min-h-[24px]">
                      <span className="text-[9px] text-apex-faint font-mono w-10 text-right flex-shrink-0 opacity-30">{timeStr}</span>
                      <div className="flex flex-col items-center w-3 flex-shrink-0 self-stretch"><div className="w-px flex-1 bg-apex-border opacity-20"/></div>
                    </div>
                  );
                  return items.map((item,ii)=>{
                    const isDone=item.status==="done";
                    return (
                      <div key={`${hour}-${ii}`} className="flex gap-3 items-start">
                        <span className="text-[10px] text-apex-faint font-mono w-10 text-right flex-shrink-0 pt-3.5">{ii===0?item.time:""}</span>
                        <div className="flex flex-col items-center w-3 flex-shrink-0">
                          <div className="w-px h-3 bg-apex-border"/>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:isDone?item.color:"#2a2a2a"}}/>
                          <div className="w-px flex-1 bg-apex-border"/>
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2.5 px-3 py-2.5 my-1 rounded-xl border transition-colors"
                            style={{background:isDone?`${item.color}15`:"var(--color-background-primary)",borderColor:isDone?"transparent":"var(--color-border-tertiary)"}}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${item.color}22`}}>
                              <LucideIcon name={item.icon} size={14} color={item.color} strokeWidth={1.5}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium leading-none" style={{color:isDone?item.color:"var(--color-text-primary)"}}>{item.name}</p>
                              <p className="text-[9px] text-apex-faint mt-0.5">{item.category}{item.duration?` · ${item.duration}`:""}</p>
                            </div>
                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border"
                              style={{background:isDone?item.color:"transparent",borderColor:isDone?item.color:"#2a2a2a"}}>
                              {isDone&&<Check size={10} color="#080808" strokeWidth={3}/>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>

              {/* Tarefas soltas — mesmo height que a timeline */}
              <TasksPanel
                tasks={tasksNoTime} onToggle={handleToggleTask} onAdd={handleAddTask}
                collapsed={tasksCollapsed} onCollapse={()=>setTasksCollapsed(p=>!p)}
              />
            </div>
          </section>
        )}

        {/* Calendário */}
        <section>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-4">Semana atual</p>
          <WeeklyCalendar days={weekDaysReal} selectedDate={selectedDate} onDayClick={(d)=>setSelectedDate(p=>p===d?null:d)} habitsForDay={habitsForDay} historyForHabit={historyForHabit}/>
          <div className="flex gap-4 mt-3 flex-wrap">
            {[{c:"#c9a84c",l:"Dourado 80%+"},{c:"#9CA3AF",l:"Prata 60-79%"},{c:"#CD7F32",l:"Bronze 41-59%"},{c:"#2a2a2a",l:"Abaixo 40%"}].map((m)=>(
              <div key={m.l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{background:m.c}}/>
                <span className="text-[9px] text-apex-faint">{m.l}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {mounted&&showCheckin&&<CheckinModal onComplete={handleCheckin} onSkip={dismissCheckin}/>}
        {showFocusModal&&<FocusSelector habits={todayHabits} tasks={tasks.filter(isTaskScheduledToday)} onSave={setFocusItems} onClose={()=>setShowFocusModal(false)}/>}
        {showReadingSheet&&activeBooks.length>0&&<ReadingLogSheet activeBooks={activeBooks} sessions={readingSessions} onLog={logReading} onClose={()=>setShowReadingSheet(false)}/>}
      </AnimatePresence>
    </motion.div>
  );
}
