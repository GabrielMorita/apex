"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import LucideIcon from "@/components/ui/LucideIcon";
import { CHECKIN_FIELDS } from "@/data/extraData";
import { isoDate } from "@/lib/productivity/date";
import type { CheckinEntry } from "@/lib/productivity/types";

interface Props {
  onComplete: (entry: CheckinEntry) => void;
  onSkip: () => void;
  date?: string;
}

export default function CheckinModal({ onComplete, onSkip, date }: Props) {
  const today = date ?? isoDate(new Date());
  const [values, setValues] = useState<Record<string, number>>({ energia: 3, sono: 3, humor: 3, estresse: 2, dorMuscular: 1 });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-line bg-surface-overlay p-5 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-float sm:rounded-panel sm:p-6"
      >
        <div className="mb-6 text-center">
          <p className="apex-kicker mb-2 text-accent">Check-in diário</p>
          <p className="text-[18px] font-bold tracking-[-0.025em] text-ink">Como você está hoje?</p>
          <p className="mt-1.5 text-[11px] text-ink-muted">Um minuto para ajustar o seu dia à sua condição real.</p>
        </div>

        <div className="mb-6 space-y-5">
          {CHECKIN_FIELDS.map((field) => (
            <div key={field.key}>
              <div className="mb-2.5 flex items-center gap-2">
                <LucideIcon name={field.lucideIcon} size={14} color="var(--accent-primary)" />
                <span className="text-[12px] font-semibold text-ink">{field.label}</span>
                <span className="ml-auto font-stat text-[10px] text-accent">{values[field.key]}/5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((number) => {
                  const active = values[field.key] >= number;
                  return (
                    <button
                      key={number}
                      onClick={() => setValues((previous) => ({ ...previous, [field.key]: number }))}
                      aria-label={`${field.label}: ${number} de 5`}
                      className="h-9 rounded-control border transition-colors"
                      style={{
                        background: active ? "var(--accent-subtle)" : "var(--surface-base)",
                        borderColor: active ? "var(--border-accent)" : "var(--border-default)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onComplete({
              date: today,
              energia: values.energia,
              sono: values.sono,
              humor: values.humor,
              estresse: values.estresse,
              dorMuscular: values.dorMuscular,
            })}
            className="apex-button-primary flex-1"
          >
            Salvar check-in
          </button>
          <button onClick={onSkip} className="apex-button-secondary sm:px-5">Pular hoje</button>
        </div>
      </motion.div>
    </div>
  );
}
