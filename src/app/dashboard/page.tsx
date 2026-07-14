"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, ChevronRight, Circle, Clock3, Dumbbell, Inbox, Moon, PenLine, Play, Sparkles, Star, Target, Utensils, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import HabitCircle from "@/components/ui/HabitCircle";
import WeeklyCalendar from "@/components/ui/WeeklyCalendar";
import CheckinModal from "@/components/ui/CheckinModal";
import LucideIcon from "@/components/ui/LucideIcon";
import ReadingLogSheet from "@/components/reading/ReadingLogSheet";
import type { InboxItem } from "@/components/layout/QuickCapture";
import { Card, IconTile, SectionHeader } from "@/components/ui/primitives";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { navigateTo } from "@/lib/navigationEvents";
import {
  DOW_NAMES, FULL_DAY_NAMES, defaultHabits, defaultPlannedWorkouts, defaultPresets,
  defaultTemplates, getCurrentWeekDates, getTodayHabits,
  type DayException, type DayPreset, type Habit, type HabitStatus,
  type PlannedWorkout, type WorkoutTemplate,
} from "@/data/mockData";
import {
  defaultDietPresets, defaultTasks, isTaskScheduledToday,
  type CheckinEntry, type DietDayPreset, type FocusItem, type Meal, type Task,
} from "@/data/extraData";
import {
  defaultReadingProjects, defaultReadingSessions,
  type ReadingProject, type ReadingSession,
} from "@/data/readingData";

