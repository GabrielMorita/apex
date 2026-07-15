"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export type WorkspaceTab<T extends string> = {
  id: T;
  label: string;
  description?: string;
  Icon: LucideIcon;
};

export default function WorkspaceTabs<T extends string>({
  tabs,
  active,
  onChange,
  compact = false,
  layout = "scroll",
}: {
  tabs: WorkspaceTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  compact?: boolean;
  layout?: "scroll" | "grid";
}) {
  return (
    <div
      className={clsx(
        layout === "grid"
          ? "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
          : "no-scrollbar flex gap-2 overflow-x-auto pb-1",
      )}
      role="tablist"
      aria-label="Seções"
    >
      {tabs.map(({ id, label, description, Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={clsx(
              "flex items-center gap-2 rounded-control border text-left transition-colors",
              layout === "grid" ? "w-full" : "shrink-0",
              compact ? "min-h-10 px-3" : "min-h-12 px-3.5",
              selected
                ? "border-line-accent bg-accent-subtle text-ink"
                : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink-secondary",
            )}
          >
            <Icon size={compact ? 14 : 16} className={selected ? "text-accent" : undefined} />
            <span>
              <span className="block text-[11px] font-semibold">{label}</span>
              {!compact && description && <span className="mt-0.5 hidden text-[8px] text-ink-muted sm:block">{description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
