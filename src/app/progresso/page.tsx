"use client";

import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Target, Utensils } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import WorkspaceTabs from "@/components/ui/WorkspaceTabs";
import ProgressOverview from "@/components/workspaces/ProgressOverview";
import HabitProgress from "@/components/modules/HabitProgress";
import WeeklyReview from "@/components/modules/WeeklyReview";
import NutritionProgress from "@/components/diet/NutritionProgress";
import { useLocalStorage } from "@/lib/useLocalStorage";

type ProgressTab = "visao" | "habitos" | "alimentacao" | "revisao";

const TABS = [
  { id: "visao" as const, label: "Visão geral", description: "Score, metas e sinais da semana", Icon: BarChart3 },
  { id: "habitos" as const, label: "Hábitos", description: "Consistência e metas semanais", Icon: Target },
  { id: "alimentacao" as const, label: "Alimentação", description: "Consumo real e histórico nutricional", Icon: Utensils },
  { id: "revisao" as const, label: "Revisão", description: "Transforme a semana em ajustes", Icon: RefreshCw },
];

export default function ProgressoPage() {
  const [tab, setTab] = useLocalStorage<ProgressTab>("apex-progresso-tab", "visao");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Progresso" subtitle="Acompanhe, entenda e ajuste sua evolução." />
      <div className="apex-page space-y-5">
        <WorkspaceTabs tabs={TABS} active={tab} onChange={setTab} />
        <div className="embedded-module">
          {tab === "visao" && <ProgressOverview onOpenTab={setTab} />}
          {tab === "habitos" && <HabitProgress />}
          {tab === "alimentacao" && <NutritionProgress />}
          {tab === "revisao" && <WeeklyReview />}
        </div>
      </div>
    </motion.div>
  );
}
