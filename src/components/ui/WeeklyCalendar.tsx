"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import LucideIcon from "@/components/ui/LucideIcon";
import { getMedalColor, type Habit, type HabitStatus } from "@/data/mockData";

interface WeekDay { shortDay:string; date:number; isToday:boolean; fullDate:string; habitsDone:number; habitsTotal:number; }
interface Props { days:WeekDay[]; selectedDate?:string|null; onDayClick?:(d:string)=>void; habitsForDay?:(d:string)=>Habit[]; historyForHabit?:(hid:string,d:string)=>HabitStatus; }

export default function WeeklyCalendar({ days, selectedDate, onDayClick, habitsForDay, historyForHabit }: Props) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day,i)=>{
          const isFuture=day.fullDate>today;
          const pct=day.habitsTotal>0?Math.round((day.habitsDone/day.habitsTotal)*100):0;
          const medal=getMedalColor(pct,isFuture);
          const isSel=selectedDate===day.fullDate;
          return (
            <motion.button key={day.fullDate} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05,duration:0.35}}
              whileHover={{y:-3}}
              onClick={()=>onDayClick?.(day.fullDate)}
              className={`relative flex flex-col items-center py-3.5 px-1 rounded-2xl border transition-all duration-200 text-center hover-lift
                ${day.isToday?"border-gold":isSel?"surface-card border-apex-border2":"surface-card"}`}
              style={day.isToday?{boxShadow:"inset 0 0 0 1px rgba(227,173,82,0.25), 0 8px 24px -12px rgba(227,173,82,0.3)",background:"radial-gradient(120% 140% at 50% 0%, rgba(227,173,82,0.12), transparent 55%), var(--cacao)"}:undefined}>
              <p className={`text-[8px] tracking-[1.5px] uppercase mb-1.5 ${day.isToday?"text-gold":"text-apex-faint"}`}>{day.shortDay}</p>
              <p className={`font-stat text-[16px] font-medium leading-none mb-2.5 ${day.isToday?"text-apex-white":"text-apex-muted"}`}>{day.date}</p>
              <div className="w-full h-1 rounded-full mb-2 overflow-hidden" style={{background:isFuture?"rgba(122,104,78,0.12)":"rgba(122,104,78,0.22)"}}>
                {!isFuture&&pct>0&&<motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.05+0.2,duration:0.6}} className="h-1 rounded-full" style={{background:medal,boxShadow:`0 0 6px ${medal}99`}}/>}
              </div>
              {!isFuture&&<div className="w-2 h-2 rounded-full" style={{background:medal,opacity:pct===0?0.35:1,boxShadow:pct>=80?`0 0 8px ${medal}`:"none"}}/>}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {selectedDate&&habitsForDay&&(
          <motion.div initial={{opacity:0,y:-8,height:0}} animate={{opacity:1,y:0,height:"auto"}} exit={{opacity:0,y:-8,height:0}} className="mt-3 surface-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-apex-border">
              <p className="text-[10px] text-apex-muted font-stat">{selectedDate}</p>
              <button onClick={()=>onDayClick?.(selectedDate)} className="text-apex-faint hover:text-apex-muted transition-colors"><X size={13}/></button>
            </div>
            <div className="p-3 space-y-1.5">
              {habitsForDay(selectedDate).length===0
                ?<p className="text-[11px] text-apex-faint italic px-1 py-2">Nenhum hábito planejado</p>
                :habitsForDay(selectedDate).map((h)=>{
                  const st=historyForHabit?.(h.id,selectedDate)??"pending";
                  const isDone=st==="done"; const isSkip=st==="skipped";
                  return (
                    <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border" style={{background:isDone?`${h.color}14`:"transparent",borderColor:isDone?`${h.color}30`:"rgba(243,235,221,0.05)"}}>
                      <LucideIcon name={h.lucideIcon??"Circle"} size={12} color={isDone?h.color:"#6f5c40"}/>
                      <div className="flex-1">
                        <p className="text-[11px] font-medium" style={{color:isDone?h.color:"#a99a83"}}>{h.name}</p>
                        <p className="text-[9px] text-apex-faint font-stat">{h.time}</p>
                      </div>
                      <span className="text-[9px] font-stat" style={{color:isDone?h.color:isSkip?"#d0855a":"#6f5c40"}}>{isDone?"feito":isSkip?"pulado":"—"}</span>
                    </div>
                  );
                })
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
