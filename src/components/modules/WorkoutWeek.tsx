"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Timer, TrendingUp, Dumbbell, Activity } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  weekWorkouts, workoutTypeLabel, workoutTypeColor,
  defaultPlannedWorkouts, defaultTemplates,
  type Workout, type PlannedWorkout, type WorkoutTemplate,
} from "@/data/mockData";

const FILTERS = ["Todos", "Musculação", "Corrida", "Mobilidade", "Descanso"] as const;
const typeMap: Record<string, Workout["type"]> = {
  "Musculação": "musculacao", "Corrida": "corrida", "Mobilidade": "mobilidade", "Descanso": "descanso",
};

export default function PerformancePage() {
  const [planned, setPlanned]   = useLocalStorage<PlannedWorkout[]>("apex-planned-workouts", defaultPlannedWorkouts);
  const [templates]             = useLocalStorage<WorkoutTemplate[]>("apex-templates", defaultTemplates);
  const [filter, setFilter]     = useState("Todos");

  // Constrói lista de workouts a partir dos planned + templates
  const workouts: (Workout & { pwId: string })[] = planned.map(pw => {
    const t = templates.find(t => t.id === pw.templateId);
    if (!t) return null;
    return {
      id: pw.id, pwId: pw.id, name: t.name, type: t.type, day: pw.day, time: pw.time,
      duration: "—", description: t.description, done: pw.done,
    };
  }).filter(Boolean) as any[];

  const filtered = workouts.filter(w => filter === "Todos" || w.type === typeMap[filter]);
  const done     = workouts.filter(w => w.done).length;
  const total    = workouts.length;

  function toggle(pwId: string) {
    setPlanned(p => p.map(w => w.id === pwId ? { ...w, done: !w.done } : w));
  }

  // Stats da semana
  const byType = (["musculacao", "corrida", "mobilidade", "descanso"] as const).map(t => ({
    type: t, label: workoutTypeLabel[t], color: workoutTypeColor[t],
    total: workouts.filter(w => w.type === t).length,
    done:  workouts.filter(w => w.type === t && w.done).length,
  })).filter(t => t.total > 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Performance" subtitle="Execução dos treinos da semana" />
      <div className="apex-page max-w-3xl space-y-6">

        {/* Explicação rápida */}
        <div className="bg-apex-surface border border-apex-border rounded-xl px-4 py-3 flex items-start gap-3">
          <TrendingUp size={14} className="text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-apex-white mb-0.5">Aqui você acompanha e marca os treinos como feitos.</p>
            <p className="text-[10px] text-apex-faint">Para <strong className="text-apex-muted">planejar a semana e criar templates</strong>, use <strong className="text-apex-muted">Plano / ciclos</strong> acima.</p>
          </div>
        </div>

        {/* Progresso da semana */}
        <div className="bg-apex-card border border-apex-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] text-apex-faint tracking-[2px] uppercase">Semana atual</p>
            <span className="text-[10px] text-gold font-mono">{done}/{total} feitos</span>
          </div>
          <div className="h-2 bg-apex-border rounded-full overflow-hidden mb-4">
            <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              transition={{ duration: 0.8 }} className="h-full bg-gold rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {byType.map(bt => (
              <div key={bt.type} className="bg-apex-surface border border-apex-border rounded-xl p-3 text-center">
                <p className="text-[16px] font-medium leading-none mb-1" style={{ color: bt.done === bt.total && bt.total > 0 ? bt.color : "var(--color-text-primary)" }}>
                  {bt.done}/{bt.total}
                </p>
                <p className="text-[8px] text-apex-faint uppercase tracking-wider">{bt.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] border transition-colors ${filter === f ? "bg-apex-gold-bg border-gold text-gold" : "bg-apex-card border-apex-border text-apex-muted hover:border-apex-border2"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Lista de treinos */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-[12px] text-apex-faint italic py-6 text-center">Nenhum treino planejado. Adicione em Plano / ciclos.</p>
          )}
          {filtered.map(w => (
            <div key={w.id} className={`rounded-xl border p-4 transition-colors ${w.done ? "bg-apex-gold-bg border-[#2a1f0a]" : "bg-apex-card border-apex-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-wider mb-1 font-medium" style={{ color: workoutTypeColor[w.type] }}>
                    {workoutTypeLabel[w.type]} · {w.day}
                  </p>
                  <p className="text-[13px] font-medium text-apex-white">{w.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1"><Timer size={10} className="text-apex-faint" /><span className="text-[10px] text-apex-muted font-mono">{w.time}</span></div>
                    <p className="text-[10px] text-apex-faint">{w.description}</p>
                  </div>
                </div>
                <button onClick={() => toggle(w.pwId)} className="hover:scale-110 transition-transform flex-shrink-0 mt-0.5">
                  {w.done
                    ? <CheckCircle2 size={20} className="text-gold" />
                    : <Circle size={20} className="text-apex-faint" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
