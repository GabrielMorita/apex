import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  emphasis?: boolean;
  interactive?: boolean;
}

export function Card({ emphasis = false, interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        emphasis ? "apex-card-emphasis" : "apex-card",
        interactive && "apex-card-interactive",
        className,
      )}
      {...props}
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        variant === "primary" && "apex-button-primary",
        variant === "secondary" && "apex-button-secondary",
        variant === "ghost" && "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-3 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function IconTile({ Icon, active = false, size = "md" }: { Icon: LucideIcon; active?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-control border",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        active
          ? "border-line-accent bg-accent-subtle text-accent"
          : "border-line-subtle bg-surface text-ink-muted",
      )}
    >
      <Icon size={size === "sm" ? 15 : 18} strokeWidth={active ? 2.2 : 1.8} />
    </span>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="apex-kicker mb-2">{eyebrow}</p>}
        <h2 className="apex-section-heading">{title}</h2>
      </div>
      {action}
    </div>
  );
}
