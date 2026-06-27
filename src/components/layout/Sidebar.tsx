"use client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, RotateCcw, TrendingUp, CalendarDays, Dumbbell,
  Brain, BookOpen, RefreshCw, Utensils, CalendarClock, Settings, Target, Flame, Library,
} from "lucide-react";

const NAV = [
  { section:"PRINCIPAL", items:[
    { id:"dashboard",    label:"Dashboard",   Icon:LayoutDashboard },
    { id:"rotina",       label:"Rotina",       Icon:RotateCcw },
    { id:"tracker",      label:"Tracker",      Icon:Target },
    { id:"performance",  label:"Performance",  Icon:TrendingUp },
  ]},
  { section:"TREINO", items:[
    { id:"periodizacao", label:"Periodização", Icon:CalendarDays },
    { id:"treinos",      label:"Treinos",       Icon:Dumbbell },
  ]},
  { section:"MENTE", items:[
    { id:"deepwork",     label:"Deep Work",    Icon:Brain },
    { id:"biblioteca",   label:"Biblioteca",   Icon:Library },
    { id:"diario",       label:"Diário",        Icon:BookOpen },
    { id:"revisao",      label:"Revisão",       Icon:RefreshCw },
  ]},
  { section:"SAÚDE", items:[
    { id:"dieta",        label:"Dieta",         Icon:Utensils },
  ]},
  { section:"PLANEJAMENTO", items:[
    { id:"planejamento", label:"Planejamento",  Icon:CalendarClock },
  ]},
  { section:"SISTEMA", items:[
    { id:"configuracoes",label:"Configurações", Icon:Settings },
  ]},
];

interface Props { activePage:string; onNavigate:(p:string)=>void; streakDias:number; }

export default function Sidebar({ activePage, onNavigate, streakDias }: Props) {
  // Progresso até o próximo marco semanal (gamificação visual)
  const cycle = streakDias % 7;
  const atMilestone = streakDias > 0 && cycle === 0;
  const pct = atMilestone ? 100 : (cycle / 7) * 100;
  const remaining = atMilestone ? 0 : 7 - cycle;

  return (
    <aside className="w-[186px] flex-shrink-0 border-r border-apex-border flex flex-col h-screen sticky top-0"
      style={{background:"linear-gradient(180deg, #1d1811, #16110b)"}}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-apex-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{background:"linear-gradient(135deg,#e3ad52,#b9822f)",boxShadow:"0 0 16px -2px rgba(227,173,82,0.5)"}}>
            <Flame size={13} color="#1b1610" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-apex-white text-[13px] font-semibold tracking-[3px] uppercase leading-none">Apex</p>
            <p className="text-apex-faint text-[8px] tracking-[2px] uppercase mt-1">Sistema Pessoal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section} className="px-3 mb-4">
            <p className="text-[8px] text-apex-faint tracking-[2.5px] uppercase px-2 mb-2">{group.section}</p>
            {group.items.map(({ id, label, Icon }) => {
              const active = activePage === id;
              return (
                <button key={id} onClick={() => onNavigate(id)}
                  className={`relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 transition-all duration-200 text-left
                    ${active ? "text-apex-white" : "text-apex-muted hover:bg-[#241d14] hover:text-apex-white"}`}
                  style={active ? {
                    background:"linear-gradient(90deg, rgba(227,173,82,0.16), rgba(227,173,82,0.04))",
                    boxShadow:"inset 0 0 0 1px rgba(227,173,82,0.18)",
                  } : undefined}>
                  {active && (
                    <motion.div layoutId="activeBar" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                      style={{background:"#e3ad52",boxShadow:"0 0 10px #e3ad52"}}/>
                  )}
                  <Icon size={15} className={active ? "text-gold" : ""} strokeWidth={active ? 2.2 : 1.6} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Streak / XP badge */}
      <div className="mx-3 mb-4 p-3.5 rounded-2xl surface-raised">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Flame size={12} color="#e3ad52" fill="#e3ad52" />
          <p className="text-[8px] text-gold tracking-[2px] uppercase font-semibold">Streak</p>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <p className="font-stat text-[30px] font-medium text-apex-white text-glow-gold leading-none" style={{letterSpacing:"-1px"}}>{streakDias}</p>
          <p className="text-[9px] text-apex-faint">dias seguidos</p>
        </div>
        {/* Barra até o próximo marco */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(122,104,78,0.25)"}}>
          <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.9,ease:[.22,.61,.36,1]}}
            className="h-full rounded-full" style={{background:"linear-gradient(90deg,#e3ad52,#d0855a)",boxShadow:"0 0 8px rgba(227,173,82,0.6)"}}/>
        </div>
        <p className="text-[8.5px] text-apex-faint mt-1.5">
          {atMilestone ? "🔥 marco semanal atingido" : `faltam ${remaining} p/ próximo marco`}
        </p>
      </div>
    </aside>
  );
}
