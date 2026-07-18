"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, Lightbulb, Plus, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";
import { isoDate } from "@/lib/productivity/date";
import { createInboxItem, saveTask } from "@/lib/productivity/service";

export type { InboxItem } from "@/lib/productivity/types";

type CaptureType = "task" | "idea";

const TYPES = [
  { id: "task" as const, label: "Tarefa", Icon: CheckSquare, placeholder: "O que precisa ser feito?" },
  { id: "idea" as const, label: "Ideia", Icon: Lightbulb, placeholder: "Capture antes de esquecer..." },
];

export default function QuickCapture() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CaptureType>("task");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = TYPES.find((item) => item.id === type)!;

  function close() {
    setOpen(false);
    setText("");
    setSaved(false);
    setError("");
  }

  async function save() {
    const content = text.trim();
    if (!content || !user || saving) return;
    const now = new Date();
    setSaving(true); setError("");
    try {
      if (type === "task") await saveTask(user.id, { id: null, name: content, time: "", frequency: { type: "once" }, date: isoDate(now), notes: "" });
      else await createInboxItem(user.id, "idea", content);
      setSaved(true); setText(""); window.dispatchEvent(new CustomEvent("apex-productivity-changed")); window.setTimeout(close, 550);
    } catch { setError("Não foi possível salvar agora. Verifique sua conexão."); }
    finally { setSaving(false); }
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

              <div className="mb-4 grid grid-cols-2 gap-2">
                {TYPES.map(({ id, label, Icon }) => {
                  const active = type === id;
                  return <button key={id} onClick={() => setType(id)} className={clsx("flex min-h-12 items-center justify-center gap-2 rounded-control border text-[11px] font-semibold transition-colors", active ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface text-ink-muted")}><Icon size={15} /> {label}</button>;
                })}
              </div>

              <textarea autoFocus rows={4} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") save(); }} placeholder={selected.placeholder} className="min-h-[124px] w-full resize-none rounded-card border border-line bg-surface p-4 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-line-accent" />
              {error && <p className="mt-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error}</p>}
              <button onClick={() => void save()} disabled={!text.trim() || !user || saving} className="apex-button-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Salvando..." : saved ? "Salvo" : `Salvar em ${selected.label}`}</button>
              <p className="mt-2 text-center text-[9px] text-ink-faint">Ctrl/⌘ + Enter para salvar</p>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
