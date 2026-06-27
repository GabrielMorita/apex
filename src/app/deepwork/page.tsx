"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";

type TimerMode = "focus25"|"focus45"|"short"|"long";
const MODES: Record<TimerMode,{label:string;minutes:number;color:string}> = {
  focus25: { label:"Foco 25min", minutes:25, color:"#c9a84c" },
  focus45: { label:"Foco 45min", minutes:45, color:"#8b5cf6" },
  short:   { label:"Pausa 5min", minutes:5,  color:"#10b981" },
  long:    { label:"Pausa 15min",minutes:15, color:"#3B82F6" },
};
interface Session { id:string; date:string; minutes:number; task:string; }
function pad(n:number){return String(n).padStart(2,"0");}

export default function DeepWorkPage() {
  const [mode, setMode]     = useState<TimerMode>("focus25");
  const [seconds, setSec]   = useState(MODES.focus25.minutes*60);
  const [running, setRun]   = useState(false);
  const [task, setTask]     = useState("");
  const [sessions, setSess] = useLocalStorage<Session[]>("apex-deepwork-sessions",[]);
  const ref = useRef<NodeJS.Timeout|null>(null);
  const cur = MODES[mode];
  const total = cur.minutes*60;
  const pct = ((total-seconds)/total)*100;
  const R=80, C=2*Math.PI*R;
  const fill=C*(pct/100), gap=C-fill, offset=C*0.25;

  useEffect(()=>{
    if(running){
      ref.current=setInterval(()=>{
        setSec((s)=>{
          if(s<=1){
            setRun(false);
            if(mode==="focus25"||mode==="focus45"){
              setSess((p)=>[...p,{id:`s${Date.now()}`,date:new Date().toISOString().split("T")[0],minutes:cur.minutes,task:task||"Sessão de foco"}]);
            }
            return 0;
          }
          return s-1;
        });
      },1000);
    } else { if(ref.current) clearInterval(ref.current); }
    return ()=>{ if(ref.current) clearInterval(ref.current); };
  },[running]);

  function handleMode(m:TimerMode){ setMode(m); setRun(false); setSec(MODES[m].minutes*60); }
  function handleReset(){ setRun(false); setSec(cur.minutes*60); }

  const today = new Date().toISOString().split("T")[0];
  const todaySess = sessions.filter((s)=>s.date===today);
  const todayMin  = todaySess.reduce((a,s)=>a+s.minutes,0);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 overflow-y-auto">
      <PageHeader title="Deep Work" subtitle="Sessões de foco profundo"/>
      <div className="px-8 py-6 max-w-2xl">

        <div className="bg-apex-card border border-apex-border rounded-2xl p-8 mb-6 flex flex-col items-center">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {(Object.entries(MODES) as [TimerMode,typeof MODES.focus25][]).map(([key,val])=>(
              <button key={key} onClick={()=>handleMode(key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${mode===key?"border-gold text-gold bg-apex-gold-bg":"border-apex-border text-apex-muted hover:border-apex-border2"}`}>
                {val.label}
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="relative flex items-center justify-center mb-6" style={{width:200,height:200}}>
            <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`}>
              <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="12"/>
              {pct>0&&<circle cx="100" cy="100" r={R} fill="none" stroke={cur.color} strokeWidth="12"
                strokeDasharray={`${fill.toFixed(2)} ${gap.toFixed(2)}`} strokeDashoffset={offset.toFixed(2)}
                strokeLinecap="round" transform="rotate(-90 100 100)"/>}
            </svg>
            <div className="absolute text-center">
              <p className="text-[40px] font-medium text-apex-white font-mono leading-none">{pad(Math.floor(seconds/60))}:{pad(seconds%60)}</p>
              <p className="text-[11px] text-apex-muted mt-1">{cur.label}</p>
            </div>
          </div>

          <input type="text" placeholder="Em que você vai focar?" value={task} onChange={(e)=>setTask(e.target.value)}
            className="w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors text-center mb-4"/>

          <div className="flex gap-3">
            <button onClick={()=>setRun((r)=>!r)} style={{background:cur.color}}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-apex-bg text-[12px] font-medium hover:opacity-90 transition-opacity">
              {running?<><Pause size={14}/>Pausar</>:<><Play size={14}/>{seconds===total?"Iniciar":"Continuar"}</>}
            </button>
            <button onClick={handleReset} className="p-2.5 rounded-xl bg-apex-surface border border-apex-border text-apex-muted hover:border-apex-border2 transition-colors">
              <RotateCcw size={14}/>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-apex-card border border-apex-border rounded-xl p-4 text-center">
            <p className="text-[22px] font-medium text-gold">{todaySess.length}</p>
            <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-1">Sessões hoje</p>
          </div>
          <div className="bg-apex-card border border-apex-border rounded-xl p-4 text-center">
            <p className="text-[22px] font-medium text-apex-white">{todayMin}</p>
            <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-1">Minutos focados</p>
          </div>
          <div className="bg-apex-card border border-apex-border rounded-xl p-4 text-center">
            <p className="text-[22px] font-medium text-apex-white">{sessions.length}</p>
            <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-1">Total histórico</p>
          </div>
        </div>

        {todaySess.length>0&&(
          <div>
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-3">Sessões de hoje</p>
            <div className="space-y-2">
              {[...todaySess].reverse().map((s)=>(
                <div key={s.id} className="bg-apex-card border border-apex-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-[12px] text-apex-white">{s.task}</p>
                  <span className="text-[10px] text-gold font-mono">{s.minutes} min</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
