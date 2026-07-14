import {
  LayoutDashboard, RotateCcw, TrendingUp, CalendarDays, Dumbbell, Brain,
  BookOpen, RefreshCw, Utensils, CalendarClock, Settings, Target, Library,
  Mountain, type LucideIcon,
} from "lucide-react";

export type NavigationItem = { id: string; label: string; shortLabel?: string; Icon: LucideIcon; };
export type NavigationGroup = { section: string; items: NavigationItem[]; };

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  { section: "Executar", items: [
    { id: "dashboard", label: "Hoje", shortLabel: "Hoje", Icon: LayoutDashboard },
    { id: "rotina", label: "Rotina", Icon: RotateCcw },
    { id: "deepwork", label: "Deep Work", Icon: Brain },
  ]},
  { section: "Evoluir", items: [
    { id: "progresso", label: "Progresso", shortLabel: "Progresso", Icon: Mountain },
    { id: "tracker", label: "Hábitos detalhados", Icon: Target },
    { id: "performance", label: "Performance", Icon: TrendingUp },
    { id: "revisao", label: "Revisão semanal", Icon: RefreshCw },
  ]},
  { section: "Corpo", items: [
    { id: "treinos", label: "Treinos", Icon: Dumbbell },
    { id: "periodizacao", label: "Periodização", Icon: CalendarDays },
    { id: "dieta", label: "Dieta", Icon: Utensils },
  ]},
  { section: "Pensar", items: [
    { id: "diario", label: "Diário", Icon: BookOpen },
    { id: "biblioteca", label: "Biblioteca", Icon: Library },
  ]},
  { section: "Organizar", items: [
    { id: "planejamento", label: "Planejamento", shortLabel: "Planejar", Icon: CalendarClock },
    { id: "configuracoes", label: "Configurações", Icon: Settings },
  ]},
];

export const ALL_NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((group) => group.items);
export const MOBILE_PRIMARY_IDS = ["dashboard", "rotina", "progresso", "planejamento"];
