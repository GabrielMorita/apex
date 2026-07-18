"use client";

import { motion } from "framer-motion";
import { CalendarRange, History, ListChecks } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import WorkspaceTabs from "@/components/ui/WorkspaceTabs";
import WorkoutWeek from "@/components/modules/WorkoutWeek";
import WorkoutHistory from "@/components/modules/WorkoutHistory";
import WorkoutPlan from "@/components/modules/WorkoutPlan";
import { useLocalStorage } from "@/lib/useLocalStorage";
import ProfileDependencyNotice from "@/components/profile/ProfileDependencyNotice";
import SensitiveDataNotice from "@/components/privacy/SensitiveDataNotice";

type TrainingTab = "semana" | "plano" | "historico";

const TRAINING_TABS = [
  {
    id: "semana" as const,
    label: "Treino da semana",
    description: "Execute e registre suas sessões",
    Icon: ListChecks,
  },
  {
    id: "plano" as const,
    label: "Plano / ciclos",
    description: "Organize periodização e evolução",
    Icon: CalendarRange,
  },
  {
    id: "historico" as const,
    label: "Histórico",
    description: "Consulte treinos realizados",
    Icon: History,
  },
];

export default function TreinosPage() {
  const [tab, setTab] = useLocalStorage<TrainingTab>("apex-treinos-tab", "semana");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Treino" subtitle="Execução, periodização e histórico em uma única área." />
      <div className="apex-page space-y-5">
        <SensitiveDataNotice area="Treino" />
        <ProfileDependencyNotice feature="Treino" />
        <WorkspaceTabs tabs={TRAINING_TABS} active={tab} onChange={setTab} />

        <div className="embedded-module">
          {tab === "semana" && <WorkoutWeek />}
          {tab === "plano" && <WorkoutPlan />}
          {tab === "historico" && <WorkoutHistory />}
        </div>
      </div>
    </motion.div>
  );
}
