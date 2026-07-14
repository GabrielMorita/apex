"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import QuickCapture from "@/components/layout/QuickCapture";
import { weekMetrics } from "@/data/mockData";
import { APEX_NAVIGATE_EVENT } from "@/lib/navigationEvents";

import DashboardPage from "@/app/dashboard/page";
import RotinaPage from "@/app/rotina/page";
import ProgressoPage from "@/app/progresso/page";
import TrackerPage from "@/app/tracker/page";
import PerformancePage from "@/app/performance/page";
import PeriodizacaoPage from "@/app/periodizacao/page";
import TreinosPage from "@/app/treinos/page";
import DeepWorkPage from "@/app/deepwork/page";
import BibliotecaPage from "@/app/biblioteca/page";
import DiarioPage from "@/app/diario/page";
import RevisaoPage from "@/app/revisao/page";
import DietaPage from "@/app/dieta/page";
import PlanejamentoPage from "@/app/planejamento/page";
import ConfiguracoesPage from "@/app/configuracoes/page";

const PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage, rotina: RotinaPage, progresso: ProgressoPage,
  tracker: TrackerPage, performance: PerformancePage, periodizacao: PeriodizacaoPage,
  treinos: TreinosPage, deepwork: DeepWorkPage, biblioteca: BibliotecaPage,
  diario: DiarioPage, revisao: RevisaoPage, dieta: DietaPage,
  planejamento: PlanejamentoPage, configuracoes: ConfiguracoesPage,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const PageComponent = PAGES[activePage] ?? DashboardPage;

  useEffect(() => {
    function onNavigate(event: Event) {
      const page = (event as CustomEvent<string>).detail;
      if (page && PAGES[page]) setActivePage(page);
    }
    window.addEventListener(APEX_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(APEX_NAVIGATE_EVENT, onNavigate);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas lg:h-screen lg:overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} streakDias={weekMetrics.streakDias} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activePage} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: "easeOut" }} className="min-h-screen lg:h-full lg:overflow-y-auto">
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
      <QuickCapture />
      <MobileNavigation activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}
