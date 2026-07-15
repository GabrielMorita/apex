"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Inbox,
  Moon,
  Plus,
  RefreshCw,
  Target,
  Utensils,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import CheckinModal from "@/components/ui/CheckinModal";
import FocusTimerModal from "@/components/ui/FocusTimerModal";
import LucideIcon from "@/components/ui/LucideIcon";
import ReadingLogSheet from "@/components/reading/ReadingLogSheet";
import type { InboxItem } from "@/components/layout/QuickCapture";
import { Card } from "@/components/ui/primitives";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { navigateTo } from "@/lib/navigationEvents";
import {
  DOW_NAMES,
  FULL_DAY_NAMES,
  defaultHabits,
  defaultPlannedWorkouts,
  defaultPresets,
  defaultTemplates,
  getCurrentWeekDates,
  getMedalColor,
  type DayException,
  type DayPreset,
  type Habit,
  type HabitStatus,
  type PlannedWorkout,
  type WorkoutTemplate,
} from "@/data/mockData";
import {
  defaultDietPresets,
  defaultTasks,
  type CheckinEntry,
  type DietDayPreset,
  type Meal,
  type Task,
} from "@/data/extraData";
import {
  defaultReadingProjects,
  defaultReadingSessions,
  type ReadingProject,
  type ReadingSession,
} from "@/data/readingData";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function tasksForDate(tasks: Task[], date: string) {
  const dow = new Date(`${date}T12:00:00`).getDay();
  return tasks.filter((task) => {
    if (task.frequency.type === "once") return task.date === date;
    if (task.frequency.type === "daily") return true;
    if (task.frequency.type === "xPerWeek") return true;
    return task.frequency.days.includes(dow);
  });
}

