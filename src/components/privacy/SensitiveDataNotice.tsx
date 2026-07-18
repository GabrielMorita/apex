"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function SensitiveDataNotice({ area }: { area: "Dieta" | "Treino" }) {
  return <div className="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" /><div><p className="text-[9px] font-semibold text-ink-secondary">Privacidade em {area}</p><p className="mt-1 text-[8px] leading-relaxed text-ink-muted">Informações corporais, alimentares e de treino podem ser dados pessoais sensíveis. Elas ficam vinculadas à sua conta e são usadas para personalização solicitada por você. <Link href="/dados-saude" className="font-semibold text-accent hover:text-accent-strong">Entenda e gerencie seu consentimento</Link>.</p></div></div>;
}
