"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import { weekMetrics } from "@/data/mockData";

import DashboardPage     from "@/app/dashboard/page";
import RotinaPage        from "@/app/rotina/page";
import TrackerPage       from "@/app/tracker/page";
import PerformancePage   from "@/app/performance/page";
import PeriodizacaoPage  from "@/app/periodizacao/page";
import TreinosPage       from "@/app/treinos/page";
import DeepWorkPage      from "@/app/deepwork/page";
import BibliotecaPage    from "@/app/biblioteca/page";
import DiarioPage        from "@/app/diario/page";
import RevisaoPage       from "@/app/revisao/page";
import DietaPage         from "@/app/dieta/page";
import PlanejamentoPage  from "@/app/planejamento/page";
import ConfiguracoesPage from "@/app/configuracoes/page";

const PAGES: Record<string, React.ComponentType> = {
  dashboard:    DashboardPage,
  rotina:       RotinaPage,
  tracker:      TrackerPage,
  performance:  PerformancePage,
  periodizacao: PeriodizacaoPage,
  treinos:      TreinosPage,
  deepwork:     DeepWorkPage,
  biblioteca:   BibliotecaPage,
  diario:       DiarioPage,
  revisao:      RevisaoPage,
  dieta:        DietaPage,
  planejamento: PlanejamentoPage,
  configuracoes:ConfiguracoesPage,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const PageComponent = PAGES[activePage] ?? DashboardPage;

  return (
    <div className="flex h-screen bg-apex-bg overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        streakDias={weekMetrics.streakDias}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={activePage}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 overflow-y-auto flex flex-col">
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
