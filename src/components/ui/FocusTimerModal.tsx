"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { friendlyProductivityError } from "@/lib/productivity/errors";
import { loadFocusSessions, recordFocusSession } from "@/lib/productivity/service";
import { isoDate } from "@/lib/productivity/date";

type TimerMode = "25" | "45";
const MODES: Record<TimerMode, number> = { "25": 25, "45": 45 };
const pad = (value: number) => String(value).padStart(2, "0");

function durationToMode(duration?: string): TimerMode {
  const minutes = Number(duration?.match(/\d+/)?.[0] ?? 25);
  return minutes >= 35 ? "45" : "25";
}

export default function FocusTimerModal({
  task,
  habitId,
  duration,
  onComplete,
  onClose,
}: {
  task: string;
  habitId?: string;
  duration?: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const initialMode = durationToMode(duration);
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [seconds, setSeconds] = useState(MODES[initialMode] * 60);
  const [running, setRunning] = useState(false);
  const [todaySessionCount, setTodaySessionCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = MODES[mode] * 60;
  const percentage = Math.min(100, ((total - seconds) / total) * 100);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!user) return;
    const today = isoDate(new Date());
    void loadFocusSessions(user.id, today, today)
      .then((sessions) => setTodaySessionCount(sessions.length))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running || seconds !== 0) return;
    setRunning(false);
    void finish(MODES[mode]);
    // finish is intentionally triggered only when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running]);

  function changeMode(nextMode: TimerMode) {
    setMode(nextMode);
    setRunning(false);
    setSeconds(MODES[nextMode] * 60);
  }

  function reset() {
    setRunning(false);
    setSeconds(MODES[mode] * 60);
  }

  async function finish(minutesOverride?: number) {
    if (!user || saving) {
      if (!user) setError("Sua sessão não está disponível. Entre novamente.");
      return;
    }
    const elapsed = minutesOverride ?? Math.max(1, Math.round((total - seconds) / 60));
    setSaving(true);
    setError("");
    try {
      await recordFocusSession(user.id, { habitId: habitId ?? null, date: isoDate(new Date()), minutes: elapsed, task });
      setTodaySessionCount((count) => count + 1);
      window.dispatchEvent(new CustomEvent("apex-productivity-changed"));
      onComplete();
      onClose();
    } catch (saveError) {
      setError(friendlyProductivityError(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-t-[28px] border border-line bg-surface-overlay p-5 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-float sm:rounded-panel sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="apex-kicker mb-2">Sessão de foco</p>
            <h2 className="text-[18px] font-bold tracking-[-.03em] text-ink">{task}</h2>
            <p className="mt-1 text-[10px] text-ink-muted">O hábito só é concluído ao finalizar a sessão.</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted"><X size={16} /></button>
        </div>

        <div className="mb-5 flex justify-center gap-2">
          {(["25", "45"] as TimerMode[]).map((item) => (
            <button key={item} onClick={() => changeMode(item)} className={`min-h-10 rounded-control border px-4 text-[11px] font-semibold ${mode === item ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface text-ink-muted"}`}>
              {item} minutos
            </button>
          ))}
        </div>

        <div className="relative mx-auto mb-6 flex h-[190px] w-[190px] items-center justify-center">
          <svg width="190" height="190" viewBox="0 0 190 190" aria-label={`${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`}>
            <circle cx="95" cy="95" r={radius} fill="none" stroke="var(--border-default)" strokeWidth="11" />
            <circle cx="95" cy="95" r={radius} fill="none" stroke="var(--accent-primary)" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage / 100)} transform="rotate(-90 95 95)" />
          </svg>
          <div className="absolute text-center">
            <p className="font-stat text-[38px] font-medium leading-none text-ink">{pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[.16em] text-ink-muted">foco profundo</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button onClick={() => setRunning((value) => !value)} className="apex-button-primary">
            {running ? <><Pause size={15} /> Pausar</> : <><Play size={15} fill="currentColor" /> {seconds === total ? "Iniciar" : "Continuar"}</>}
          </button>
          <button onClick={reset} aria-label="Reiniciar" className="apex-button-secondary px-4"><RotateCcw size={15} /></button>
        </div>
        <button disabled={saving} onClick={() => void finish()} className="apex-button-secondary mt-2 w-full disabled:opacity-50"><Check size={15} /> {saving ? "Salvando sessão..." : "Concluir sessão agora"}</button>
        {error && <p role="alert" className="mt-3 text-center text-[9px] text-red-300">{error}</p>}
        <p className="mt-4 text-center text-[9px] text-ink-faint">{todaySessionCount} sessão(ões) registradas hoje</p>
      </motion.section>
    </div>
  );
}
