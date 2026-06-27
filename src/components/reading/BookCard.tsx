"use client";
import { motion } from "framer-motion";
import { BookOpen, Play, Pause, Check, X, Pencil, Trash2, RotateCcw } from "lucide-react";
import {
  pagesReadInWeek, weeklyStatus, dailyRecommendation, bookProgressPct,
  STATUS_META, WEEKLY_STATUS_META,
  type ReadingProject, type ReadingSession, type ReadingStatus,
} from "@/data/readingData";

interface Props {
  book: ReadingProject;
  sessions: ReadingSession[];
  mode?: "library" | "planning";
  onLog?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatus?: (s: ReadingStatus) => void;
}

export default function BookCard({ book, sessions, mode = "library", onLog, onEdit, onDelete, onStatus }: Props) {
  const c = book.color ?? "#e3ad52";
  const read = pagesReadInWeek(sessions, book.id);
  const wkStatus = weeklyStatus(book, sessions);
  const wkMeta = WEEKLY_STATUS_META[wkStatus];
  const rec = dailyRecommendation(book, sessions);
  const bookPct = bookProgressPct(book);
  const weekPct = book.weeklyTargetPages > 0 ? Math.min(100, Math.round((read / book.weeklyTargetPages) * 100)) : 0;
  const isActive = book.status === "active";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="surface-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {/* capa/cor */}
        <div className="w-11 h-15 rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 60, background: `linear-gradient(160deg, ${c}30, ${c}10)`, border: `1px solid ${c}40` }}>
          <BookOpen size={17} color={c} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-apex-white truncate">{book.title}</p>
              {book.author && <p className="text-[10px] text-apex-faint truncate">{book.author}</p>}
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ background: `${STATUS_META[book.status].color}1f`, color: STATUS_META[book.status].color }}>
              {STATUS_META[book.status].label}
            </span>
          </div>

          {/* progresso do livro */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-apex-faint font-stat">pág. {book.currentPage}/{book.totalPages}</span>
              <span className="text-[9px] font-stat" style={{ color: c }}>{bookPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(122,104,78,0.2)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${bookPct}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: c }} />
            </div>
          </div>
        </div>
      </div>

      {/* meta semanal + ritmo */}
      <div className="mt-3 pt-3 border-t border-apex-border flex items-center justify-between">
        <div>
          <p className="text-[9px] text-apex-faint uppercase tracking-wider">Meta semanal</p>
          <p className="text-[12px] font-stat text-apex-white">{read} <span className="text-apex-faint">/ {book.weeklyTargetPages} pág.</span></p>
        </div>
        <div className="text-right">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${wkMeta.color}1f`, color: wkMeta.color }}>{wkMeta.label}</span>
          {isActive && rec > 0 && <p className="text-[9px] text-apex-faint mt-1">hoje ~<span className="text-gold font-stat">{rec}</span> pág.</p>}
        </div>
      </div>
      {/* barra semanal */}
      <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: "rgba(122,104,78,0.2)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${weekPct}%` }} transition={{ duration: 0.7 }} className="h-full rounded-full" style={{ background: wkMeta.color }} />
      </div>

      {/* planning mode: dias + ciclo */}
      {mode === "planning" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["D","S","T","Q","Q","S","S"].map((d, i) => (
            <span key={i} className="w-5 h-5 rounded-md flex items-center justify-center text-[8px]" style={{
              background: (book.readingDays.length ? book.readingDays : [0,1,2,3,4,5,6]).includes(i) ? `${c}22` : "transparent",
              color: (book.readingDays.length ? book.readingDays : [0,1,2,3,4,5,6]).includes(i) ? c : "#6f6250",
              border: `1px solid ${(book.readingDays.length ? book.readingDays : [0,1,2,3,4,5,6]).includes(i) ? `${c}40` : "transparent"}`,
            }}>{d}</span>
          ))}
        </div>
      )}

      {/* ações */}
      <div className="mt-3 flex items-center gap-2">
        {mode === "library" && isActive && onLog && (
          <button onClick={onLog} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-apex-bg rounded-lg text-[10px] font-medium hover:bg-amber-500 transition-colors">
            <BookOpen size={11} /> Registrar leitura
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {/* transições de status */}
          {onStatus && book.status === "planned" && <IconBtn icon={Play} title="Começar a ler" onClick={() => onStatus("active")} />}
          {onStatus && isActive && <IconBtn icon={Pause} title="Pausar" onClick={() => onStatus("paused")} />}
          {onStatus && book.status === "paused" && <IconBtn icon={Play} title="Retomar" onClick={() => onStatus("active")} />}
          {onStatus && (isActive || book.status === "paused" || book.status === "planned") && <IconBtn icon={Check} title="Concluir" onClick={() => onStatus("completed")} color="#7fae6f" />}
          {onStatus && book.status === "completed" && <IconBtn icon={RotateCcw} title="Reabrir" onClick={() => onStatus("active")} />}
          {onStatus && (isActive || book.status === "paused") && <IconBtn icon={X} title="Abandonar" onClick={() => onStatus("abandoned")} color="#d0855a" />}
          {onEdit && <IconBtn icon={Pencil} title="Editar" onClick={onEdit} />}
          {onDelete && <IconBtn icon={Trash2} title="Excluir" onClick={onDelete} color="#ef4444" />}
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({ icon: Icon, title, onClick, color }: { icon: any; title: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-lg text-apex-faint hover:bg-apex-surface transition-colors" style={color ? { color } : undefined}>
      <Icon size={13} />
    </button>
  );
}
