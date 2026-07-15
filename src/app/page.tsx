"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavigation from "@/components/layout/MobileNavigation";
import QuickCapture from "@/components/layout/QuickCapture";
import { weekMetrics } from "@/data/mockData";
import { APEX_NAVIGATE_EVENT } from "@/lib/navigationEvents";

import DashboardPage from "@/app/dashboard/page";
import PlanejamentoPage from "@/app/planejamento/page";
import ProgressoPage from "@/app/progresso/page";
import TreinosPage from "@/app/treinos/page";
import DietaPage from "@/app/dieta/page";
import ConfiguracoesPage from "@/app/configuracoes/page";

const PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  planejamento: PlanejamentoPage,
  progresso: ProgressoPage,
  treinos: TreinosPage,
  dieta: DietaPage,
  configuracoes: ConfiguracoesPage,
};

type Destination = { page: keyof typeof PAGES; section?: string };

function resolveDestination(raw: string): Destination {
  const [requestedPage, requestedSection] = raw.split(":");

  if (requestedPage === "corpo") {
    return requestedSection === "dieta"
      ? { page: "dieta" }
      : { page: "treinos", section: requestedSection === "plano" ? "plano" : "semana" };
  }

  const aliases: Record<string, Destination> = {
    hoje: { page: "dashboard" },
    rotina: { page: "planejamento", section: "habitos" },
    tracker: { page: "progresso", section: "habitos" },
    performance: { page: "progresso", section: "visao" },
    revisao: { page: "progresso", section: "revisao" },
    treino: { page: "treinos", section: "semana" },
    periodizacao: { page: "treinos", section: "plano" },
    biblioteca: { page: "planejamento", section: "agenda" },
    deepwork: { page: "dashboard" },
    diario: { page: "dashboard" },
  };

  if (aliases[requestedPage]) return aliases[requestedPage];
  if (PAGES[requestedPage]) return { page: requestedPage, section: requestedSection };
  return { page: "dashboard" };
}

function storeSection(page: string, section?: string) {
  if (!section || typeof window === "undefined") return;
  const keys: Record<string, string> = {
    planejamento: "apex-planejamento-tab",
    progresso: "apex-progresso-tab",
    treinos: "apex-treinos-tab",
  };
  const key = keys[page];
  if (key) localStorage.setItem(key, JSON.stringify(section));
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const PageComponent = PAGES[activePage] ?? DashboardPage;

  function navigate(raw: string) {
    const destination = resolveDestination(raw);
    storeSection(destination.page, destination.section);
    setActivePage(destination.page);
  }

  useEffect(() => {
    function onNavigate(event: Event) {
      const raw = (event as CustomEvent<string>).detail;
      if (raw) navigate(raw);
    }
    window.addEventListener(APEX_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(APEX_NAVIGATE_EVENT, onNavigate);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas lg:h-screen lg:overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={navigate} streakDias={weekMetrics.streakDias} />
      <main className="min-w-0 flex-1 lg:h-screen lg:overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="min-h-screen lg:h-full lg:overflow-y-auto"
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
      <QuickCapture />
      <MobileNavigation activeDestination={activePage} onNavigate={navigate} />
    </div>
  );
}
