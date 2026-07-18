"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, LoaderCircle, Save, type LucideIcon } from "lucide-react";
import React, { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function CollapsibleCard({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: LucideIcon; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-apex-border bg-apex-card">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-apex-surface">
        <Icon size={15} className="shrink-0 text-gold" />
        <span className="flex-1 text-left text-[12px] font-medium text-apex-white">{title}</span>
        {open ? <ChevronUp size={13} className="text-apex-faint" /> : <ChevronDown size={13} className="text-apex-faint" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-apex-border px-5 pb-5 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-medium uppercase tracking-wider text-apex-faint">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-[10px] text-red-300">{error}</span> : hint ? <span className="mt-1.5 block text-[9px] leading-relaxed text-apex-faint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ error, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={`w-full rounded-lg border bg-apex-surface px-3 py-2.5 text-[12px] text-apex-white outline-none transition-colors placeholder:text-apex-faint focus:border-gold ${error ? "border-red-400/70" : "border-apex-border"} ${className}`} {...props} />;
}

export function SelectInput({ error, className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return <select className={`w-full rounded-lg border bg-apex-surface px-3 py-2.5 text-[12px] text-apex-white outline-none transition-colors focus:border-gold ${error ? "border-red-400/70" : "border-apex-border"} ${className}`} {...props}>{children}</select>;
}

export function SaveActions({ status, dirty, errorMessage, successMessage, onSave, onDiscard }: { status: SaveStatus; dirty: boolean; errorMessage?: string; successMessage: string; onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onSave} disabled={!dirty || status === "saving"} className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-[12px] font-medium text-apex-bg transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-45">
          {status === "saving" ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />}
          {status === "saving" ? "Salvando..." : "Salvar alterações"}
        </button>
        {dirty && (
          <button type="button" onClick={onDiscard} disabled={status === "saving"} className="rounded-lg border border-apex-border bg-apex-surface px-4 py-2.5 text-[12px] text-apex-muted transition-colors hover:border-apex-border2 hover:text-apex-white disabled:opacity-50">
            Descartar
          </button>
        )}
      </div>
      {status === "saved" && <div className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={12} /><span className="text-[11px]">{successMessage}</span></div>}
      {status === "error" && <div className="flex items-start gap-1.5 text-red-300"><AlertCircle size={12} className="mt-0.5 shrink-0" /><span className="text-[11px]">{errorMessage ?? "Não foi possível salvar. Tente novamente."}</span></div>}
    </div>
  );
}

export function friendlyProfileError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  if (message.includes("jwt") || message.includes("session") || message.includes("not authenticated")) return "Sua sessão expirou. Entre novamente para salvar as alterações.";
  if (message.includes("bucket") || message.includes("column") || message.includes("record_weight")) return "O banco ainda não possui a estrutura desta versão. Execute a migration v0.10.0 no Supabase.";
  return "Não foi possível salvar as alterações. Tente novamente em instantes.";
}
