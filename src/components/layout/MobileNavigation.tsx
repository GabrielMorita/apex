"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Grid2X2, X } from "lucide-react";
import clsx from "clsx";
import BrandMark from "@/components/layout/BrandMark";
import {
  ALL_NAVIGATION_ITEMS,
  MOBILE_PRIMARY_IDS,
  NAVIGATION_GROUPS,
} from "@/components/layout/navigation";

interface MobileNavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function MobileNavigation({ activePage, onNavigate }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const primary = MOBILE_PRIMARY_IDS.map((id) => ALL_NAVIGATION_ITEMS.find((item) => item.id === id)!).filter(Boolean);
  const activeIsMore = !MOBILE_PRIMARY_IDS.includes(activePage);

  function navigate(page: string) {
    onNavigate(page);
    setOpen(false);
  }

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas-glass px-2 pt-2 backdrop-blur-xl lg:hidden safe-bottom"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {primary.map(({ id, label, shortLabel, Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={clsx(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-control px-1 text-[10px] font-semibold transition-colors",
                  active ? "text-accent" : "text-ink-muted",
                )}
              >
                {active && <motion.span layoutId="mobile-active" className="absolute inset-x-2 top-0 h-px rounded-full bg-accent" />}
                <Icon size={20} strokeWidth={active ? 2.35 : 1.75} />
                <span>{shortLabel ?? label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setOpen(true)}
            className={clsx(
              "relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-control px-1 text-[10px] font-semibold transition-colors",
              activeIsMore ? "text-accent" : "text-ink-muted",
            )}
          >
            {activeIsMore && <motion.span layoutId="mobile-active" className="absolute inset-x-2 top-0 h-px rounded-full bg-accent" />}
            <Grid2X2 size={20} strokeWidth={activeIsMore ? 2.35 : 1.75} />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Fechar menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.section
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[60] max-h-[82dvh] overflow-y-auto rounded-t-[28px] border border-line bg-surface-overlay px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 shadow-float lg:hidden"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line-strong" />
              <div className="mb-6 flex items-center justify-between">
                <BrandMark />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {NAVIGATION_GROUPS.map((group) => (
                  <div key={group.section}>
                    <p className="apex-kicker mb-3 px-1">{group.section}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map(({ id, label, Icon }) => {
                        const active = activePage === id;
                        return (
                          <button
                            key={id}
                            onClick={() => navigate(id)}
                            className={clsx(
                              "flex min-h-[64px] items-center gap-3 rounded-card border px-3 text-left transition-colors",
                              active
                                ? "border-line-accent bg-accent-subtle text-ink"
                                : "border-line bg-surface-raised text-ink-secondary",
                            )}
                          >
                            <span className={clsx("flex h-9 w-9 items-center justify-center rounded-control", active ? "bg-accent text-ink-inverse" : "bg-surface text-ink-muted")}>
                              <Icon size={17} strokeWidth={2} />
                            </span>
                            <span className="text-[12px] font-semibold leading-tight">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
