import type { InputHTMLAttributes } from "react";

export default function AuthField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-ink-muted">{label}</span>
      <input
        {...props}
        className="min-h-12 w-full rounded-control border border-line bg-surface px-3.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-line-accent disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}
