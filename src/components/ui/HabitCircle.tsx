"use client";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
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
  const rest   = isRestDay(habit.frequency ?? { type: "daily" });
  const isDone = habit.status === "done";
  const isSkip = habit.status === "skipped";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: rest ? 1 : 1.07, y: rest ? 0 : -2 }}
        transition={{ type:"spring", stiffness:400, damping:22 }}
        onClick={() => onToggle(habit.id, nextStatus(habit.status, rest))}
        disabled={rest}
        style={{
          position:"relative",
          width:74, height:74, borderRadius:"50%",
          border:`2.5px solid ${isDone ? habit.color : isSkip ? "#4a3b2a" : "rgba(243,235,221,0.12)"}`,
          background: isDone
            ? `radial-gradient(circle at 50% 38%, ${habit.color}26, ${habit.color}10 70%)`
            : "rgba(255,247,235,0.015)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
          cursor: rest ? "default" : "pointer",
          opacity: rest ? 0.32 : 1,
          boxShadow: isDone ? `0 0 22px -2px ${habit.color}55, inset 0 0 14px -4px ${habit.color}40` : "none",
          transition:"border-color .25s, background .25s, box-shadow .25s",
        }}
        title={rest ? "Dia de descanso" : habit.name}
      >
        <LucideIcon
          name={habit.lucideIcon ?? "Circle"}
          size={23}
          color={isDone ? habit.color : isSkip ? "#6f5c40" : "rgba(243,235,221,0.32)"}
          strokeWidth={isDone ? 2.2 : 1.6}
        />
        {isDone && (
          <div style={{ display:"flex", alignItems:"center", gap:2 }}>
            <Flame size={9} color={habit.color} fill={habit.color} />
            <span className="font-stat" style={{ fontSize:9, fontWeight:600, color:habit.color }}>{habit.streak}</span>
          </div>
        )}
        {isSkip && <span style={{ fontSize:11, color:"#6f5c40" }}>✕</span>}
        {!isDone && !isSkip && !rest && (
          <div style={{ width:5, height:5, borderRadius:"50%", background:"rgba(243,235,221,0.14)" }} />
        )}
      </motion.button>
      <span style={{ fontSize:10.5, color:isDone?"#cdbfa6":"#a99a83", textAlign:"center", maxWidth:78, lineHeight:1.3, fontWeight:500 }}>
        {habit.name}
      </span>
    </div>
  );
}
