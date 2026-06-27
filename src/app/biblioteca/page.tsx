"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import BookCard from "@/components/reading/BookCard";
import BookForm from "@/components/reading/BookForm";
import ReadingLogSheet from "@/components/reading/ReadingLogSheet";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  defaultReadingProjects, defaultReadingSessions, defaultReadingCycles,
  type ReadingProject, type ReadingSession, type ReadingCycle, type ReadingStatus,
} from "@/data/readingData";
import { defaultGoals, type Goal } from "@/data/extraData";
import { defaultHabits, type Habit, type HabitStatus } from "@/data/mockData";

const GROUPS: { status: ReadingStatus; label: string }[] = [
  { status: "active",    label: "Lendo agora" },
  { status: "planned",   label: "Planejados" },
  { status: "paused",    label: "Pausados" },
  { status: "completed", label: "Concluídos" },
  { status: "abandoned", label: "Abandonados" },
];

export default function BibliotecaPage() {
  const [projects, setProjects] = useLocalStorage<ReadingProject[]>("apex-reading-projects", defaultReadingProjects);
  const [sessions, setSessions] = useLocalStorage<ReadingSession[]>("apex-reading-sessions", defaultReadingSessions);
  const [cycles]   = useLocalStorage<ReadingCycle[]>("apex-reading-cycles", defaultReadingCycles);
  const [goals]    = useLocalStorage<Goal[]>("apex-goals", defaultGoals);
  const [habits]   = useLocalStorage<Habit[]>("apex-habits-today", defaultHabits);
  const [, setHabitStatuses] = useLocalStorage<Record<string, HabitStatus>>("apex-today-statuses", {});

  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [logBookId, setLogBookId] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleSave(data: Omit<ReadingProject, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    if (editId) {
      setProjects(p => p.map(b => b.id === editId ? { ...b, ...data, updatedAt: now } : b));
      setEditId(null);
    } else {
      setProjects(p => [...p, { ...data, id: `bk${Date.now()}`, createdAt: now, updatedAt: now }]);
      setShowForm(false);
    }
  }

  function setStatus(id: string, status: ReadingStatus) {
    const today = new Date().toISOString().split("T")[0];
    setProjects(p => p.map(b => b.id === id ? {
      ...b, status,
      completedAt: status === "completed" ? (b.completedAt ?? today) : (status === "active" ? undefined : b.completedAt),
      updatedAt: new Date().toISOString(),
    } : b));
  }

  function logReading(bookId: string, toPage: number) {
    const book = projects.find(b => b.id === bookId);
    if (!book) return;
    const fromPage = book.currentPage;
    const pagesRead = Math.max(0, toPage - fromPage);
    const today = new Date().toISOString().split("T")[0];

    setSessions(s => [...s, { id: `rs${Date.now()}`, bookId, date: today, fromPage, toPage, pagesRead, createdAt: new Date().toISOString() }]);
    const newCurrent = Math.min(toPage, book.totalPages);
    const reachedEnd = newCurrent >= book.totalPages;
    setProjects(p => p.map(b => b.id === bookId ? {
      ...b, currentPage: newCurrent,
      status: reachedEnd ? "completed" : b.status,
      completedAt: reachedEnd ? (b.completedAt ?? today) : b.completedAt,
      updatedAt: new Date().toISOString(),
    } : b));

    // marca o hábito de leitura como feito
    if (pagesRead > 0) {
      const reading = habits.find(h => h.opensReadingLog);
      if (reading) setHabitStatuses(prev => ({ ...prev, [reading.id]: "done" }));
    }
  }

  if (!mounted) return null;
  const activeBooks = projects.filter(b => b.status === "active");
  const editingBook = projects.find(b => b.id === editId);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Biblioteca" subtitle="Seus livros como projetos de leitura" />
      <div className="px-8 py-6 max-w-2xl">

        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-3">
            {[
              { v: activeBooks.length, l: "lendo agora", gold: true },
              { v: projects.filter(b => b.status === "completed").length, l: "concluídos", gold: false },
              { v: projects.length, l: "total", gold: false },
            ].map(s => (
              <div key={s.l} className="surface-card rounded-xl px-5 py-3 text-center">
                <p className={`font-stat text-[20px] font-medium ${s.gold ? "text-gold text-glow-gold" : "text-apex-white"}`}>{s.v}</p>
                <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          {!showForm && !editId && (
            <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors self-start">
              <Plus size={12} /> Novo livro
            </button>
          )}
        </div>

        <AnimatePresence>
          {(showForm || editId) && (
            <BookForm initial={editingBook} goals={goals} cycles={cycles} onSave={handleSave} onCancel={() => { setShowForm(false); setEditId(null); }} />
          )}
        </AnimatePresence>

        {projects.length === 0 && !showForm && (
          <div className="text-center py-16">
            <BookOpen size={26} className="text-apex-faint mx-auto mb-3" />
            <p className="text-[13px] text-apex-muted mb-1">Sua biblioteca está vazia</p>
            <p className="text-[11px] text-apex-faint">Cadastre um livro para começar a planejar sua leitura.</p>
          </div>
        )}

        <div className="space-y-6">
          {GROUPS.map(group => {
            const books = projects.filter(b => b.status === group.status);
            if (books.length === 0) return null;
            return (
              <section key={group.status}>
                <p className="text-[9px] text-apex-faint tracking-[2.5px] uppercase mb-3">{group.label} · {books.length}</p>
                <div className="space-y-2.5">
                  {books.map(b => (
                    <BookCard key={b.id} book={b} sessions={sessions} mode="library"
                      onLog={() => { setLogBookId(b.id); setShowSheet(true); }}
                      onEdit={() => setEditId(b.id)}
                      onDelete={() => setProjects(p => p.filter(x => x.id !== b.id))}
                      onStatus={(s) => setStatus(b.id, s)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showSheet && activeBooks.length > 0 && (
          <ReadingLogSheet activeBooks={activeBooks} sessions={sessions} initialBookId={logBookId ?? undefined}
            onLog={logReading} onClose={() => { setShowSheet(false); setLogBookId(null); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
