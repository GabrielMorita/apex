"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import LucideIcon from "@/components/ui/LucideIcon";
import { getMedalColor, type Habit, type HabitStatus } from "@/data/mockData";

interface WeekDay {
  shortDay: string;
  date: number;
  isToday: boolean;
  fullDate: string;
  habitsDone: number;
  habitsTotal: number;
}

interface Props {
  days: WeekDay[];
  selectedDate?: string | null;
  onDayClick?: (date: string) => void;
  habitsForDay?: (date: string) => Habit[];
  historyForHabit?: (habitId: string, date: string) => HabitStatus;
}

export default function WeeklyCalendar({ days, selectedDate, onDayClick, habitsForDay, historyForHabit }: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="no-scrollbar -mx-4 grid auto-cols-[72px] grid-flow-col gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid-flow-row sm:grid-cols-7 sm:px-0">
        {days.map((day, index) => {
          const isFuture = day.fullDate > today;
          const percentage = day.habitsTotal > 0 ? Math.round((day.habitsDone / day.habitsTotal) * 100) : 0;
          const medal = getMedalColor(percentage, isFuture);
          const selected = selectedDate === day.fullDate;

          return (
            <motion.button
              key={day.fullDate}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.28 }}
              onClick={() => onDayClick?.(day.fullDate)}
              className="relative flex min-h-[102px] flex-col items-center justify-between rounded-card border px-2 py-3 text-center transition-colors"
              style={{
                background: day.isToday || selected ? "var(--accent-subtle)" : "var(--surface-raised)",
                borderColor: day.isToday || selected ? "var(--border-accent)" : "var(--border-default)",
              }}
            >
              {day.isToday && <span className="absolute left-1/2 top-0 h-px w-7 -translate-x-1/2 rounded-full bg-accent" />}
              <div>
                <p className={`text-[9px] font-semibold uppercase tracking-[.14em] ${day.isToday ? "text-accent" : "text-ink-muted"}`}>{day.shortDay}</p>
                <p className="mt-2 font-stat text-[17px] font-medium text-ink">{day.date}</p>
              </div>

              <div className="w-full">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  {!isFuture && percentage > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.035 + 0.15, duration: 0.45 }}
                      className="h-full rounded-full"
                      style={{ background: medal }}
                    />
                  )}
                </div>
                <p className="mt-2 font-stat text-[8px] text-ink-muted">{isFuture ? "—" : `${day.habitsDone}/${day.habitsTotal}`}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDate && habitsForDay && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="mt-3 overflow-hidden rounded-card border border-line bg-surface-raised"
          >
            <div className="flex min-h-12 items-center justify-between border-b border-line px-4">
              <div>
                <p className="apex-kicker mb-1">Detalhes do dia</p>
                <p className="font-stat text-[11px] text-ink-secondary">{selectedDate}</p>
              </div>
              <button onClick={() => onDayClick?.(selectedDate)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-2 p-3">
              {habitsForDay(selectedDate).length === 0 ? (
                <p className="px-1 py-3 text-[11px] italic text-ink-muted">Nenhum hábito planejado.</p>
              ) : (
                habitsForDay(selectedDate).map((habit) => {
                  const status = historyForHabit?.(habit.id, selectedDate) ?? "pending";
                  const done = status === "done";
                  const skipped = status === "skipped";
                  return (
                    <div
                      key={habit.id}
                      className="flex min-h-12 items-center gap-3 rounded-control border px-3"
                      style={{
                        background: done ? `${habit.color}12` : "var(--surface-base)",
                        borderColor: done ? `${habit.color}35` : "var(--border-subtle)",
                      }}
                    >
                      <LucideIcon name={habit.lucideIcon ?? "Circle"} size={14} color={done ? habit.color : "var(--text-muted)"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold" style={{ color: done ? habit.color : "var(--text-secondary)" }}>{habit.name}</p>
                        <p className="mt-0.5 font-stat text-[9px] text-ink-muted">{habit.time}</p>
                      </div>
                      <span className="font-stat text-[9px]" style={{ color: done ? habit.color : skipped ? "var(--status-warning)" : "var(--text-faint)" }}>
                        {done ? "feito" : skipped ? "pulado" : "pendente"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
