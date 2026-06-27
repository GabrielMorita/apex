// ============================================================
//  BIBLIOTECA / PROJETOS DE LEITURA — dados e cálculos
//  Princípio: persistir só fatos brutos (livros + sessões).
//  Metas, ritmo e recomendações são SEMPRE derivados.
// ============================================================
import { getCurrentWeekDates } from "@/data/mockData";

export type ReadingStatus = "planned" | "active" | "paused" | "completed" | "abandoned";

export interface ReadingProject {
  id: string;
  title: string;
  author?: string;
  totalPages: number;
  currentPage: number;
  weeklyTargetPages: number;
  readingDays: number[];            // 0=Dom … 6=Sáb (padrão getDay()). Vazio = todos os dias.
  status: ReadingStatus;
  priority: "main" | "secondary";
  startDate: string;                // "YYYY-MM-DD"
  targetEndDate?: string;
  completedAt?: string;             // setado ao concluir
  cycleId?: string;
  linkedGoalId?: string;
  // avançados (recolhidos no form):
  color?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  date: string;                     // "YYYY-MM-DD"
  fromPage: number;
  toPage: number;
  pagesRead: number;
  note?: string;
  createdAt: string;
}

export interface ReadingCycle {
  id: string;
  label: string;                    // "Q1 2026"
  startDate: string;
  endDate: string;
  targetBooks: number;
  linkedGoalId?: string;
}

export const STATUS_META: Record<ReadingStatus, { label: string; color: string }> = {
  planned:   { label: "Planejado",  color: "#a99a83" },
  active:    { label: "Lendo agora",color: "#e3ad52" },
  paused:    { label: "Pausado",    color: "#d0855a" },
  completed: { label: "Concluído",  color: "#7fae6f" },
  abandoned: { label: "Abandonado", color: "#8a7a64" },
};

export const BOOK_COLORS = ["#e3ad52","#3B82F6","#10b981","#8b5cf6","#ef4444","#f97316","#06b6d4","#ec4899"];

// ── Dados-exemplo (semente) ──────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];

export const defaultReadingProjects: ReadingProject[] = [
  {
    id: "bk1", title: "Cartas a Lucílio", author: "Sêneca",
    totalPages: 320, currentPage: 48, weeklyTargetPages: 70,
    readingDays: [1,2,3,4,5,6], status: "active", priority: "main",
    startDate: todayISO(), color: "#e3ad52", category: "Filosofia",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "bk2", title: "Hábitos Atômicos", author: "James Clear",
    totalPages: 180, currentPage: 22, weeklyTargetPages: 30,
    readingDays: [0,1,2,3,4,5,6], status: "active", priority: "secondary",
    startDate: todayISO(), color: "#3B82F6", category: "Desenvolvimento",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const defaultReadingSessions: ReadingSession[] = [];
export const defaultReadingCycles: ReadingCycle[] = [];

// ── CÁLCULOS (tudo derivado) ─────────────────────────────────

/** Páginas lidas de um livro dentro da semana corrente. */
export function pagesReadInWeek(sessions: ReadingSession[], bookId: string, week = getCurrentWeekDates()): number {
  return sessions
    .filter(s => s.bookId === bookId && week.includes(s.date))
    .reduce((sum, s) => sum + s.pagesRead, 0);
}

/** Páginas lidas hoje de um livro. */
export function pagesReadToday(sessions: ReadingSession[], bookId: string): number {
  const t = todayISO();
  return sessions.filter(s => s.bookId === bookId && s.date === t).reduce((a, s) => a + s.pagesRead, 0);
}

export type WeeklyStatus = "concluida" | "no_ritmo" | "abaixo";

export const WEEKLY_STATUS_META: Record<WeeklyStatus, { label: string; color: string }> = {
  concluida: { label: "meta batida",     color: "#7fae6f" },
  no_ritmo:  { label: "no ritmo",        color: "#e3ad52" },
  abaixo:    { label: "abaixo do ritmo", color: "#d0855a" },
};

/** Status da meta semanal: concluída / no ritmo / abaixo do ritmo. */
export function weeklyStatus(book: ReadingProject, sessions: ReadingSession[], week = getCurrentWeekDates()): WeeklyStatus {
  const read = pagesReadInWeek(sessions, book.id, week);
  if (read >= book.weeklyTargetPages) return "concluida";

  const days = book.readingDays.length ? book.readingDays : [0,1,2,3,4,5,6];
  const today = new Date(); today.setHours(0,0,0,0);
  const elapsed = week.filter(d => {
    const dt = new Date(d + "T12:00:00");
    return dt <= today && days.includes(dt.getDay());
  }).length;

  if (elapsed === 0) return "no_ritmo"; // semana ainda não começou para esse livro
  const expected = book.weeklyTargetPages * (elapsed / days.length);
  return read >= expected ? "no_ritmo" : "abaixo";
}

/** Dias de leitura restantes na semana (de hoje até domingo). */
export function remainingReadingDays(book: ReadingProject, week = getCurrentWeekDates()): number {
  const days = book.readingDays.length ? book.readingDays : [0,1,2,3,4,5,6];
  const today = new Date(); today.setHours(0,0,0,0);
  return week.filter(d => {
    const dt = new Date(d + "T12:00:00");
    return dt >= today && days.includes(dt.getDay());
  }).length;
}

/** Recomendação adaptativa de páginas para hoje. */
export function dailyRecommendation(book: ReadingProject, sessions: ReadingSession[], week = getCurrentWeekDates()): number {
  const read = pagesReadInWeek(sessions, book.id, week);
  const remainingPages = Math.max(0, book.weeklyTargetPages - read);
  if (remainingPages === 0) return 0;
  const days = remainingReadingDays(book, week);
  return days > 0 ? Math.ceil(remainingPages / days) : remainingPages;
}

/** Progresso total do livro (0–100). */
export function bookProgressPct(book: ReadingProject): number {
  if (book.totalPages <= 0) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

/** Livros concluídos no ano vinculados a uma meta (para "X de 20 livros"). */
export function completedBooksForGoal(projects: ReadingProject[], goalId: string, year = new Date().getFullYear()): number {
  return projects.filter(p =>
    p.linkedGoalId === goalId && p.status === "completed" &&
    p.completedAt?.startsWith(String(year))
  ).length;
}

/** Livros concluídos dentro de um ciclo (trimestre). */
export function completedBooksForCycle(projects: ReadingProject[], cycle: ReadingCycle): number {
  return projects.filter(p =>
    p.cycleId === cycle.id && p.status === "completed" &&
    p.completedAt && p.completedAt >= cycle.startDate && p.completedAt <= cycle.endDate
  ).length;
}

/** Sequência de dias seguidos com pelo menos uma leitura (qualquer livro). */
export function readingStreak(sessions: ReadingSession[]): number {
  const days = new Set(sessions.map(s => s.date));
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  // se não leu hoje, começa a contar de ontem
  if (!days.has(d.toISOString().split("T")[0])) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
