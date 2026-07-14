"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Dumbbell, Gauge } from "lucide-react";
import { Card, IconTile } from "@/components/ui/primitives";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof Gauge;
  emphasis?: boolean;
  index?: number;
}

function MetricCard({ label, value, sub, icon: Icon, emphasis = false, index = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.32, ease: [.22, .61, .36, 1] }}
    >
      <Card emphasis={emphasis} className="h-full p-4 sm:p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <p className="apex-kicker pt-1">{label}</p>
          <IconTile Icon={Icon} active={emphasis} size="sm" />
        </div>
        <p className={`font-stat text-[28px] font-medium leading-none tracking-[-0.05em] sm:text-[32px] ${emphasis ? "text-accent" : "text-ink"}`}>
          {value}
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-muted sm:text-[11px]">{sub}</p>
      </Card>
    </motion.div>
  );
}

interface Props {
  scoreSemanal: number;
  consistencia: number;
  habitosHoje: number;
  habitosTotal: number;
  treinosConcluidos: number;
  treinosTotal: number;
}

export default function DashboardSummary({
  scoreSemanal,
  consistencia,
  habitosHoje,
  habitosTotal,
  treinosConcluidos,
  treinosTotal,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const habitsDone = mounted ? habitosHoje : 0;
  const habitsTotal = mounted ? Math.max(habitosTotal, 1) : 1;
  const workoutsDone = mounted ? treinosConcluidos : 0;
  const workoutsTotal = mounted ? Math.max(treinosTotal, 1) : 1;

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard label="Score semanal" value={scoreSemanal} sub="12 pontos acima da semana anterior" icon={Gauge} emphasis index={0} />
      <MetricCard
        label="Hábitos hoje"
        value={`${habitsDone}/${mounted ? habitosTotal : 0}`}
        sub={`${Math.round((habitsDone / habitsTotal) * 100)}% do plano concluído`}
        icon={CheckCircle2}
        index={1}
      />
      <MetricCard
        label="Treinos"
        value={`${workoutsDone}/${mounted ? treinosTotal : 0}`}
        sub={`${Math.max(0, workoutsTotal - workoutsDone)} sessão${workoutsTotal - workoutsDone === 1 ? "" : "ões"} restante${workoutsTotal - workoutsDone === 1 ? "" : "s"}`}
        icon={Dumbbell}
        index={2}
      />
      <MetricCard label="Consistência" value={`${consistencia}%`} sub="Média móvel dos últimos 30 dias" icon={Activity} emphasis index={3} />
    </div>
  );
}