type ExecutionItem = {
  id: string;
  kind: "habit" | "task";
  name: string;
  time: string;
  status: HabitStatus | Task["status"];
  color: string;
  icon: string;
  meta: string;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function FocusModal({ habits, tasks, value, onSave, onClose }: {
  habits: Habit[];
  tasks: Task[];
  value: FocusItem[];
  onSave: (items: FocusItem[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<FocusItem[]>(value);
  const items = [
    ...habits.map((habit) => ({ type: "habit" as const, refId: habit.id, name: habit.name, icon: habit.lucideIcon ?? "Circle", color: habit.color })),
    ...tasks.map((task) => ({ type: "task" as const, refId: task.id, name: task.name, icon: "CheckSquare", color: "var(--accent-primary)" })),
  ];

  function toggle(type: "habit" | "task", refId: string) {
    const exists = selected.some((item) => item.type === type && item.refId === refId);
    if (exists) {
      setSelected((previous) => previous.filter((item) => !(item.type === type && item.refId === refId)).map((item, index) => ({ ...item, priority: index === 0 ? "primary" : "secondary" })));
      return;
    }
    if (selected.length >= 3) return;
    setSelected((previous) => [...previous, { type, refId, priority: previous.length === 0 ? "primary" : "secondary" }]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-line bg-surface-overlay p-5 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-float sm:rounded-panel sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="apex-kicker mb-2">Direção do dia</p><h2 className="text-[18px] font-bold tracking-[-.03em] text-ink">Escolha até três prioridades</h2><p className="mt-1 text-[10px] text-ink-muted">A primeira será tratada como missão principal.</p></div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted"><X size={16} /></button>
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const index = selected.findIndex((selectedItem) => selectedItem.type === item.type && selectedItem.refId === item.refId);
            const active = index >= 0;
            return (
              <button key={`${item.type}-${item.refId}`} onClick={() => toggle(item.type, item.refId)} className="flex min-h-12 w-full items-center gap-3 rounded-control border px-3 text-left disabled:opacity-40" disabled={!active && selected.length >= 3} style={{ background: active ? `${item.color}12` : "var(--surface-base)", borderColor: active ? `${item.color}55` : "var(--border-default)" }}>
                <LucideIcon name={item.icon} size={15} color={active ? item.color : "var(--text-muted)"} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink-secondary">{item.name}</span>
                {active && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent font-stat text-[9px] font-bold text-ink-inverse">{index + 1}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => { onSave(selected.map((item, index) => ({ ...item, priority: index === 0 ? "primary" : "secondary" }))); onClose(); }} className="apex-button-primary mt-5 w-full">Salvar foco</button>
      </motion.section>
    </div>
  );
}

function ExecutionHero({ item, label, mission, progress, onComplete, onFocus }: {
  item?: ExecutionItem;
  label: string;
  mission?: { name: string; done: boolean } | null;
  progress: number;
  onComplete: () => void;
  onFocus: () => void;
}) {
  return (
    <Card emphasis className="overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-60" style={{ background: "radial-gradient(circle at 75% 28%, rgba(217,173,84,.16), transparent 54%)" }} />
      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="apex-kicker mb-2 text-accent">{label}</p><h2 className="text-[22px] font-bold tracking-[-.04em] text-ink sm:text-[27px]">{item?.name ?? "Dia executado"}</h2><p className="mt-2 text-[11px] text-ink-muted">{item ? `${item.time} · ${item.meta}` : "Tudo que estava previsto foi concluído."}</p></div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-line-accent bg-accent-subtle text-accent">{item ? <LucideIcon name={item.icon} size={20} color="currentColor" /> : <Sparkles size={20} />}</span>
        </div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-accent" /></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {item ? <button onClick={onComplete} className="apex-button-primary flex-1"><Play size={15} fill="currentColor" /> Concluir bloco</button> : <button onClick={() => navigateTo("diario")} className="apex-button-primary flex-1"><PenLine size={15} /> Registrar aprendizado</button>}
          <button onClick={onFocus} className="apex-button-secondary flex-1"><Target size={15} /> {mission ? "Editar missão" : "Definir missão"}</button>
        </div>
        {mission && <div className="mt-4 flex items-center gap-2 rounded-control border border-line bg-surface-glass px-3 py-2.5"><Star size={12} fill="var(--accent-primary)" className="text-accent" /><span className={`min-w-0 flex-1 truncate text-[10px] font-semibold ${mission.done ? "text-accent line-through" : "text-ink-secondary"}`}>{mission.name}</span><span className="font-stat text-[8px] uppercase tracking-[.12em] text-ink-faint">missão</span></div>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(0);
  const [habits] = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [presets] = useLocalStorage<DayPreset[]>("apex-day-presets", defaultPresets);
  const [exceptions] = useLocalStorage<DayException[]>("apex-day-exceptions", []);
  const [histories, setHistories] = useLocalStorage<Record<string, Record<string, HabitStatus>>>("apex-habit-histories", {});
  const [statuses, setStatuses] = useLocalStorage<Record<string, HabitStatus>>("apex-today-statuses", {});
  const [tasks, setTasks] = useLocalStorage<Task[]>("apex-tasks", defaultTasks);
  const [checkins, setCheckins] = useLocalStorage<CheckinEntry[]>("apex-checkins", []);
  const [focus, setFocus] = useLocalStorage<FocusItem[]>("apex-focus", []);
  const [planned, setPlanned] = useLocalStorage<PlannedWorkout[]>("apex-planned-workouts", defaultPlannedWorkouts);
  const [templates] = useLocalStorage<WorkoutTemplate[]>("apex-templates", defaultTemplates);
  const [dietPresets] = useLocalStorage<DietDayPreset[]>("apex-diet-presets", defaultDietPresets);
  const [dietExceptions] = useLocalStorage<Record<string, Meal[]>>("apex-diet-exceptions", {});
  const [dietDone, setDietDone] = useLocalStorage<Record<string, boolean>>("apex-diet-done", {});
  const [inbox, setInbox] = useLocalStorage<InboxItem[]>("apex-inbox", []);
  const [books, setBooks] = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [readingSessions, setReadingSessions] = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const dow = new Date().getDay();

  useEffect(() => {
    setMounted(true);
    const update = () => { const date = new Date(); setNowMinutes(date.getHours() * 60 + date.getMinutes()); };
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const todayHabits = mounted ? getTodayHabits(habits, presets, exceptions) : [];
  const habitsWithStatus = todayHabits.map((habit) => ({ ...habit, status: statuses[habit.id] ?? habit.status }));
  const todayTasks = tasks.filter(isTaskScheduledToday);
  const timeline = useMemo<ExecutionItem[]>(() => [
    ...habitsWithStatus.map((habit) => ({ id: habit.id, kind: "habit" as const, name: habit.name, time: habit.time, status: habit.status, color: habit.color, icon: habit.lucideIcon ?? "Circle", meta: `${habit.category}${habit.duration ? ` · ${habit.duration}` : ""}` })),
    ...todayTasks.filter((task) => task.time).map((task) => ({ id: task.id, kind: "task" as const, name: task.name, time: task.time!, status: task.status, color: "var(--accent-primary)", icon: "CheckSquare", meta: "tarefa" })),
  ].sort((a, b) => a.time.localeCompare(b.time)), [habitsWithStatus, todayTasks]);

  const pending = timeline.filter((item) => item.status !== "done");
  const looseItems: ExecutionItem[] = todayTasks
    .filter((task) => !task.time && task.status !== "done")
    .map((task) => ({ id: task.id, kind: "task", name: task.name, time: "Livre", status: task.status, color: "var(--accent-primary)", icon: "CheckSquare", meta: "tarefa sem horário" }));
  const pastPending = pending.filter((item) => toMinutes(item.time) <= nowMinutes);
  const current = pastPending[pastPending.length - 1] ?? pending.find((item) => toMinutes(item.time) > nowMinutes) ?? looseItems[0];
  const nextItems = [...pending, ...looseItems].filter((item) => !(item.kind === current?.kind && item.id === current?.id)).slice(0, 3);
  const doneCount = habitsWithStatus.filter((habit) => habit.status === "done").length + todayTasks.filter((task) => task.status === "done").length;
  const totalActions = habitsWithStatus.length + todayTasks.length;
  const dayProgress = Math.round((doneCount / Math.max(totalActions, 1)) * 100);
  const activeBooks = books.filter((book) => book.status === "active");

  function focusDisplay(item?: FocusItem) {
    if (!item) return null;
    if (item.type === "habit") {
      const habit = habits.find((candidate) => candidate.id === item.refId);
      return habit ? { name: habit.name, done: (statuses[habit.id] ?? habit.status) === "done" } : null;
    }
    const task = tasks.find((candidate) => candidate.id === item.refId);
    return task ? { name: task.name, done: task.status === "done" } : null;
  }

  function setHabitStatus(id: string, status: HabitStatus) {
    const habit = habits.find((candidate) => candidate.id === id);
    if (habit?.opensReadingLog && status === "done" && activeBooks.length) { setShowReading(true); return; }
    setStatuses((previous) => ({ ...previous, [id]: status }));
    setHistories((previous) => ({ ...previous, [id]: { ...(previous[id] ?? {}), [today]: status } }));
  }

  function toggleItem(item: ExecutionItem) {
    if (item.kind === "habit") setHabitStatus(item.id, item.status === "done" ? "pending" : "done");
    else setTasks((previous) => previous.map((task) => task.id === item.id ? { ...task, status: task.status === "done" ? "pending" : "done" } : task));
  }

  function logReading(bookId: string, toPage: number) {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;
    const pagesRead = Math.max(0, toPage - book.currentPage);
    setReadingSessions((previous) => [...previous, { id: `rs${Date.now()}`, bookId, date: today, fromPage: book.currentPage, toPage, pagesRead, createdAt: new Date().toISOString() }]);
    setBooks((previous) => previous.map((candidate) => candidate.id === bookId ? { ...candidate, currentPage: Math.min(toPage, candidate.totalPages), status: toPage >= candidate.totalPages ? "completed" : candidate.status, updatedAt: new Date().toISOString() } : candidate));
    const readingHabit = habits.find((habit) => habit.opensReadingLog);
    if (readingHabit && pagesRead > 0) {
      setStatuses((previous) => ({ ...previous, [readingHabit.id]: "done" }));
      setHistories((previous) => ({ ...previous, [readingHabit.id]: { ...(previous[readingHabit.id] ?? {}), [today]: "done" } }));
    }
  }

  const todayWorkout = planned.find((workout) => workout.day === FULL_DAY_NAMES[dow]);
  const workoutTemplate = todayWorkout ? templates.find((template) => template.id === todayWorkout.templateId) : undefined;
  const todayMeals = dietExceptions[today] ?? dietPresets.find((preset) => preset.dow === dow)?.meals ?? [];
  const mealsDone = todayMeals.filter((meal) => dietDone[meal.id]).length;
  const nextMeal = todayMeals.find((meal) => !dietDone[meal.id]);
  const currentHour = Math.floor(nowMinutes / 60);
  const todayCheckin = checkins.find((entry) => entry.date === today);

  const weekDates = getCurrentWeekDates();
  const weekDays = weekDates.map((date) => {
    const dateObject = new Date(`${date}T12:00:00`);
    const dayDow = dateObject.getDay();
    const ids = exceptions.find((item) => item.date === date)?.habitIds ?? presets.find((item) => item.dow === dayDow)?.habitIds ?? [];
    const dayHabits = habits.filter((habit) => ids.includes(habit.id));
    const completed = dayHabits.filter((habit) => (date === today ? statuses[habit.id] : histories[habit.id]?.[date]) === "done").length;
    return { shortDay: DOW_NAMES[dayDow], date: dateObject.getDate(), isToday: date === today, fullDate: date, habitsDone: completed, habitsTotal: dayHabits.length };
  });

  function habitsForDay(date: string) {
    const dayDow = new Date(`${date}T12:00:00`).getDay();
    const ids = exceptions.find((item) => item.date === date)?.habitIds ?? presets.find((item) => item.dow === dayDow)?.habitIds ?? [];
    return habits.filter((habit) => ids.includes(habit.id)).sort((a, b) => a.time.localeCompare(b.time));
  }

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Hoje" subtitle={`Sua central de execução · ${currentHour < 12 ? "manhã" : currentHour < 18 ? "tarde" : "noite"}`} />
      <div className="apex-page space-y-7 sm:space-y-9">
        <section className="grid gap-4 xl:grid-cols-[1.18fr_.82fr]">
          <ExecutionHero item={current} label={current?.time === "Livre" ? "Próxima ação" : current && toMinutes(current.time) <= nowMinutes ? "Agora" : "Próximo bloco"} mission={focusDisplay(focus.find((item) => item.priority === "primary"))} progress={dayProgress} onComplete={() => current && toggleItem(current)} onFocus={() => setShowFocus(true)} />
          <Card className="p-4 sm:p-5">
            <SectionHeader eyebrow="Sequência" title="Próximos passos" action={<span className="font-stat text-[10px] text-ink-muted">{dayProgress}% do dia</span>} />
            <div className="space-y-2">
              {nextItems.length ? nextItems.map((item, index) => <button key={`${item.kind}-${item.id}`} onClick={() => toggleItem(item)} className="flex min-h-14 w-full items-center gap-3 rounded-control border border-line bg-surface px-3 text-left transition-colors hover:border-line-strong"><span className="font-stat text-[9px] text-ink-faint">0{index + 1}</span><span className="flex h-9 w-9 items-center justify-center rounded-control border" style={{ background: `${item.color}12`, borderColor: `${item.color}2f` }}><LucideIcon name={item.icon} size={15} color={item.color} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-ink">{item.name}</span><span className="mt-1 block font-stat text-[9px] text-ink-muted">{item.time} · {item.meta}</span></span><Circle size={16} className="text-ink-faint" /></button>) : <div className="flex min-h-[150px] flex-col items-center justify-center text-center"><Sparkles size={22} className="mb-3 text-accent" /><p className="text-[12px] font-semibold text-ink">Agenda concluída</p><p className="mt-1 text-[10px] text-ink-muted">Use o tempo restante com intenção.</p></div>}
            </div>
          </Card>
        </section>

        <section>
          <SectionHeader eyebrow="Consistência" title="Hábitos de hoje" action={<button onClick={() => navigateTo("progresso")} className="flex min-h-10 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver progresso <ArrowRight size={13} /></button>} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{habitsWithStatus.map((habit) => <HabitCircle key={habit.id} habit={habit} onToggle={setHabitStatus} />)}</div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between"><div><p className="apex-kicker mb-2">Corpo</p><h2 className="apex-section-heading">Treino de hoje</h2></div><IconTile Icon={Dumbbell} active={Boolean(todayWorkout?.done)} /></div>
            {todayWorkout && workoutTemplate ? <><div className="rounded-control border border-line bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold text-ink">{workoutTemplate.name}</p><p className="mt-1 text-[10px] leading-relaxed text-ink-muted">{workoutTemplate.description}</p></div><span className="font-stat text-[10px] text-accent">{todayWorkout.time}</span></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setPlanned((previous) => previous.map((workout) => workout.id === todayWorkout.id ? { ...workout, done: !workout.done } : workout))} className={todayWorkout.done ? "apex-button-secondary" : "apex-button-primary"}>{todayWorkout.done ? <><Check size={14} /> Concluído</> : <><Check size={14} /> Marcar concluído</>}</button><button onClick={() => navigateTo("treinos")} className="apex-button-secondary">Abrir treino <ChevronRight size={14} /></button></div></> : <div className="flex min-h-[122px] flex-col items-center justify-center rounded-control border border-dashed border-line text-center"><Moon size={20} className="mb-2 text-ink-muted" /><p className="text-[11px] font-semibold text-ink-secondary">Dia de recuperação</p></div>}
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between"><div><p className="apex-kicker mb-2">Combustível</p><h2 className="apex-section-heading">Alimentação do dia</h2></div><IconTile Icon={Utensils} active={mealsDone === todayMeals.length && todayMeals.length > 0} /></div>
            <div className="mb-3 flex items-end justify-between"><div><p className="font-stat text-[27px] font-medium text-ink">{mealsDone}/{todayMeals.length}</p><p className="mt-1 text-[9px] text-ink-muted">refeições registradas</p></div>{nextMeal && <div className="text-right"><p className="apex-kicker mb-1">Próxima</p><p className="text-[11px] font-semibold text-ink-secondary">{nextMeal.name} · {nextMeal.time}</p></div>}</div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface"><motion.div initial={{ width: 0 }} animate={{ width: `${todayMeals.length ? (mealsDone / todayMeals.length) * 100 : 0}%` }} className="h-full rounded-full bg-accent" /></div>
            <div className="grid grid-cols-2 gap-2"><button onClick={() => nextMeal && setDietDone((previous) => ({ ...previous, [nextMeal.id]: true }))} disabled={!nextMeal} className="apex-button-primary disabled:opacity-40"><Check size={14} /> {nextMeal ? "Registrar refeição" : "Dia concluído"}</button><button onClick={() => navigateTo("dieta")} className="apex-button-secondary">Abrir dieta <ChevronRight size={14} /></button></div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
          <Card className="p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between"><div><p className="apex-kicker mb-2">Captura</p><h2 className="apex-section-heading">Caixa de entrada</h2></div><span className="font-stat text-[10px] text-ink-muted">{inbox.filter((item) => !item.archived).length}</span></div>
            <div className="space-y-2">{inbox.filter((item) => !item.archived).slice(0, 3).map((item) => <div key={item.id} className="flex min-h-12 items-center gap-3 rounded-control border border-line bg-surface px-3"><Inbox size={14} className="shrink-0 text-accent" /><p className="line-clamp-2 flex-1 text-[10px] leading-relaxed text-ink-secondary">{item.content}</p><button onClick={() => setInbox((previous) => previous.map((candidate) => candidate.id === item.id ? { ...candidate, archived: true } : candidate))} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted"><Check size={13} /></button></div>)}{!inbox.some((item) => !item.archived) && <div className="flex min-h-[118px] flex-col items-center justify-center text-center"><Inbox size={20} className="mb-2 text-ink-faint" /><p className="text-[11px] font-semibold text-ink-secondary">Mente limpa</p><p className="mt-1 text-[9px] text-ink-muted">Use o botão + para capturar ideias.</p></div>}</div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between"><div><p className="apex-kicker mb-2">Encerramento</p><h2 className="apex-section-heading">Feche o ciclo do dia</h2></div><IconTile Icon={currentHour >= 18 ? Moon : Clock3} active={currentHour >= 18} /></div>
            <p className="mb-4 text-[10px] leading-relaxed text-ink-muted">Execução sem reflexão vira repetição. Registre seu estado, preserve aprendizados e prepare amanhã.</p>
            <div className="grid gap-2 sm:grid-cols-3"><button onClick={() => setShowCheckin(true)} className="flex min-h-14 items-center gap-3 rounded-control border border-line bg-surface px-3 text-left"><Target size={15} className={todayCheckin ? "text-accent" : "text-ink-muted"} /><span><span className="block text-[10px] font-semibold text-ink">Check-in</span><span className="mt-1 block text-[8px] text-ink-muted">{todayCheckin ? "registrado hoje" : "energia e recuperação"}</span></span></button><button onClick={() => navigateTo("diario")} className="flex min-h-14 items-center gap-3 rounded-control border border-line bg-surface px-3 text-left"><BookOpen size={15} className="text-accent" /><span><span className="block text-[10px] font-semibold text-ink">Diário</span><span className="mt-1 block text-[8px] text-ink-muted">registre o aprendizado</span></span></button><button onClick={() => navigateTo("planejamento")} className="flex min-h-14 items-center gap-3 rounded-control border border-line bg-surface px-3 text-left"><Target size={15} className="text-accent" /><span><span className="block text-[10px] font-semibold text-ink">Amanhã</span><span className="mt-1 block text-[8px] text-ink-muted">ajuste prioridades</span></span></button></div>
          </Card>
        </section>

        <section><SectionHeader eyebrow="Trajetória" title="Sua semana" /><WeeklyCalendar days={weekDays} selectedDate={selectedDate} onDayClick={(date) => setSelectedDate((previous) => previous === date ? null : date)} habitsForDay={habitsForDay} historyForHabit={(habitId, date) => date === today ? statuses[habitId] ?? "pending" : histories[habitId]?.[date] ?? "pending"} /></section>
      </div>

      <AnimatePresence>
        {showFocus && <FocusModal habits={todayHabits} tasks={todayTasks} value={focus} onSave={setFocus} onClose={() => setShowFocus(false)} />}
        {showCheckin && <CheckinModal onComplete={(entry) => { setCheckins((previous) => [...previous.filter((item) => item.date !== entry.date), entry]); setShowCheckin(false); }} onSkip={() => setShowCheckin(false)} />}
        {showReading && activeBooks.length > 0 && <ReadingLogSheet activeBooks={activeBooks} sessions={readingSessions} onLog={logReading} onClose={() => setShowReading(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
