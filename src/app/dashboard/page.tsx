"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Inbox,
  Plus,
  RefreshCw,
  Target,
  Utensils,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import CheckinModal from "@/components/ui/CheckinModal";
import FocusTimerModal from "@/components/ui/FocusTimerModal";
import LucideIcon from "@/components/ui/LucideIcon";
import ReadingLogSheet from "@/components/reading/ReadingLogSheet";
import TodayTrainingCard from "@/components/training/TodayTrainingCard";
import type { InboxItem } from "@/components/layout/QuickCapture";
import { Card } from "@/components/ui/primitives";
import { navigateTo } from "@/lib/navigationEvents";
import { loadDietConsumptionRange, loadDietState } from "@/lib/diet/service";
import { summarizeConsumptionForDate, targetPercentage } from "@/lib/diet/analytics";
import type { DietConsumptionEntry, DietState } from "@/lib/diet/types";
import { currentWeekDates, habitIsScheduled, habitStatus, habitStreak, isoDate, taskIsScheduled, taskStatus } from "@/lib/productivity/date";
import { archiveInboxItem, loadCheckins, loadHabitDayPlans, loadHabitEntries, loadHabits, loadInboxItems, loadReadingData, loadTaskEntries, loadTasks, recordReadingProgress, saveCheckin, setHabitStatus as persistHabitStatus, setTaskStatus as persistTaskStatus } from "@/lib/productivity/service";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import type { CheckinEntry, Habit, HabitDayPlan, HabitEntry, HabitStatus, Task, TaskEntry } from "@/lib/productivity/types";
import { DOW_NAMES, getMedalColor } from "@/data/mockData";
import type { ReadingProject, ReadingSession } from "@/data/readingData";

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function tasksForDate(tasks: Task[], date: string) {
  return tasks.filter((task) => taskIsScheduled(task, date));
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
  const today = isoDate(new Date());

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

function NutritionCard({ dietState, entries, selectedDate, loading }: { dietState: DietState | null; entries: DietConsumptionEntry[]; selectedDate: string; loading: boolean }) {
  const targets = dietState?.targets;
  const preferences = dietState?.preferences;
  const consumed = summarizeConsumptionForDate(entries, selectedDate);
  const hasConsumption = consumed.meal_count > 0;
  const dateLabel = selectedDate === isoDate(new Date())
    ? "hoje"
    : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${selectedDate}T12:00:00`));

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-accent bg-accent-subtle text-accent"><Utensils size={18} /></span>
          <div><p className="apex-kicker mb-1.5">Dieta · {dateLabel}</p><h2 className="apex-section-heading">{targets ? hasConsumption ? "Consumo registrado" : "Acompanhamento diário" : "Configuração inicial"}</h2></div>
        </div>
        <button onClick={() => navigateTo("dieta")} className="flex min-h-9 items-center gap-1.5 text-[10px] font-semibold text-accent">Ver plano <ChevronRight size={13} /></button>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        {loading ? <p className="text-[10px] text-ink-muted">Carregando dados da Dieta...</p> : targets ? <>
          <div className="flex items-end justify-between gap-3"><div><p className="font-stat text-[20px] font-semibold text-accent">{Math.round(consumed.calories)} <span className="text-[9px] font-normal text-ink-muted">/ {Math.round(Number(targets.calories))} kcal</span></p><p className="mt-1 text-[9px] text-ink-muted">{hasConsumption ? `${consumed.meal_count} de ${preferences?.meal_count ?? "—"} refeições registradas` : "Nenhuma refeição registrada neste dia"}</p></div><span className="font-stat text-[11px] font-semibold text-ink-secondary">{targetPercentage(consumed.calories, Number(targets.calories))}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-raised"><span className="block h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, targetPercentage(consumed.calories, Number(targets.calories)))}%` }} /></div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <NutritionMetric label="Proteína" value={consumed.protein_g} target={Number(targets.protein_g)} />
            <NutritionMetric label="Carbo" value={consumed.carbs_g} target={Number(targets.carbs_g)} />
            <NutritionMetric label="Gordura" value={consumed.fat_g} target={Number(targets.fat_g)} />
          </div>
          <p className="mt-3 text-[8px] leading-relaxed text-ink-faint">Valores baseados apenas nas refeições marcadas como consumidas.</p>
        </> : <><p className="text-[12px] font-semibold text-ink">Configure preferências e metas</p><p className="mt-2 text-[10px] leading-relaxed text-ink-muted">Conclua o onboarding da Dieta para iniciar o acompanhamento.</p></>}
      </div>

      <button onClick={() => navigateTo("dieta")} className="apex-button-secondary mt-auto w-full"><Utensils size={14} /> {targets ? hasConsumption ? "Revisar consumo" : "Registrar refeições" : "Configurar Dieta"}</button>
    </Card>
  );
}

