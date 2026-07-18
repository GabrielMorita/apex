"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, Check, ChevronLeft } from "lucide-react";
import {
  dailyRecommendation,
  type ReadingProject, type ReadingSession,
} from "@/data/readingData";

interface Props {
  activeBooks: ReadingProject[];
  sessions: ReadingSession[];
  initialBookId?: string;
  onLog: (bookId: string, toPage: number) => void;
  onClose: () => void;
}

export default function ReadingLogSheet({ activeBooks, sessions, initialBookId, onLog, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBookId ?? (activeBooks.length === 1 ? activeBooks[0].id : null)
  );
  const [toPage, setToPage] = useState<number>(() => {
    const b = activeBooks.find(x => x.id === (initialBookId ?? (activeBooks.length === 1 ? activeBooks[0].id : "")));
    return b ? b.currentPage : 0;
  });
  const [logged, setLogged] = useState<number | null>(null);

  const book = activeBooks.find(b => b.id === selectedId) ?? null;
  const pagesRead = book ? Math.max(0, toPage - book.currentPage) : 0;
  const rec = book ? dailyRecommendation(book, sessions) : 0;

  function select(b: ReadingProject) {
    setSelectedId(b.id);
    setToPage(b.currentPage);
  }
  function handleRegister() {
    if (!book) return;
    onLog(book.id, Math.min(toPage, book.totalPages));
    setLogged(pagesRead);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="surface-raised w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5 pb-7 md:pb-5">

        {/* puxador mobile */}
        <div className="md:hidden flex justify-center mb-3"><div className="w-10 h-1 rounded-full" style={{ background: "var(--ember-ln)" }} /></div>

        {/* ── Feedback de sucesso ── */}
        {logged !== null ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "#7fae6f" }}>
              <Check size={26} color="#14100b" strokeWidth={3} />
            </motion.div>
            <p className="font-stat text-[28px] font-medium text-gold text-glow-gold leading-none">+{logged}</p>
            <p className="text-[12px] text-apex-muted mt-2">páginas registradas</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors">Fechar</button>
          </motion.div>
        ) : !book ? (
          // ── Tela 1: escolher livro ──
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-medium text-apex-white">Registrar leitura</p>
              <button onClick={onClose} className="text-apex-faint hover:text-apex-muted"><X size={16} /></button>
            </div>
            <p className="text-[10px] text-apex-faint mb-4">Qual livro você leu agora?</p>
            <div className="space-y-2">
              {activeBooks.map(b => {
                const r = dailyRecommendation(b, sessions);
                return (
                  <button key={b.id} onClick={() => select(b)} className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left hover-lift surface-card">
                    <div className="w-9 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${b.color ?? "#e3ad52"}22`, border: `1px solid ${b.color ?? "#e3ad52"}40` }}>
                      <BookOpen size={15} color={b.color ?? "#e3ad52"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-apex-white truncate">{b.title}</p>
                      <p className="text-[10px] text-apex-faint font-stat">pág. {b.currentPage}/{b.totalPages}</p>
                    </div>
                    {r > 0 && <span className="text-[10px] text-gold font-stat flex-shrink-0">hoje ~{r}</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          // ── Tela 2: registrar página ──
          <>
            <div className="flex items-center gap-2 mb-4">
              {activeBooks.length > 1 && (
                <button onClick={() => setSelectedId(null)} className="text-apex-faint hover:text-apex-muted"><ChevronLeft size={16} /></button>
              )}
              <div className="flex-1">
                <p className="text-[13px] font-medium text-apex-white leading-tight">{book.title}</p>
                <p className="text-[10px] text-apex-faint">Você estava na página {book.currentPage}</p>
              </div>
              <button onClick={onClose} className="text-apex-faint hover:text-apex-muted"><X size={16} /></button>
            </div>

            {/* input "parei na página" */}
            <div className="surface-card rounded-2xl p-4 mb-3">
              <p className="text-[10px] text-apex-faint uppercase tracking-wider mb-2">Parei na página</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="number" value={toPage} min={book.currentPage} max={book.totalPages}
                  onChange={(e) => setToPage(Math.max(0, Math.min(book.totalPages, +e.target.value)))}
                  className="font-stat text-[34px] font-medium text-apex-white bg-transparent outline-none w-full" style={{ letterSpacing: "-1px" }} />
                <span className="text-[12px] text-apex-faint font-stat flex-shrink-0">/ {book.totalPages}</span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(d => (
                  <button key={d} onClick={() => setToPage(p => Math.min(book.totalPages, p + d))}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-stat border border-apex-border text-apex-muted hover:border-gold hover:text-gold transition-colors">
                    +{d}
                  </button>
                ))}
              </div>
            </div>

            {/* leitura calculada vs recomendação */}
            <div className="flex items-center justify-between px-1 mb-4">
              <div>
                <p className="text-[10px] text-apex-faint">Você leu hoje</p>
                <p className="font-stat text-[16px] font-medium" style={{ color: pagesRead >= rec && rec > 0 ? "#7fae6f" : "var(--color-text-primary)" }}>{pagesRead} pág.</p>
              </div>
              {rec > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-apex-faint">Recomendado</p>
                  <p className="font-stat text-[16px] font-medium text-gold">{rec} pág.</p>
                </div>
              )}
            </div>

            <button onClick={handleRegister} disabled={pagesRead <= 0}
              className="w-full py-3 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              Registrar leitura
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
