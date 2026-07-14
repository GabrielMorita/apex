"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckSquare, Lightbulb, Plus, X } from "lucide-react";
import clsx from "clsx";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { defaultTasks, type DiaryEntry, type Task } from "@/data/extraData";

export interface InboxItem {
  id: string;
  type: "note" | "idea";
  content: string;
  createdAt: string;
  archived?: boolean;
}

type CaptureType = "task" | "idea" | "diary";

const TYPES = [
  { id: "task" as const, label: "Tarefa", Icon: CheckSquare, placeholder: "O que precisa ser feito?" },
  { id: "idea" as const, label: "Ideia", Icon: Lightbulb, placeholder: "Capture antes de esquecer..." },
  { id: "diary" as const, label: "Diário", Icon: BookOpen, placeholder: "O que está passando pela sua cabeça?" },
];

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CaptureType>("task");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [, setTasks] = useLocalStorage<Task[]>("apex-tasks", defaultTasks);
  const [, setInbox] = useLocalStorage<InboxItem[]>("apex-inbox", []);
  const [, setDiary] = useLocalStorage<DiaryEntry[]>("apex-diary-entries", []);
  const selected = TYPES.find((item) => item.id === type)!;

  function close() {
    setOpen(false);
    setText("");
    setSaved(false);
  }

  function save() {
    const content = text.trim();
    if (!content) return;
    const now = new Date();
    const id = `${type}-${now.getTime()}`;
    const today = now.toISOString().split("T")[0];

    if (type === "task") {
      setTasks((previous) => [...previous, { id, name: content, frequency: { type: "once" }, status: "pending", date: today }]);
    } else if (type === "idea") {
      setInbox((previous) => [{ id, type: "idea", content, createdAt: now.toISOString() }, ...previous]);
    } else {
      setDiary((previous) => [{ id, date: today, content }, ...previous]);
    }

    setSaved(true);
    setText("");
    window.setTimeout(close, 550);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Captura rápida" className="fixed bottom-[88px] right-4 z-40 flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-3.5 text-ink-inverse shadow-gold transition-transform active:scale-95 lg:bottom-6 lg:right-6 lg:h-11 lg:px-4">
        <Plus size={19} strokeWidth={2.6} />
        <span className="hidden text-[12px] font-bold lg:inline">Capturar</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button aria-label="Fechar captura" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
            <motion.section initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 34 }} className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[28px] border border-line bg-surface-overlay p-4 pb-[calc(22px+env(safe-area-inset-bottom))] shadow-float sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel sm:p-5">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <div><p className="apex-kicker mb-2">Caixa de entrada</p><h2 className="text-[18px] font-bold tracking-[-.03em] text-ink">Captura rápida</h2><p className="mt-1 text-[11px] text-ink-muted">Registre agora. Organize depois.</p></div>
                <button onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted"><X size={17} /></button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {TYPES.map(({ id, label, Icon }) => {
                  const active = type === id;
                  return <button key={id} onClick={() => setType(id)} className={clsx("flex min-h-12 items-center justify-center gap-2 rounded-control border text-[11px] font-semibold transition-colors", active ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface text-ink-muted")}><Icon size={15} /> {label}</button>;
                })}
              </div>

              <textarea autoFocus rows={4} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") save(); }} placeholder={selected.placeholder} className="min-h-[124px] w-full resize-none rounded-card border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-line-accent" />
              <button onClick={save} disabled={!text.trim()} className="apex-button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40">{saved ? "Salvo" : `Salvar em ${selected.label}`}</button>
              <p className="mt-2 text-center text-[9px] text-ink-faint">Ctrl/⌘ + Enter para salvar</p>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
