"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, BatteryMedium, CheckCircle2, Dumbbell, Flag, Mountain, Target } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LucideIcon from "@/components/ui/LucideIcon";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { navigateTo } from "@/lib/navigationEvents";
import { countDoneThisWeek, defaultHabits, defaultPlannedWorkouts, getCurrentWeekDates, type Habit, type HabitStatus, type PlannedWorkout } from "@/data/mockData";
import { defaultGoals, defaultTasks, isTaskScheduledToday, type CheckinEntry, type Goal, type Task } from "@/data/extraData";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function goalProgress(goal: Goal) {
  if (goal.target <= 0) return 0;
  return clamp(goal.unit === "min" && goal.current > goal.target ? (goal.target / goal.current) * 100 : (goal.current / goal.target) * 100);
}

function Metric({ label, value, detail, Icon, emphasis = false }: { label: string; value: string; detail: string; Icon: typeof Activity; emphasis?: boolean }) {
  return (
    <Card emphasis={emphasis} className="p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3"><p className="apex-kicker pt-1">{label}</p><IconTile Icon={Icon} active={emphasis} size="sm" /></div>
      <p className={`font-stat text-[28px] font-medium tracking-[-.05em] ${emphasis ? "text-accent" : "text-ink"}`}>{value}</p>
      <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">{detail}</p>
    </Card>
  );
}

function ApexPath({ score }: { score: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface px-3 pb-3 pt-4">
      <svg viewBox="0 0 300 115" className="h-[112px] w-full" role="img" aria-label={`Trajetória semanal em ${score}%`}>
        <path d="M18 99 C58 91 77 68 111 74 C146 81 158 40 196 50 C227 58 244 24 282 17" fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="5 7" />
        <path d="M190 53 L230 18 L252 39 L282 8" fill="none" stroke="var(--border-default)" strokeWidth="1.5" />
        <path d="M18 99 C58 91 77 68 111 74 C146 81 158 40 196 50 C227 58 244 24 282 17" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" pathLength="100" strokeDasharray={`${score} 100`} />
        {[{x:18,y:99,p:0},{x:111,y:74,p:33},{x:196,y:50,p:66},{x:282,y:17,p:100}].map((point) => <circle key={point.x} cx={point.x} cy={point.y} r={point.p === 100 ? 5 : 3.5} fill={point.p <= score ? "var(--accent-primary)" : "var(--surface-overlay)"} stroke="var(--border-strong)" />)}
      </svg>
      <div className="flex justify-between text-[8px] font-semibold uppercase tracking-[.14em] text-ink-faint"><span>Começo</span><span>Ritmo</span><span>Consistência</span><span>Ápice</span></div>
    </div>
  );
}

