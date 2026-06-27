"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BOOK_COLORS, type ReadingProject, type ReadingStatus, type ReadingCycle } from "@/data/readingData";
import type { Goal } from "@/data/extraData";

const DOW = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface Props {
  initial?: ReadingProject;
  goals: Goal[];
  cycles: ReadingCycle[];
  onSave: (data: Omit<ReadingProject, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export default function BookForm({ initial, goals, cycles, onSave, onCancel }: Props) {
  const [title, setTitle]   = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [total, setTotal]   = useState(initial?.totalPages ?? 200);
  const [current, setCurrent] = useState(initial?.currentPage ?? 0);
  const [weekly, setWeekly] = useState(initial?.weeklyTargetPages ?? 50);
  const [days, setDays]     = useState<number[]>(initial?.readingDays ?? [1,2,3,4,5]);
  const [status, setStatus] = useState<ReadingStatus>(initial?.status ?? "active");
  const [priority, setPriority] = useState<"main" | "secondary">(initial?.priority ?? "main");
  const [linkedGoalId, setLinkedGoalId] = useState(initial?.linkedGoalId ?? "");
  const [cycleId, setCycleId] = useState(initial?.cycleId ?? "");
  // avançados
  const [advOpen, setAdvOpen] = useState(false);
  const [color, setColor]   = useState(initial?.color ?? BOOK_COLORS[0]);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [notes, setNotes]   = useState(initial?.notes ?? "");

  function toggleDay(i: number) { setDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i].sort()); }

  function handleSave() {
    if (!title.trim() || total <= 0) return;
    onSave({
      title: title.trim(), author: author.trim() || undefined,
      totalPages: total, currentPage: Math.min(current, total),
      weeklyTargetPages: weekly, readingDays: days, status, priority,
      startDate: initial?.startDate ?? new Date().toISOString().split("T")[0],
      targetEndDate: initial?.targetEndDate,
      completedAt: status === "completed" ? (initial?.completedAt ?? new Date().toISOString().split("T")[0]) : initial?.completedAt,
      cycleId: cycleId || undefined, linkedGoalId: linkedGoalId || undefined,
      color, category: category.trim() || undefined, notes: notes.trim() || undefined,
    });
  }

  const inputCls = "w-full bg-apex-surface border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold transition-colors";

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="surface-card border border-gold/30 rounded-2xl p-4 space-y-3 mb-4">
      <input autoFocus type="text" placeholder="Título do livro" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      <input type="text" placeholder="Autor (opcional)" value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} />

      <div className="grid grid-cols-3 gap-2">
        <div><p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Total pág.</p><input type="number" value={total} onChange={(e) => setTotal(+e.target.value)} className={inputCls} /></div>
        <div><p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Pág. atual</p><input type="number" value={current} onChange={(e) => setCurrent(+e.target.value)} className={inputCls} /></div>
        <div><p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Meta/sem.</p><input type="number" value={weekly} onChange={(e) => setWeekly(+e.target.value)} className={inputCls} /></div>
      </div>

      <div>
        <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Dias de leitura</p>
        <div className="flex gap-1.5 flex-wrap">
          {DOW.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${days.includes(i) ? "bg-apex-gold-bg border-gold text-gold" : "bg-apex-surface border-apex-border text-apex-muted"}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Status</p>
          <select value={status} onChange={(e) => setStatus(e.target.value as ReadingStatus)} className={inputCls}>
            <option value="active">Lendo agora</option><option value="planned">Planejado</option>
            <option value="paused">Pausado</option><option value="completed">Concluído</option><option value="abandoned">Abandonado</option>
          </select>
        </div>
        <div>
          <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Prioridade</p>
          <select value={priority} onChange={(e) => setPriority(e.target.value as "main" | "secondary")} className={inputCls}>
            <option value="main">Principal</option><option value="secondary">Secundário</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Meta anual</p>
          <select value={linkedGoalId} onChange={(e) => setLinkedGoalId(e.target.value)} className={inputCls}>
            <option value="">Nenhuma</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-1">Ciclo</p>
          <select value={cycleId} onChange={(e) => setCycleId(e.target.value)} className={inputCls}>
            <option value="">Nenhum</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* avançados */}
      <button onClick={() => setAdvOpen(o => !o)} className="flex items-center gap-1.5 text-[10px] text-apex-faint hover:text-apex-muted transition-colors">
        {advOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Opções avançadas
      </button>
      {advOpen && (
        <div className="space-y-3 pt-1">
          <div>
            <p className="text-[9px] text-apex-faint uppercase tracking-wider mb-2">Cor</p>
            <div className="flex gap-2">{BOOK_COLORS.map(cc => <button key={cc} onClick={() => setColor(cc)} style={{ background: cc, width: 22, height: 22, borderRadius: "50%", border: color === cc ? "2px solid #fff" : "2px solid transparent", outline: color === cc ? `2px solid ${cc}` : "none" }} />)}</div>
          </div>
          <input type="text" placeholder="Categoria (ex: Filosofia)" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
          <textarea rows={2} placeholder="Notas..." value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="flex-1 py-2 bg-gold text-apex-bg rounded-lg text-[11px] font-medium hover:bg-amber-500 transition-colors">Salvar livro</button>
        <button onClick={onCancel} className="px-4 border border-apex-border text-apex-muted rounded-lg text-[11px] hover:border-apex-border2 transition-colors">Cancelar</button>
      </div>
    </motion.div>
  );
}
