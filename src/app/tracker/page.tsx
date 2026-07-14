"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Minus, Plus, Check, SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProgressRing from "@/components/ui/ProgressRing";
import LucideIcon from "@/components/ui/LucideIcon";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  defaultHabits, getCurrentWeekDates, countDoneThisWeek, freqLabel,
  type Habit, type HabitStatus,
} from "@/data/mockData";

const DAY_LABELS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

function buildMockHistory(habit: Habit): Record<string, HabitStatus> {
  const dates = getCurrentWeekDates();
  const history: Record<string, HabitStatus> = {};
  const mockDone: Record<string, number[]> = {
    h1:[0,1,2,3,4,5], h2:[0,2,4], h3:[1,3], h4:[0,1,2,3,4], h5:[0,3], h6:[0,1,2,3,4,5],
  };
  dates.forEach((date, i) => {
    history[date] = (mockDone[habit.id] ?? []).includes(i) ? "done" : "skipped";
  });
  return history;
}

// ════════════════════════════════════════════════════════════
//  GOAL STEPPER — o "dial de atributo" (componente assinatura)
// ════════════════════════════════════════════════════════════
function GoalStepper({ habit, done, goal, onGoalChange }: {
  habit: Habit; done: number; goal: number; onGoalChange: (g: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const pct = goal > 0 ? Math.min((done / goal) * 100, 100) : 0;
  const onTrack = done >= goal && goal > 0;
  const c = habit.color;

  function change(delta: number) {
    onGoalChange(Math.min(7, Math.max(1, goal + delta)));
  }
  function confirm() {
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 700);
  }

  // ── Estado de EDIÇÃO: stepper – / valor / + ──
  if (editing) {
    return (
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1 rounded-2xl pl-1.5 pr-1.5 py-1.5"
        style={{ background: `linear-gradient(180deg, ${c}1f, ${c}0a)`, border: `1.5px solid ${c}`, boxShadow: `0 0 0 4px ${c}1a, 0 10px 28px -12px ${c}66` }}>
        <button onClick={() => change(-1)} aria-label="Diminuir meta"
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          style={{ background: "rgba(20,16,11,0.6)", color: c, border: `1px solid ${c}44` }}>
          <Minus size={13} strokeWidth={2.6} />
        </button>

        <div className="flex flex-col items-center justify-center" style={{ minWidth: 46 }}>
          <div className="flex items-baseline gap-0.5 leading-none">
            <AnimatePresence mode="popLayout">
              <motion.span key={goal}
                initial={{ y: -8, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="font-stat text-[26px] font-medium" style={{ color: c, letterSpacing: "-1px" }}>
                {goal}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-[8px] text-apex-faint uppercase tracking-wider mt-0.5">por semana</span>
        </div>

        <button onClick={() => change(1)} aria-label="Aumentar meta"
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          style={{ background: "rgba(20,16,11,0.6)", color: c, border: `1px solid ${c}44` }}>
          <Plus size={13} strokeWidth={2.6} />
        </button>

        <button onClick={confirm} aria-label="Confirmar meta"
          className="w-7 h-7 rounded-xl flex items-center justify-center ml-0.5 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          style={{ background: c, color: "#14100b" }}>
          <Check size={14} strokeWidth={3} />
        </button>
      </motion.div>
    );
  }

  // ── Estado de REPOUSO: chip clicável com brilho no hover ──
  return (
    <motion.button
      onClick={() => setEditing(true)}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      animate={justSaved ? { boxShadow: [`0 0 0 0px ${c}00`, `0 0 0 5px ${c}40`, `0 0 0 0px ${c}00`] } : {}}
      transition={{ duration: 0.6 }}
      aria-label={`Ajustar meta semanal de ${habit.name}, atualmente ${goal}`}
      className="group relative flex items-center gap-3 rounded-2xl pl-3.5 pr-3 py-2 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 transition-colors"
      style={{
        background: onTrack ? `linear-gradient(180deg, ${c}1c, ${c}08)` : "rgba(255,247,235,0.018)",
        border: `1px solid ${onTrack ? `${c}55` : "var(--ember-ln)"}`,
      }}>
      {/* glow no hover */}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: `inset 0 0 22px -6px ${c}55`, border: `1px solid ${c}66`, borderRadius: 16 }}/>

      {/* número */}
      <div className="flex flex-col items-end leading-none relative">
        <div className="flex items-baseline gap-0.5">
          <span className="font-stat text-[22px] font-medium" style={{ color: onTrack ? c : "var(--color-text-primary)", letterSpacing: "-0.5px" }}>{done}</span>
          <span className="font-stat text-[12px] text-apex-muted">/{goal}</span>
        </div>
        <span className="text-[7.5px] text-apex-faint uppercase tracking-[1.5px] mt-1">meta semanal</span>
      </div>

      {/* divisor */}
      <span className="w-px h-8 self-center" style={{ background: "var(--ember-ln)" }}/>

      {/* afford. de edição */}
      <div className="flex flex-col items-center gap-0.5 relative" style={{ width: 22 }}>
        <SlidersHorizontal size={13} className="text-apex-faint group-hover:text-apex-white transition-colors" style={{ color: onTrack ? c : undefined }}/>
        <span className="text-[7px] text-apex-faint group-hover:text-apex-muted uppercase tracking-wide transition-colors">ajustar</span>
      </div>

      {/* barra de progresso na base */}
      <span aria-hidden className="absolute left-0 bottom-0 h-[3px] rounded-full transition-all" style={{ width: `${pct}%`, background: c, boxShadow: `0 0 8px ${c}aa` }}/>
    </motion.button>
  );
}

// ── Linha de hábito (subcomponente para isolar o useState) ──
function HabitRow({ habit, history, goal, onGoalChange }: {
  habit: Habit; history: Record<string, HabitStatus>; goal: number; onGoalChange: (g: number) => void;
}) {
  const dates = getCurrentWeekDates();

  return (
    <div className="surface-card rounded-2xl p-3 md:p-3.5 mb-2.5">
      <div className="flex flex-wrap items-center gap-y-3">
        {/* A — ícone + nome */}
        <div className="flex items-center gap-2.5 order-1 w-[58%] md:w-[180px] md:flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${habit.color}1c`, border: `1px solid ${habit.color}33` }}>
            <LucideIcon name={habit.lucideIcon ?? "Circle"} size={16} color={habit.color} strokeWidth={1.9}/>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-apex-white truncate">{habit.name}</p>
            <p className="text-[9px] text-apex-faint font-stat">{freqLabel(habit.frequency)}</p>
          </div>
        </div>

        {/* C — dial de meta (à direita) */}
        <div className="order-2 ml-auto md:order-3">
          <GoalStepper habit={habit} done={countDoneThisWeek(history)} goal={goal} onGoalChange={onGoalChange}/>
        </div>

        {/* B — células dos 7 dias */}
        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 flex justify-center md:justify-start gap-1.5 md:pl-2">
          {dates.map((date) => {
            const st = history[date] ?? "pending";
            const isDone = st === "done";
            const d = new Date(date + "T12:00:00");
            const t = new Date(); t.setHours(0,0,0,0);
            const isFuture = d > t;
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <div key={date} title={date}
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: isDone ? `${habit.color}2e` : isFuture ? "rgba(122,104,78,0.06)" : "rgba(122,104,78,0.1)",
                  border: isToday ? `1.5px solid ${habit.color}` : "1px solid transparent",
                  boxShadow: isDone ? `0 0 10px -2px ${habit.color}66` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: isDone ? habit.color : "rgba(170,154,131,0.35)",
                  transition: "all 0.2s",
                }}>
                {isDone ? "✓" : isFuture ? "" : "–"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [habits]  = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [histories] = useLocalStorage<Record<string, Record<string, HabitStatus>>>(
    "apex-habit-histories",
    Object.fromEntries(defaultHabits.map(h => [h.id, buildMockHistory(h)]))
  );
  const [weeklyGoals, setWeeklyGoals] = useLocalStorage<Record<string, number>>(
    "apex-weekly-goals",
    Object.fromEntries(defaultHabits.map(h => [h.id, h.weeklyGoal]))
  );
  const [showInfo, setShowInfo] = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const totalDone  = habits.reduce((a, h) => a + countDoneThisWeek(histories[h.id] ?? {}), 0);
  const totalGoal  = habits.reduce((a, h) => a + (weeklyGoals[h.id] ?? h.weeklyGoal), 0);
  const onTrackAll = habits.filter(h => countDoneThisWeek(histories[h.id] ?? {}) >= (weeklyGoals[h.id] ?? h.weeklyGoal)).length;
  const bestStreak = Math.max(...habits.map(h => h.streak), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Tracker" subtitle="Sua evolução semanal, hábito por hábito" />
      <div className="apex-page max-w-3xl">

        {/* Painel principal — anel + stats */}
        <div className="surface-raised rounded-3xl p-6 mb-5">
          <div className="flex items-center gap-8 mb-6 flex-wrap">
            <ProgressRing done={totalDone} goal={totalGoal} color="#e3ad52" size={148} stroke={14} label="geral" />
            <div className="space-y-1">
              <p className="text-[9px] text-apex-faint tracking-[2.5px] uppercase mb-2">Semana atual</p>
              <p className="text-[14px] font-medium text-apex-white mb-4">{totalDone} de {totalGoal} hábitos concluídos</p>
              <div className="flex gap-7">
                <div>
                  <p className="font-stat text-[24px] font-medium text-apex-white leading-none">{onTrackAll}</p>
                  <p className="text-[9px] text-apex-faint uppercase tracking-wider mt-1.5">no prazo</p>
                </div>
                <div>
                  <p className="font-stat text-[24px] font-medium text-apex-muted leading-none">{habits.length - onTrackAll}</p>
                  <p className="text-[9px] text-apex-faint uppercase tracking-wider mt-1.5">abaixo</p>
                </div>
                <div>
                  <p className="font-stat text-[24px] font-medium text-gold text-glow-gold leading-none">{bestStreak}</p>
                  <p className="text-[9px] text-apex-faint uppercase tracking-wider mt-1.5">🔥 streak</p>
                </div>
              </div>
            </div>
          </div>
          {/* Anéis individuais */}
          <div className="grid pt-5 border-t border-apex-border" style={{ gridTemplateColumns: `repeat(${Math.min(habits.length, 6)}, 1fr)`, gap: 12 }}>
            {habits.map(h => {
              const done = countDoneThisWeek(histories[h.id] ?? {});
              const goal = weeklyGoals[h.id] ?? h.weeklyGoal;
              return (
                <div key={h.id} className="flex flex-col items-center gap-2">
                  <ProgressRing done={done} goal={goal} color={h.color} size={60} stroke={6} showLabel={true} />
                  <span className="text-[9px] text-apex-muted text-center leading-tight">{h.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap + dials de meta */}
        <div className="surface-card rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-apex-border">
            <p className="text-[9px] text-apex-faint tracking-[2.5px] uppercase">Hábitos & metas</p>
            <div className="hidden md:flex gap-1.5 ml-auto mr-2">
              {DAY_LABELS.map(d => (<div key={d} className="w-[30px] text-center text-[8px] text-apex-faint uppercase">{d}</div>))}
            </div>
            <button onClick={() => setShowInfo(o => !o)}
              className="md:hidden ml-auto flex items-center gap-1 text-[9px] text-apex-faint hover:text-apex-muted transition-colors">
              <Info size={11} /> ajuda
            </button>
          </div>

          {/* Dica clara sobre o dial */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4" style={{ background: "rgba(227,173,82,0.07)", border: "1px solid rgba(227,173,82,0.16)" }}>
            <SlidersHorizontal size={12} className="text-gold flex-shrink-0" />
            <p className="text-[10px] text-apex-muted">Toque no <strong className="text-apex-white">dial de meta</strong> (à direita de cada hábito) para ajustar quantas vezes por semana você quer cumpri-lo.</p>
          </div>

          {habits.map(h => (
            <HabitRow
              key={h.id}
              habit={h}
              history={histories[h.id] ?? {}}
              goal={weeklyGoals[h.id] ?? h.weeklyGoal}
              onGoalChange={(newGoal) => setWeeklyGoals(p => ({ ...p, [h.id]: newGoal }))}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