function WeekStrip({
  days,
  selectedDate,
  onSelect,
}: {
  days: Array<{ shortDay: string; date: number; fullDate: string; habitsDone: number; habitsTotal: number }>;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="apex-kicker mb-1.5">Trajetória</p>
          <h2 className="text-[13px] font-semibold text-ink">Sua semana</h2>
        </div>
        <button
          onClick={() => onSelect(today)}
          className="flex min-h-9 items-center gap-2 rounded-control border border-line bg-surface px-3 text-[10px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <Clock3 size={13} /> Hoje
        </button>
      </div>

      <div className="no-scrollbar grid auto-cols-[84px] grid-flow-col gap-2 overflow-x-auto pb-1 sm:grid-flow-row sm:grid-cols-7">
        {days.map((day, index) => {
          const selected = selectedDate === day.fullDate;
          const future = day.fullDate > today;
          const percentage = day.habitsTotal ? Math.round((day.habitsDone / day.habitsTotal) * 100) : 0;
          return (
            <motion.button
              key={day.fullDate}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => onSelect(day.fullDate)}
              className="relative flex min-h-[78px] flex-col items-center justify-between rounded-card border px-2 py-2.5 text-center transition-colors"
              style={{
                background: selected ? "var(--accent-subtle)" : "var(--surface-base)",
                borderColor: selected ? "var(--border-accent)" : "var(--border-default)",
                boxShadow: selected ? "var(--shadow-accent)" : "none",
              }}
            >
              <div>
                <p className={`text-[8px] font-semibold uppercase tracking-[.16em] ${selected ? "text-accent" : "text-ink-muted"}`}>{day.shortDay}</p>
                <p className="mt-1 font-stat text-[17px] font-medium text-ink">{day.date}</p>
              </div>
              <div className="w-full">
                <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
                  {!future && percentage > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full rounded-full"
                      style={{ background: getMedalColor(percentage, false) }}
                    />
                  )}
                </div>
                <p className="mt-1 font-stat text-[7px] text-ink-faint">{future ? "—" : `${day.habitsDone}/${day.habitsTotal}`}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}

function HabitCard({
  habit,
  status,
  isNext,
  onToggle,
}: {
  habit: Habit;
  status: HabitStatus;
  isNext: boolean;
  onToggle: () => void;
}) {
  const done = status === "done";
  const skipped = status === "skipped";

  return (
    <motion.button
      whileTap={{ scale: 0.992 }}
      onClick={onToggle}
      className="group relative flex min-h-[70px] w-full items-center gap-3 overflow-hidden rounded-card border px-3.5 py-3 text-left transition-all hover:-translate-y-px sm:px-4"
      style={{
        background: `linear-gradient(90deg, ${habit.color}${done ? "24" : "15"}, rgba(0,0,0,0) 72%), var(--surface-base)`,
        borderColor: isNext ? "var(--border-accent)" : done ? `${habit.color}55` : "var(--border-default)",
        boxShadow: isNext ? "var(--shadow-accent)" : "none",
      }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
        style={{ background: `${habit.color}20`, borderColor: `${habit.color}45` }}
      >
        <LucideIcon name={habit.lucideIcon ?? "Circle"} size={20} color={habit.color} strokeWidth={2.15} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{habit.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-ink-muted">
          <span>{habit.duration ?? habit.category}</span>
          <span className="font-stat">• {habit.time}</span>
          <span className="flex items-center gap-1 font-stat"><Flame size={10} fill={habit.color} color={habit.color} /> {habit.streak} dias</span>
        </span>
      </span>

      {isNext && !done && (
        <span className="hidden shrink-0 rounded-full border border-line-accent bg-accent-subtle px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[.1em] text-accent sm:inline-flex">
          Próximo
        </span>
      )}

      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
        style={{
          background: done ? "var(--status-success)" : "transparent",
          borderColor: done ? "var(--status-success)" : isNext ? "var(--accent-primary)" : "var(--border-strong)",
          color: done ? "var(--text-inverse)" : "var(--text-faint)",
        }}
      >
        {done ? <Check size={13} strokeWidth={3} /> : skipped ? <span className="text-[11px]">—</span> : isNext ? <ChevronRight size={13} /> : null}
      </span>
    </motion.button>
  );
}

function NutritionCard({
  meals,
  doneMap,
  onRegister,
}: {
  meals: Meal[];
  doneMap: Record<string, boolean>;
  onRegister: (mealId: string) => void;
}) {
  const completed = meals.filter((meal) => doneMap[meal.id]).length;
  const next = meals.find((meal) => !doneMap[meal.id]);
  const adherence = meals.length ? Math.round((completed / meals.length) * 100) : 0;
  const totalKcal = meals.reduce((sum, meal) => sum + meal.items.reduce((itemsSum, item) => itemsSum + item.calories, 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.items.reduce((itemsSum, item) => itemsSum + item.protein, 0), 0);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Utensils size={18} /></span>
          <div><p className="apex-kicker mb-1.5">Dieta do dia</p><h2 className="apex-section-heading">Plano equilibrado</h2></div>
        </div>
        <button onClick={() => navigateTo("dieta")} className="flex min-h-9 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver plano <ChevronRight size={13} /></button>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-card border border-line bg-surface p-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink">{next?.name ?? "Plano concluído"}</p>
          <p className="mt-1 text-[10px] text-ink-muted">{next ? `Próxima refeição • ${next.time}` : `${completed}/${meals.length} refeições registradas`}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-ink-secondary">
            <span className="font-stat">{totalKcal} kcal</span>
            <span className="font-stat">Proteínas {totalProtein}g</span>
          </div>
        </div>
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(var(--status-success) ${adherence * 3.6}deg, var(--surface-base) 0deg)` }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-raised font-stat text-[12px] font-semibold text-ink">{adherence}%</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {meals.slice(0, 3).map((meal) => {
          const done = Boolean(doneMap[meal.id]);
          return (
            <button key={meal.id} onClick={() => onRegister(meal.id)} className="flex min-h-10 w-full items-center gap-3 rounded-control border border-line bg-surface px-3 text-left transition-colors hover:border-line-strong">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${done ? "border-[var(--status-success)] bg-[var(--status-success)] text-ink-inverse" : "border-line-strong text-transparent"}`}><Check size={11} /></span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-ink-secondary">{meal.name}</span>
              <span className="font-stat text-[8px] text-ink-muted">{meal.time}</span>
            </button>
          );
        })}
      </div>

      <button onClick={() => next && onRegister(next.id)} disabled={!next} className="apex-button-secondary mt-auto w-full disabled:opacity-40"><Check size={14} /> {next ? "Registrar refeição" : "Dia alimentar concluído"}</button>
    </Card>
  );
}

