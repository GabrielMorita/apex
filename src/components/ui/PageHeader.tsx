"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";

const MOODS = [
  { e: "😔", l: "Difícil" },
  { e: "😐", l: "Neutro" },
  { e: "🙂", l: "Ok" },
  { e: "😊", l: "Bom" },
  { e: "🤩", l: "Ótimo" },
];

interface PageHeaderProps { title: string; subtitle?: string; }

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const [dateStr, setDateStr] = useState("");
  const [today, setToday]     = useState("");
  const [dayMoods, setDayMoods] = useLocalStorage<Record<string, number>>("apex-day-moods", {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = new Date();
    const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    setDateStr(s.charAt(0).toUpperCase() + s.slice(1));
    setToday(d.toISOString().split("T")[0]);
  }, []);

  const mood = today ? dayMoods[today] : undefined;

  function setMood(n: number) { setDayMoods(p => ({ ...p, [today]: n })); setOpen(false); }
  function clearMood() { setDayMoods(p => { const c = { ...p }; delete c[today]; return c; }); setOpen(false); }

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-apex-border"
      style={{ background: "linear-gradient(180deg, rgba(255,247,235,0.018), transparent)" }}>
      <div>
        <h1 className="text-[18px] font-semibold text-apex-white tracking-tight">{title}</h1>
        <div className="h-[2px] w-9 rounded-full mt-1.5 mb-1" style={{ background: "linear-gradient(90deg,#e3ad52,rgba(227,173,82,0))" }} />
        {subtitle && <p className="text-[11px] text-apex-muted">{subtitle}</p>}
      </div>

      {dateStr && (
        <div className="relative">
          <button onClick={() => setOpen(o => !o)} aria-label="Definir humor do dia" title="Definir humor do dia"
            className="flex items-center gap-2 text-[10px] text-apex-muted surface-card px-3.5 py-2 rounded-full font-stat hover:border-apex-border2 transition-colors">
            {mood ? (
              <span style={{ fontSize: 13, lineHeight: 1 }}>{MOODS[mood - 1].e}</span>
            ) : (
              <Smile size={12} className="text-gold" />
            )}
            {dateStr}
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-2 z-50 surface-raised rounded-2xl p-3" style={{ minWidth: 226 }}>
                  <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-2.5 text-center">Como foi seu dia?</p>
                  <div className="flex items-center justify-center gap-1">
                    {MOODS.map((m, i) => {
                      const active = mood === i + 1;
                      return (
                        <button key={i} onClick={() => setMood(i + 1)} title={m.l} aria-label={m.l}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                          style={{ background: active ? "rgba(227,173,82,0.16)" : "transparent", border: active ? "1px solid #e3ad52" : "1px solid transparent", fontSize: 18 }}>
                          {m.e}
                        </button>
                      );
                    })}
                  </div>
                  {mood !== undefined && (
                    <button onClick={clearMood} className="w-full text-center text-[9px] text-apex-faint hover:text-apex-muted transition-colors mt-2.5">limpar</button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
