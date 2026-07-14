"use client";

import { motion } from "framer-motion";
import { Check, Flame, Minus } from "lucide-react";
import LucideIcon from "@/components/ui/LucideIcon";
import type { Habit, HabitStatus } from "@/data/mockData";
import { isRestDay } from "@/data/mockData";

interface HabitCircleProps {
  habit: Habit;
  onToggle: (id: string, next: HabitStatus) => void;
}

function nextStatus(current: HabitStatus, rest: boolean): HabitStatus {
  if (rest) return current;
  if (current === "pending") return "done";
  if (current === "done") return "skipped";
  return "pending";
}

export default function HabitCircle({ habit, onToggle }: HabitCircleProps) {
  const rest = isRestDay(habit.frequency ?? { type: "daily" });
  const isDone = habit.status === "done";
  const isSkipped = habit.status === "skipped";

  return (
    <motion.button
      whileTap={rest ? undefined : { scale: 0.98 }}
      onClick={() => onToggle(habit.id, nextStatus(habit.status, rest))}
      disabled={rest}
      className="group flex min-h-[104px] w-full flex-col justify-between rounded-card border p-3 text-left transition-colors sm:min-h-[116px] sm:p-4"
      style={{
        borderColor: isDone ? `${habit.color}66` : "var(--border-default)",
        background: isDone
          ? `linear-gradient(145deg, ${habit.color}18, var(--surface-raised) 66%)`
          : "var(--surface-raised)",
        opacity: rest ? 0.45 : 1,
        boxShadow: isDone ? `0 16px 30px -26px ${habit.color}` : "var(--shadow-card)",
      }}
      title={rest ? "Dia de descanso" : habit.name}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-control border"
          style={{
            background: isDone ? `${habit.color}18` : "var(--surface-base)",
            borderColor: isDone ? `${habit.color}4d` : "var(--border-subtle)",
          }}
        >
          <LucideIcon
            name={habit.lucideIcon ?? "Circle"}
            size={17}
            color={isDone ? habit.color : "var(--text-muted)"}
            strokeWidth={isDone ? 2.2 : 1.75}
          />
        </span>

        <span
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{
            background: isDone ? habit.color : "transparent",
            borderColor: isDone ? habit.color : "var(--border-default)",
            color: isDone ? "var(--text-inverse)" : "var(--text-faint)",
          }}
        >
          {isDone ? <Check size={13} strokeWidth={3} /> : isSkipped ? <Minus size={12} /> : null}
        </span>
      </div>

      <div className="mt-4 min-w-0">
        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-ink sm:text-[13px]">{habit.name}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-medium text-ink-muted">
          {isDone && <Flame size={10} fill={habit.color} color={habit.color} />}
          <span className="font-stat">{rest ? "descanso" : isDone ? `${habit.streak} dias` : habit.time}</span>
        </div>
      </div>
    </motion.button>
  );
}