function BodyCard({
  workout,
  template,
  onToggle,
}: {
  workout?: PlannedWorkout;
  template?: WorkoutTemplate;
  onToggle: () => void;
}) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Dumbbell size={18} /></span>
          <div><p className="apex-kicker mb-1.5">Treino do dia</p><h2 className="apex-section-heading">{template ? template.name : "Recuperação"}</h2></div>
        </div>
        <button onClick={() => navigateTo("treinos:semana")} className="flex min-h-9 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver treino <ChevronRight size={13} /></button>
      </div>

      {workout && template ? (
        <>
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[.1em] ${workout.done ? "bg-[rgba(143,175,120,.16)] text-[var(--status-success)]" : "bg-accent-subtle text-accent"}`}>{workout.done ? "Concluído" : "Pronto para treinar"}</span>
              <span className="font-stat text-[9px] text-ink-muted">{workout.time}</span>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-ink-muted">{template.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-ink-secondary">
              <span className="font-stat">{template.exercises.length} exercícios</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {template.exercises.slice(0, 3).map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2.5 text-[10px] text-ink-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="truncate">{exercise.name}</span>
              </div>
            ))}
          </div>

          <button onClick={onToggle} className={workout.done ? "apex-button-secondary mt-auto w-full" : "apex-button-secondary mt-auto w-full"}><Check size={14} /> {workout.done ? "Marcar como pendente" : "Concluir treino"}</button>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-card border border-dashed border-line p-8 text-center">
          <Moon size={24} className="mb-3 text-accent" />
          <p className="text-[13px] font-semibold text-ink">Dia de recuperação</p>
          <p className="mt-1 text-[10px] text-ink-muted">Sem treino programado para este dia.</p>
        </div>
      )}
    </Card>
  );
}

function RemindersCard({
  tasks,
  inbox,
  onToggleTask,
  onArchive,
}: {
  tasks: Task[];
  inbox: InboxItem[];
  onToggleTask: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const visibleInbox = inbox.filter((item) => !item.archived).slice(0, 1);
  const items = [
    ...tasks.slice(0, 3).map((task) => ({ id: task.id, type: "task" as const, title: task.name, time: task.time ?? "Livre", done: task.status === "done" })),
    ...visibleInbox.map((item) => ({ id: item.id, type: "inbox" as const, title: item.content, time: "Ideia", done: false })),
  ].slice(0, 3);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Bell size={18} /></span>
          <div><p className="apex-kicker mb-1.5">Lembretes</p><h2 className="apex-section-heading">Pendências do dia</h2></div>
        </div>
        <button onClick={() => navigateTo("planejamento")} className="flex min-h-9 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver todos <ChevronRight size={13} /></button>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => item.type === "task" ? onToggleTask(item.id) : onArchive(item.id)}
            className="flex min-h-[58px] w-full items-center gap-3 rounded-control border border-line bg-surface px-3 text-left"
          >
            <span className="w-10 shrink-0 font-stat text-[9px] text-accent">{item.time}</span>
            <span className={`min-w-0 flex-1 text-[10px] leading-snug ${item.done ? "text-ink-faint line-through" : "text-ink-secondary"}`}>{item.title}</span>
            <span className={`flex h-5 w-5 items-center justify-center rounded border ${item.done ? "border-[var(--status-success)] bg-[var(--status-success)] text-ink-inverse" : "border-line-strong text-transparent"}`}><Check size={11} /></span>
          </button>
        ))}
        {!items.length && (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center rounded-card border border-dashed border-line px-4">
            <Inbox size={22} className="mb-3 text-ink-faint" />
            <p className="text-[11px] font-semibold text-ink-secondary">Nada pendente</p>
            <p className="mt-1 text-[9px] text-ink-muted">Use Capturar para registrar algo.</p>
          </div>
        )}
      </div>

      <button onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Captura rápida"]')?.click()} className="apex-button-secondary mt-auto w-full"><Plus size={14} /> Novo lembrete</button>
    </Card>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [habits] = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [presets] = useLocalStorage<DayPreset[]>("apex-day-presets", defaultPresets);
  const [exceptions] = useLocalStorage<DayException[]>("apex-day-exceptions", []);
  const [histories, setHistories] = useLocalStorage<Record<string, Record<string, HabitStatus>>>("apex-habit-histories", {});
  const [statuses, setStatuses] = useLocalStorage<Record<string, HabitStatus>>("apex-today-statuses", {});
  const [tasks, setTasks] = useLocalStorage<Task[]>("apex-tasks", defaultTasks);
  const [checkins, setCheckins] = useLocalStorage<CheckinEntry[]>("apex-checkins", []);
  const [planned, setPlanned] = useLocalStorage<PlannedWorkout[]>("apex-planned-workouts", defaultPlannedWorkouts);
  const [templates] = useLocalStorage<WorkoutTemplate[]>("apex-templates", defaultTemplates);
  const [dietPresets] = useLocalStorage<DietDayPreset[]>("apex-diet-presets", defaultDietPresets);
  const [dietExceptions] = useLocalStorage<Record<string, Meal[]>>("apex-diet-exceptions", {});
  const [dietDone, setDietDone] = useLocalStorage<Record<string, boolean>>("apex-diet-done", {});
  const [inbox, setInbox] = useLocalStorage<InboxItem[]>("apex-inbox", []);
  const [books, setBooks] = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [readingSessions, setReadingSessions] = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [focusHabitId, setFocusHabitId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const date = new Date();
      setNowMinutes(date.getHours() * 60 + date.getMinutes());
    };
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  function habitsForDate(date: string) {
    const dow = new Date(`${date}T12:00:00`).getDay();
    const ids = exceptions.find((item) => item.date === date)?.habitIds ?? presets.find((item) => item.dow === dow)?.habitIds ?? [];
    return habits.filter((habit) => ids.includes(habit.id)).sort((a, b) => a.time.localeCompare(b.time));
  }

  function statusForHabit(habit: Habit, date: string) {
    return date === today ? statuses[habit.id] ?? habit.status : histories[habit.id]?.[date] ?? "pending";
  }

  const selectedHabits = habitsForDate(selectedDate).map((habit) => ({ ...habit, status: statusForHabit(habit, selectedDate) }));
  const activeBooks = books.filter((book) => book.status === "active");
  const selectedDow = new Date(`${selectedDate}T12:00:00`).getDay();
  const selectedTasks = tasksForDate(tasks, selectedDate);
  const selectedWorkout = planned.find((workout) => workout.day === FULL_DAY_NAMES[selectedDow]);
  const selectedTemplate = selectedWorkout ? templates.find((template) => template.id === selectedWorkout.templateId) : undefined;
  const selectedMeals = dietExceptions[selectedDate] ?? dietPresets.find((preset) => preset.dow === selectedDow)?.meals ?? [];

  const nextHabitId = useMemo(() => {
    const pending = selectedHabits.filter((habit) => habit.status !== "done");
    if (!pending.length) return null;
    if (selectedDate !== today) return pending[0].id;
    return pending.find((habit) => toMinutes(habit.time) >= nowMinutes)?.id ?? pending[0].id;
  }, [selectedHabits, selectedDate, today, nowMinutes]);

  const habitGroups = [
    { label: "Manhã", habits: selectedHabits.filter((habit) => toMinutes(habit.time) < 12 * 60) },
    { label: "Tarde", habits: selectedHabits.filter((habit) => toMinutes(habit.time) >= 12 * 60 && toMinutes(habit.time) < 18 * 60) },
    { label: "Noite", habits: selectedHabits.filter((habit) => toMinutes(habit.time) >= 18 * 60) },
  ].filter((group) => group.habits.length);

  const habitsDone = selectedHabits.filter((habit) => habit.status === "done").length;
  const habitsProgress = selectedHabits.length ? Math.round((habitsDone / selectedHabits.length) * 100) : 0;

  function commitHabitStatus(id: string, date: string, status: HabitStatus) {
    if (date === today) setStatuses((previous) => ({ ...previous, [id]: status }));
    setHistories((previous) => ({ ...previous, [id]: { ...(previous[id] ?? {}), [date]: status } }));
  }

  function toggleHabit(habit: Habit) {
    const current = statusForHabit(habit, selectedDate);
    const next: HabitStatus = current === "pending" ? "done" : current === "done" ? "skipped" : "pending";

    if (selectedDate === today && habit.category === "foco" && next === "done") {
      setFocusHabitId(habit.id);
      return;
    }
    if (selectedDate === today && habit.opensReadingLog && next === "done" && activeBooks.length) {
      setShowReading(true);
      return;
    }
    commitHabitStatus(habit.id, selectedDate, next);
  }

  function logReading(bookId: string, toPage: number) {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;
    const pagesRead = Math.max(0, toPage - book.currentPage);
    setReadingSessions((previous) => [...previous, { id: `rs${Date.now()}`, bookId, date: today, fromPage: book.currentPage, toPage, pagesRead, createdAt: new Date().toISOString() }]);
    setBooks((previous) => previous.map((candidate) => candidate.id === bookId ? { ...candidate, currentPage: Math.min(toPage, candidate.totalPages), status: toPage >= candidate.totalPages ? "completed" : candidate.status, updatedAt: new Date().toISOString() } : candidate));
    const readingHabit = habits.find((habit) => habit.opensReadingLog);
    if (readingHabit && pagesRead > 0) commitHabitStatus(readingHabit.id, today, "done");
  }

  const weekDays = getCurrentWeekDates().map((date) => {
    const dateObject = new Date(`${date}T12:00:00`);
    const dayHabits = habitsForDate(date);
    const completed = dayHabits.filter((habit) => statusForHabit(habit, date) === "done").length;
    return { shortDay: DOW_NAMES[dateObject.getDay()], date: dateObject.getDate(), fullDate: date, habitsDone: completed, habitsTotal: dayHabits.length };
  });

  const selectedLabel = selectedDate === today ? "Hoje" : new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${selectedDate}T12:00:00`));
  const selectedCheckin = checkins.find((entry) => entry.date === selectedDate);

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Hoje" subtitle="Seu dia em uma visão: consistência, corpo e prioridades" />
      <div className="apex-page space-y-7 sm:space-y-8">
        <WeekStrip days={weekDays} selectedDate={selectedDate} onSelect={setSelectedDate} />

        <Card emphasis className="overflow-hidden p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Target size={18} fill="currentColor" /></span>
              <div>
                <p className="apex-kicker mb-1.5">Consistência</p>
                <h2 className="text-[17px] font-semibold text-ink">Hábitos de {selectedLabel.toLowerCase()}</h2>
              </div>
            </div>
            <button onClick={() => navigateTo("planejamento:habitos")} className="apex-button-secondary h-10 min-h-10 px-3 text-[10px]">Gerenciar hábitos <ChevronRight size={13} /></button>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <p className="text-[11px] font-medium text-ink-secondary"><span className="font-stat text-ink">{habitsDone}</span> de <span className="font-stat text-ink">{selectedHabits.length}</span> concluídos</p>
            <div className="h-2 overflow-hidden rounded-full bg-surface"><motion.div initial={{ width: 0 }} animate={{ width: `${habitsProgress}%` }} className="h-full rounded-full bg-accent" /></div>
            <p className="font-stat text-[11px] font-semibold text-accent">{habitsProgress}%</p>
          </div>

          {habitGroups.length ? (
            <div className="space-y-6">
              {habitGroups.map((group) => (
                <div key={group.label}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <p className="apex-kicker">{group.label}</p>
                  </div>
                  <div className="space-y-2.5">
                    {group.habits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} status={habit.status} isNext={habit.id === nextHabitId} onToggle={() => toggleHabit(habit)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-line p-10 text-center">
              <BookOpen size={22} className="mx-auto mb-3 text-ink-faint" />
              <p className="text-[12px] font-semibold text-ink-secondary">Nenhum hábito planejado</p>
            </div>
          )}
        </Card>

        <section aria-label="Apoio do dia" className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
          <RemindersCard
            tasks={selectedTasks}
            inbox={inbox}
            onToggleTask={(id) => setTasks((previous) => previous.map((task) => task.id === id ? { ...task, status: task.status === "done" ? "pending" : "done" } : task))}
            onArchive={(id) => setInbox((previous) => previous.map((item) => item.id === id ? { ...item, archived: true } : item))}
          />
          <BodyCard workout={selectedWorkout} template={selectedTemplate} onToggle={() => selectedWorkout && setPlanned((previous) => previous.map((workout) => workout.id === selectedWorkout.id ? { ...workout, done: !workout.done } : workout))} />
          <NutritionCard meals={selectedMeals} doneMap={dietDone} onRegister={(mealId) => setDietDone((previous) => ({ ...previous, [mealId]: !previous[mealId] }))} />
        </section>

        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))_44px] lg:items-center">
            <div className="px-1">
              <div className="flex items-center gap-2"><RefreshCw size={15} className="text-accent" /><h2 className="text-[13px] font-semibold text-ink">Feche o ciclo do dia</h2></div>
              <p className="mt-1.5 text-[9px] leading-relaxed text-ink-muted">Registre seu estado, preserve aprendizados e prepare amanhã.</p>
            </div>
            <button onClick={() => setShowCheckin(true)} className="flex min-h-[52px] items-center gap-3 rounded-control border border-line bg-surface px-3 text-left">
              <Target size={15} className={selectedCheckin ? "text-[var(--status-success)]" : "text-accent"} />
              <span><span className="block text-[10px] font-semibold text-ink">Check-in</span><span className="mt-1 block text-[8px] text-ink-muted">{selectedCheckin ? "registrado" : "energia e recuperação"}</span></span>
            </button>
            <button onClick={() => navigateTo("progresso:revisao")} className="flex min-h-[52px] items-center gap-3 rounded-control border border-line bg-surface px-3 text-left">
              <RefreshCw size={15} className="text-accent" />
              <span><span className="block text-[10px] font-semibold text-ink">Revisar</span><span className="mt-1 block text-[8px] text-ink-muted">transforme sinais em ajustes</span></span>
            </button>
            <button onClick={() => navigateTo("planejamento")} className="flex min-h-[52px] items-center gap-3 rounded-control border border-line bg-surface px-3 text-left">
              <Target size={15} className="text-accent" />
              <span><span className="block text-[10px] font-semibold text-ink">Amanhã</span><span className="mt-1 block text-[8px] text-ink-muted">ajuste prioridades</span></span>
            </button>
            <span className="hidden h-11 w-11 items-center justify-center rounded-control border border-line bg-surface text-ink-muted lg:flex"><Clock3 size={17} /></span>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showCheckin && <CheckinModal onComplete={(entry) => { setCheckins((previous) => [...previous.filter((item) => item.date !== entry.date), entry]); setShowCheckin(false); }} onSkip={() => setShowCheckin(false)} />}
        {showReading && activeBooks.length > 0 && <ReadingLogSheet activeBooks={activeBooks} sessions={readingSessions} onLog={logReading} onClose={() => setShowReading(false)} />}
        {focusHabitId && (() => { const habit = habits.find((candidate) => candidate.id === focusHabitId); return habit ? <FocusTimerModal task={habit.name} duration={habit.duration} onComplete={() => { commitHabitStatus(habit.id, today, "done"); setFocusHabitId(null); }} onClose={() => setFocusHabitId(null)} /> : null; })()}
      </AnimatePresence>
    </motion.div>
  );
}
