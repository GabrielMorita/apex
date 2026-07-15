"use client";

import { motion } from "framer-motion";
import { BookOpen, CalendarRange, Repeat2, Target } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import WorkspaceTabs from "@/components/ui/WorkspaceTabs";
import PlanningOverview from "@/components/workspaces/PlanningOverview";
import HabitsManager from "@/components/modules/HabitsManager";
import { useLocalStorage } from "@/lib/useLocalStorage";

type PlanningTab = "agenda" | "habitos" | "metas" | "biblioteca";

const TABS = [
  {
    id: "agenda" as const,
    label: "Organize sua rotina",
    description: "Defina como cada dia funciona",
    Icon: CalendarRange,
  },
  {
    id: "habitos" as const,
    label: "Crie novos hábitos",
    description: "Adicione e ajuste seus hábitos",
    Icon: Repeat2,
  },
  {
    id: "metas" as const,
    label: "Metas de longo prazo",
    description: "Defina objetivos e acompanhe",
    Icon: Target,
  },
  {
    id: "biblioteca" as const,
    label: "Biblioteca de leitura",
    description: "Livros, metas e ciclos de leitura",
    Icon: BookOpen,
  },
];

export default function PlanejamentoPage() {
  const [tab, setTab] = useLocalStorage<PlanningTab>("apex-planejamento-tab", "agenda");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
      <PageHeader title="Planejamento" subtitle="Organize o futuro. O Hoje cuida da execução." />
      <div className="apex-page space-y-5">
        <WorkspaceTabs tabs={TABS} active={tab} onChange={setTab} layout="grid" />
        <div className="embedded-module">
          {tab === "habitos" ? <HabitsManager /> : <PlanningOverview view={tab} />}
        </div>
      </div>
    </motion.div>
  );
}