function NutritionMetric({ label, value, target }: { label: string; value: number; target: number }) {
  return <div className="rounded-control border border-line-subtle bg-surface-raised p-2"><p className="text-[7px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-stat text-[10px] font-semibold text-ink">{Math.round(value)} <span className="text-[7px] font-normal text-ink-muted">/ {Math.round(target)} g</span></p></div>;
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
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [habitPlans, setHabitPlans] = useState<HabitDayPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [dietState, setDietState] = useState<DietState | null>(null);
  const [dietConsumption, setDietConsumption] = useState<DietConsumptionEntry[]>([]);
  const [dietLoading, setDietLoading] = useState(true);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [books, setBooks] = useState<ReadingProject[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [productivityLoading, setProductivityLoading] = useState(true);
  const [productivityError, setProductivityError] = useState("");
  const [showCheckin, setShowCheckin] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [focusHabitId, setFocusHabitId] = useState<string | null>(null);

  const today = isoDate(new Date());
  const weekDates = useMemo(() => currentWeekDates(), []);

  const refreshProductivity = useCallback(async () => {
    if (!user) return;
    const [loadedHabits, entries, plans, loadedTasks, taskRows, loadedCheckins, loadedInbox, reading] = await Promise.all([
      loadHabits(user.id), loadHabitEntries(user.id, weekDates[0], weekDates[6]), loadHabitDayPlans(user.id, weekDates[0], weekDates[6]),
      loadTasks(user.id), loadTaskEntries(user.id, weekDates[0], weekDates[6]), loadCheckins(user.id, weekDates[0], weekDates[6]), loadInboxItems(user.id), loadReadingData(user.id),
    ]);
    setHabits(loadedHabits); setHabitEntries(entries); setHabitPlans(plans); setTasks(loadedTasks); setTaskEntries(taskRows); setCheckins(loadedCheckins); setInbox(loadedInbox); setBooks(reading.projects); setReadingSessions(reading.sessions);
  }, [user, weekDates]);

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProductivityLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      setProductivityError("");
      try {
        await refreshProductivity();
      } catch (error) {
        if (active) setProductivityError(friendlyProductivityError(error));
      } finally {
        if (active) setProductivityLoading(false);
      }
    };
    void load();
    const onChanged = () => void load();
    window.addEventListener("apex-productivity-changed", onChanged);
    return () => {
      active = false;
      window.removeEventListener("apex-productivity-changed", onChanged);
    };
  }, [authLoading, refreshProductivity, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDietLoading(false);
      return;
    }
    let active = true;
    setDietLoading(true);
    void Promise.all([loadDietState(user), loadDietConsumptionRange(user.id, weekDates[0], weekDates[6])])
      .then(([loadedState, loadedConsumption]) => { if (active) { setDietState(loadedState); setDietConsumption(loadedConsumption); } })
      .catch(() => { if (active) { setDietState(null); setDietConsumption([]); } })
      .finally(() => { if (active) setDietLoading(false); });
    return () => { active = false; };
  }, [authLoading, user, weekDates]);

  function habitsForDate(date: string) {
    return habits.filter((habit) => habitIsScheduled(habit, date, habitPlans)).sort((a, b) => a.time.localeCompare(b.time));
  }

  function statusForHabit(habit: Habit, date: string) {
    return habitStatus(habitEntries, habit.id, date);
  }

  const selectedHabits = habitsForDate(selectedDate).map((habit) => ({ ...habit, status: statusForHabit(habit, selectedDate), streak: habitStreak(habitEntries, habit.id, today) }));
  const activeBooks = books.filter((book) => book.status === "active");
  const selectedTasks = tasksForDate(tasks, selectedDate).map((task) => ({ ...task, status: taskStatus(taskEntries, task.id, selectedDate) }));

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

  async function commitHabitStatus(id: string, date: string, status: HabitStatus) {
    setProductivityError("");
    setHabitEntries((previous) => [
      ...previous.filter((entry) => !(entry.habitId === id && entry.date === date)),
      ...(status === "pending" ? [] : [{ id: `optimistic-${id}-${date}`, habitId: id, date, status, completedAt: status === "done" ? new Date().toISOString() : null }]),
    ]);
    try {
      await persistHabitStatus(id, date, status);
      await refreshProductivity();
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
    } catch (error) {
      setProductivityError(friendlyProductivityError(error));
      await refreshProductivity().catch(() => undefined);
    }
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
    void commitHabitStatus(habit.id, selectedDate, next);
  }

  async function logReading(bookId: string, toPage: number) {
    const book = books.find((candidate) => candidate.id === bookId);
    if (!book) return;
    const pagesRead = Math.max(0, toPage - book.currentPage);
    setProductivityError("");
    try {
      await recordReadingProgress(bookId, today, toPage);
      const readingHabit = habits.find((habit) => habit.opensReadingLog);
      if (readingHabit && pagesRead > 0) await persistHabitStatus(readingHabit.id, today, "done");
      await refreshProductivity();
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
    } catch (error) {
      setProductivityError(friendlyProductivityError(error));
    }
  }

  async function toggleTask(id: string) {
    const current = taskStatus(taskEntries, id, selectedDate);
    const next: HabitStatus = current === "done" ? "pending" : "done";
    setProductivityError("");
    try {
      await persistTaskStatus(id, selectedDate, next);
      await refreshProductivity();
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
    } catch (error) {
      setProductivityError(friendlyProductivityError(error));
    }
  }

  async function archiveIdea(id: string) {
    if (!user) return;
    setProductivityError("");
    try {
      await archiveInboxItem(user.id, id);
      await refreshProductivity();
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
    } catch (error) {
      setProductivityError(friendlyProductivityError(error));
    }
  }

  async function completeCheckin(entry: CheckinEntry) {
    if (!user) return;
    setShowCheckin(false);
    setProductivityError("");
    try {
      await saveCheckin(user.id, entry);
      await refreshProductivity();
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
    } catch (error) {
      setProductivityError(friendlyProductivityError(error));
    }
  }

  const weekDays = weekDates.map((date) => {
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
        {productivityError && (
          <div role="alert" className="rounded-card border border-[var(--status-danger)]/35 bg-[var(--status-danger)]/10 px-4 py-3 text-[10px] text-[var(--status-danger)]">
            {productivityError}
          </div>
        )}
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
              <p className="text-[12px] font-semibold text-ink-secondary">{productivityLoading ? "Carregando hábitos..." : "Nenhum hábito planejado"}</p>
              {!productivityLoading && <p className="mt-1 text-[9px] text-ink-muted">Crie sua rotina em Planejamento.</p>}
            </div>
          )}
        </Card>

        <section aria-label="Apoio do dia" className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
          <RemindersCard
            tasks={selectedTasks}
            inbox={inbox}
            onToggleTask={(id) => void toggleTask(id)}
            onArchive={(id) => void archiveIdea(id)}
          />
          <TodayTrainingCard selectedDate={selectedDate} />
          <NutritionCard dietState={dietState} entries={dietConsumption} selectedDate={selectedDate} loading={dietLoading} />
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
        {showCheckin && <CheckinModal date={selectedDate} onComplete={(entry) => void completeCheckin(entry)} onSkip={() => setShowCheckin(false)} />}
        {showReading && activeBooks.length > 0 && <ReadingLogSheet activeBooks={activeBooks} sessions={readingSessions} onLog={(bookId, toPage) => void logReading(bookId, toPage)} onClose={() => setShowReading(false)} />}
        {focusHabitId && (() => { const habit = habits.find((candidate) => candidate.id === focusHabitId); return habit ? <FocusTimerModal task={habit.name} habitId={habit.id} duration={habit.duration} onComplete={() => { void commitHabitStatus(habit.id, today, "done"); setFocusHabitId(null); }} onClose={() => setFocusHabitId(null)} /> : null; })()}
      </AnimatePresence>
    </motion.div>
  );
}