export default function ProgressoPage() {
  const [mounted, setMounted] = useState(false);
  const [habits] = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [histories] = useLocalStorage<Record<string, Record<string, HabitStatus>>>("apex-habit-histories", {});
  const [todayStatuses] = useLocalStorage<Record<string, HabitStatus>>("apex-today-statuses", {});
  const [weeklyGoals] = useLocalStorage<Record<string, number>>("apex-weekly-goals", Object.fromEntries(defaultHabits.map((habit) => [habit.id, habit.weeklyGoal])));
  const [planned] = useLocalStorage<PlannedWorkout[]>("apex-planned-workouts", defaultPlannedWorkouts);
  const [tasks] = useLocalStorage<Task[]>("apex-tasks", defaultTasks);
  const [checkins] = useLocalStorage<CheckinEntry[]>("apex-checkins", []);
  const [goals] = useLocalStorage<Goal[]>("apex-goals", defaultGoals);
  useEffect(() => setMounted(true), []);

  const today = new Date().toISOString().split("T")[0];
  const rows = useMemo(() => habits.map((habit) => {
    const history = { ...(histories[habit.id] ?? {}) };
    if (todayStatuses[habit.id]) history[today] = todayStatuses[habit.id];
    const done = countDoneThisWeek(history);
    const goal = weeklyGoals[habit.id] ?? habit.weeklyGoal ?? 7;
    return { habit, done, goal, pct: clamp((done / Math.max(goal, 1)) * 100) };
  }).sort((a, b) => b.pct - a.pct), [habits, histories, todayStatuses, today, weeklyGoals]);

  const totalDone = rows.reduce((sum, row) => sum + row.done, 0);
  const totalGoal = rows.reduce((sum, row) => sum + row.goal, 0);
  const consistency = clamp((totalDone / Math.max(totalGoal, 1)) * 100);
  const workoutsDone = planned.filter((item) => item.done).length;
  const workoutPct = clamp((workoutsDone / Math.max(planned.length, 1)) * 100);
  const todayTasks = tasks.filter(isTaskScheduledToday);
  const tasksDone = todayTasks.filter((task) => task.status === "done").length;
  const taskPct = clamp((tasksDone / Math.max(todayTasks.length, 1)) * 100);
  const latestCheckin = [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  const score = clamp(consistency * .5 + workoutPct * .3 + taskPct * .2);
  const weekDates = getCurrentWeekDates();

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Progresso" subtitle="O que sua execução está construindo" />
      <div className="apex-page space-y-7 sm:space-y-9">
        <section className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
          <Card emphasis className="overflow-hidden p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="apex-kicker mb-2">Trajetória semanal</p><h2 className="max-w-md text-[23px] font-bold leading-tight tracking-[-.04em] text-ink sm:text-[28px]">Você não está acumulando tarefas. Está construindo capacidade.</h2><p className="mt-3 max-w-lg text-[11px] leading-relaxed text-ink-muted">O score combina hábitos, treinos e entregas do dia.</p></div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line-accent bg-accent-subtle text-accent"><Mountain size={20} /></span>
            </div>
            <div className="mb-4 flex items-end gap-3"><span className="font-stat text-[54px] font-medium leading-none tracking-[-.08em] text-accent">{score}</span><div className="pb-1"><p className="text-[11px] font-semibold text-ink">score atual</p><p className="mt-1 text-[9px] text-ink-muted">de 100 pontos possíveis</p></div></div>
            <ApexPath score={score} />
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Consistência" value={`${consistency}%`} detail={`${totalDone} de ${totalGoal} execuções`} Icon={CheckCircle2} emphasis />
            <Metric label="Treinos" value={`${workoutsDone}/${planned.length}`} detail={`${workoutPct}% da semana`} Icon={Dumbbell} />
            <Metric label="Entregas hoje" value={`${tasksDone}/${todayTasks.length}`} detail="tarefas previstas" Icon={Target} />
            <Metric label="Energia" value={latestCheckin ? `${latestCheckin.energia}/5` : "—"} detail={latestCheckin ? "último check-in" : "registre no Hoje"} Icon={BatteryMedium} />
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Sinais principais" title="Consistência por hábito" action={<button onClick={() => navigateTo("tracker")} className="flex min-h-10 items-center gap-1.5 text-[10px] font-semibold text-accent">Detalhar <ArrowRight size={13} /></button>} />
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.slice(0, 6).map(({ habit, done, goal, pct }) => (
              <Card key={habit.id} className="p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-control border" style={{ background: `${habit.color}14`, borderColor: `${habit.color}30` }}><LucideIcon name={habit.lucideIcon ?? "Circle"} size={17} color={habit.color} /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-[12px] font-semibold text-ink">{habit.name}</p><span className="font-stat text-[10px] text-ink-muted">{done}/{goal}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: habit.color }} /></div></div><span className="font-stat text-[12px] font-medium" style={{ color: pct >= 100 ? habit.color : "var(--text-secondary)" }}>{pct}%</span></div></Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_.8fr]">
          <div><SectionHeader eyebrow="Direção" title="Metas em movimento" /><div className="space-y-3">{goals.map((goal) => { const pct = goalProgress(goal); return <Card key={goal.id} className="p-4 sm:p-5"><div className="flex items-start gap-3"><IconTile Icon={Flag} active={pct >= 80} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[13px] font-semibold text-ink">{goal.title}</p><p className="mt-1 text-[9px] text-ink-muted">Prazo {new Date(`${goal.targetDate}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><span className="font-stat text-[12px] text-accent">{goal.current}/{goal.target} {goal.unit}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-accent" /></div><div className="mt-2 flex items-center justify-between"><p className="text-[9px] text-ink-muted">{goal.linkedHabitIds.length} hábito(s) conectado(s)</p><p className="font-stat text-[9px] text-ink-secondary">{pct}%</p></div></div></div></Card>; })}</div></div>
          <div><SectionHeader eyebrow="Próximo ajuste" title="Onde agir agora" /><Card className="p-5"><div className="mb-5 flex items-center gap-3"><IconTile Icon={Activity} active /><div><p className="text-[13px] font-semibold text-ink">Transforme dados em decisão</p><p className="mt-1 text-[10px] text-ink-muted">Não acompanhe por acompanhar.</p></div></div><div className="space-y-2">{[["tracker","Ajustar metas dos hábitos","Revise frequência e consistência"],["performance","Revisar execução dos treinos","Veja o que foi concluído"],["revisao","Fazer revisão semanal","Converta padrões em ajustes"]].map(([page,title,desc]) => <button key={page} onClick={() => navigateTo(page)} className="flex min-h-12 w-full items-center justify-between rounded-control border border-line bg-surface px-3 text-left"><span><span className="block text-[11px] font-semibold text-ink">{title}</span><span className="mt-0.5 block text-[9px] text-ink-muted">{desc}</span></span><ArrowRight size={14} className="text-accent" /></button>)}</div></Card></div>
        </section>
        <p className="text-center text-[9px] text-ink-faint">Janela analisada: {weekDates[0]} a {weekDates[6]}</p>
      </div>
    </motion.div>
  );
}
