"use client";
import { readingStreak, type ReadingProject, type ReadingSession } from "@/data/readingData";

interface Props { projects: ReadingProject[]; sessions: ReadingSession[]; }

export default function ReadingHistory({ projects, sessions }: Props) {
  if (sessions.length === 0) {
    return <p className="text-[11px] text-apex-faint italic">Nenhuma sessão de leitura ainda. Registre uma leitura em Hoje ou no Planejamento.</p>;
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const pagesThisMonth = sessions.filter(s => s.date.startsWith(thisMonth)).reduce((a, s) => a + s.pagesRead, 0);
  const completed = projects.filter(p => p.status === "completed").length;
  const streak = readingStreak(sessions);
  const bookName = (id: string) => projects.find(p => p.id === id)?.title ?? "Livro removido";

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { v: pagesThisMonth, l: "páginas no mês", gold: true },
          { v: completed, l: "livros concluídos", gold: false },
          { v: streak, l: "🔥 dias seguidos", gold: false },
        ].map(s => (
          <div key={s.l} className="surface-card rounded-xl p-3 text-center">
            <p className={`font-stat text-[20px] font-medium ${s.gold ? "text-gold text-glow-gold" : "text-apex-white"}`}>{s.v}</p>
            <p className="text-[8px] text-apex-faint uppercase tracking-wider mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {sorted.slice(0, 30).map(s => (
          <div key={s.id} className="flex items-center justify-between surface-card rounded-xl px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] text-apex-white truncate">{bookName(s.bookId)}</p>
              <p className="text-[9px] text-apex-faint font-stat">
                {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })} · pág. {s.fromPage}→{s.toPage}
              </p>
            </div>
            <span className="text-[11px] text-gold font-stat flex-shrink-0">+{s.pagesRead}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
