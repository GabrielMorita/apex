import { BarChart3, CalendarClock, Dumbbell, LayoutDashboard, Utensils, type LucideIcon } from "lucide-react";

export type NavigationItem = {
  id: string;
  label: string;
  shortLabel?: string;
  Icon: LucideIcon;
};

export type NavigationGroup = {
  section: string;
  items: NavigationItem[];
};

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    section: "Principal",
    items: [
      { id: "dashboard", label: "Hoje", Icon: LayoutDashboard },
      { id: "planejamento", label: "Planejamento", shortLabel: "Planejar", Icon: CalendarClock },
      { id: "progresso", label: "Progresso", Icon: BarChart3 },
      { id: "treinos", label: "Treino", Icon: Dumbbell },
      { id: "dieta", label: "Dieta", Icon: Utensils },
    ],
  },
];

export const ALL_NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap((group) => group.items);
export const MOBILE_BOTTOM_ITEMS: NavigationItem[] = [
  { id: "planejamento", label: "Planejamento", shortLabel: "Planejar", Icon: CalendarClock },
  { id: "progresso", label: "Progresso", shortLabel: "Progresso", Icon: BarChart3 },
  { id: "dashboard", label: "Hoje", shortLabel: "Hoje", Icon: LayoutDashboard },
  { id: "treinos", label: "Treino", shortLabel: "Treino", Icon: Dumbbell },
  { id: "dieta", label: "Dieta", shortLabel: "Dieta", Icon: Utensils },
];
