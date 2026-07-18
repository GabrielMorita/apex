"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleUserRound, Smile } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { navigateTo } from "@/lib/navigationEvents";
import { clearDayMood, loadDayMood, saveDayMood } from "@/lib/productivity/service";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import { isoDate } from "@/lib/productivity/date";
import NotificationBell from "@/components/notifications/NotificationBell";

const MOODS = [
  { emoji: "😔", label: "Difícil" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "🙂", label: "Ok" },
  { emoji: "😊", label: "Bom" },
  { emoji: "🤩", label: "Ótimo" },
];

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { user } = useAuth();
  const [longDate, setLongDate] = useState("");
  const [shortDate, setShortDate] = useState("");
  const [today, setToday] = useState("");
  const [mood, setMoodValue] = useState<number | undefined>();
  const [moodError, setMoodError] = useState("");
  const [savingMood, setSavingMood] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const date = new Date();
    const long = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setLongDate(long.charAt(0).toUpperCase() + long.slice(1));
    setShortDate(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""));
    setToday(isoDate(date));
  }, []);

  useEffect(() => {
    if (!user || !today) return;
    let active = true;
    setMoodError("");
    void loadDayMood(user.id, today)
      .then((value) => { if (active) setMoodValue(value ?? undefined); })
      .catch((error) => { if (active) setMoodError(friendlyProductivityError(error)); });
    return () => { active = false; };
  }, [today, user]);

  async function setMood(value: number) {
    if (!user || !today || savingMood) return;
    const previous = mood;
    setMoodValue(value); setMoodError(""); setSavingMood(true);
    try {
      await saveDayMood(user.id, today, value);
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
      setOpen(false);
    } catch (error) {
      setMoodValue(previous);
      setMoodError(friendlyProductivityError(error));
    } finally {
      setSavingMood(false);
    }
  }

  async function clearMood() {
    if (!user || !today || savingMood) return;
    const previous = mood;
    setMoodValue(undefined); setMoodError(""); setSavingMood(true);
    try {
      await clearDayMood(user.id, today);
      setOpen(false);
    } catch (error) {
      setMoodValue(previous);
      setMoodError(friendlyProductivityError(error));
    } finally {
      setSavingMood(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas-glass backdrop-blur-xl lg:static lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-9 lg:py-6">
        <div className="min-w-0">
          <p className="apex-kicker mb-2 hidden sm:block">Seu sistema pessoal</p>
          <h1 className="truncate text-[21px] font-bold tracking-[-0.035em] text-ink sm:text-[24px]">{title}</h1>
          {subtitle && <p className="mt-1 truncate text-[11px] text-ink-muted sm:text-[12px]">{subtitle}</p>}
        </div>

        {longDate && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
            <button
              onClick={() => setOpen((value) => !value)}
              aria-label="Definir humor do dia"
              className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface-raised px-3 text-[11px] font-semibold text-ink-secondary transition-colors hover:border-line-strong hover:text-ink sm:px-4"
            >
              {mood ? <span className="text-[15px] leading-none">{MOODS[mood - 1].emoji}</span> : <Smile size={15} className="text-accent" />}
              <span className="font-stat sm:hidden">{shortDate}</span>
              <span className="hidden sm:inline">{longDate}</span>
            </button>

            <AnimatePresence>
              {open && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label="Fechar" onClick={() => setOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-[248px] rounded-panel border border-line bg-surface-overlay p-4 shadow-float"
                  >
                    <p className="apex-kicker mb-3 text-center">Como você está?</p>
                    <div className="grid grid-cols-5 gap-1">
                      {MOODS.map((item, index) => {
                        const active = mood === index + 1;
                        return (
                          <button
                            key={item.label}
                            onClick={() => void setMood(index + 1)}
                            disabled={savingMood || !user}
                            title={item.label}
                            aria-label={item.label}
                            className="flex h-10 items-center justify-center rounded-control border text-[19px] transition-transform hover:scale-105"
                            style={{
                              background: active ? "var(--accent-subtle)" : "transparent",
                              borderColor: active ? "var(--border-accent)" : "transparent",
                            }}
                          >
                            {item.emoji}
                          </button>
                        );
                      })}
                    </div>
                    {mood !== undefined && (
                      <button onClick={() => void clearMood()} disabled={savingMood} className="mt-3 w-full min-h-8 text-center text-[10px] font-semibold text-ink-muted hover:text-ink-secondary disabled:opacity-50">
                        Limpar seleção
                      </button>
                    )}
                    {moodError && <p role="alert" className="mt-2 text-center text-[8px] text-red-300">{moodError}</p>}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>
            <NotificationBell />
            <button
              onClick={() => navigateTo("configuracoes")}
              aria-label="Perfil e configurações"
              title="Perfil e configurações"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-raised text-ink-muted transition-colors hover:border-line-strong hover:text-accent"
            >
              <CircleUserRound size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
