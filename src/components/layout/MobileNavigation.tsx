"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { MOBILE_BOTTOM_ITEMS } from "@/components/layout/navigation";

interface MobileNavigationProps {
  activeDestination: string;
  onNavigate: (page: string) => void;
}

export default function MobileNavigation({ activeDestination, onNavigate }: MobileNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3 lg:hidden"
    >
      <div className="mx-auto max-w-xl rounded-[28px] border border-line bg-canvas-glass px-2 py-2 shadow-float backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-end gap-1">
          {MOBILE_BOTTOM_ITEMS.map(({ id, label, shortLabel, Icon }) => {
            const active = activeDestination === id;
            const isPrimary = id === "dashboard";

            if (isPrimary) {
              return (
                <div key={id} className="relative flex justify-center">
                  <button
                    onClick={() => onNavigate(id)}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "relative -mt-6 flex min-h-[64px] min-w-[88px] flex-col items-center justify-center gap-1 rounded-full border px-5 pb-3 pt-2.5 text-[10px] font-semibold transition-all",
                      active ? "text-accent" : "text-ink-secondary hover:text-ink",
                    )}
                    style={{
                      background: active ? "var(--accent-subtle)" : "linear-gradient(180deg, rgba(255,255,255,.025), transparent 42%), var(--surface-raised)",
                      borderColor: active ? "var(--border-accent)" : "var(--border-default)",
                      boxShadow: active ? "var(--shadow-accent)" : "var(--shadow-card)",
                    }}
                  >
                    {active && <motion.span layoutId="mobile-dock-active" className="absolute inset-x-5 top-0 h-px rounded-full bg-accent" />}
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink-inverse shadow-[0_10px_22px_-12px_rgba(227,173,82,.7)]">
                      <Icon size={18} strokeWidth={2.35} />
                    </span>
                    <span>{shortLabel ?? label}</span>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-semibold transition-colors",
                  active ? "text-accent" : "text-ink-muted hover:text-ink-secondary",
                )}
                style={{ background: active ? "rgba(227,173,82,.08)" : "transparent" }}
              >
                {active && <motion.span layoutId="mobile-secondary-active" className="absolute inset-x-3 top-0 h-px rounded-full bg-accent" />}
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                <span>{shortLabel ?? label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
