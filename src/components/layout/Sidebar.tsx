"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import clsx from "clsx";
import BrandMark from "@/components/layout/BrandMark";
import { NAVIGATION_GROUPS } from "@/components/layout/navigation";

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
  streakDias: number;
}

export default function Sidebar({ activePage, onNavigate, streakDias }: Props) {
  const cycle = streakDias % 7;
  const atMilestone = streakDias > 0 && cycle === 0;
  const pct = atMilestone ? 100 : (cycle / 7) * 100;
  const remaining = atMilestone ? 0 : 7 - cycle;

  return (
    <aside className="hidden h-screen w-[236px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="border-b border-line px-5 py-5">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="apex-kicker mb-2 px-3">{group.section}</p>
            <div className="space-y-1">
              {group.items.map(({ id, label, Icon }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => onNavigate(id)}
                    className={clsx(
                      "relative flex min-h-10 w-full items-center gap-3 rounded-control px-3 text-left transition-colors",
                      active
                        ? "bg-accent-subtle text-ink"
                        : "text-ink-muted hover:bg-surface-hover hover:text-ink-secondary",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="desktop-active"
                        className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-accent"
                      />
                    )}
                    <Icon size={16} className={active ? "text-accent" : undefined} strokeWidth={active ? 2.25 : 1.75} />
                    <span className="text-[12px] font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-card border border-line bg-surface-raised p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-control border border-line-accent bg-accent-subtle text-accent">
              <Flame size={15} fill="currentColor" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink-muted">Consistência</p>
              <p className="mt-0.5 text-[11px] text-ink-secondary">sequência atual</p>
            </div>
          </div>
          <p className="font-stat text-[22px] font-medium text-ink">{streakDias}</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [.22, .61, .36, 1] }}
            className="h-full rounded-full bg-accent"
          />
        </div>
        <p className="mt-2 text-[9px] text-ink-muted">
          {atMilestone ? "Marco semanal concluído" : `${remaining} dia${remaining === 1 ? "" : "s"} para o próximo marco`}
        </p>
      </div>
    </aside>
  );
}
