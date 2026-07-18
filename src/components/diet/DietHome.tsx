"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Database, LoaderCircle, RefreshCw, Settings2, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import type { DietState, NutritionTargets } from "@/lib/diet/types";
import { recalculateNutritionTargets } from "@/lib/diet/service";
import WeeklyPlan from "@/components/diet/WeeklyPlan";
import DietFoodLibrary from "@/components/diet/DietFoodLibrary";

type DietSection = "plano" | "alimentos" | "compras" | "ajustes";

const patternLabels = { omnivore: "Onívoro", vegetarian: "Vegetariano", vegan: "Vegano", pescatarian: "Pescetariano" };
const budgetLabels = { economical: "Econômico", moderate: "Moderado", flexible: "Flexível" };
const sections = [
  { id: "plano" as const, label: "Plano", icon: CalendarDays },
  { id: "alimentos" as const, label: "Alimentos", icon: Database },
  { id: "compras" as const, label: "Compras", icon: ShoppingBasket },
  { id: "ajustes" as const, label: "Ajustes", icon: Settings2 },
];

function sectionFromUrl(): DietSection {
  if (typeof window === "undefined") return "plano";
  const value = new URLSearchParams(window.location.search).get("secao");
  return sections.some((section) => section.id === value) ? value as DietSection : "plano";
}

export default function DietHome({ state, onEdit, onTargetsChange }: { state: DietState; onEdit: () => void; onTargetsChange: (targets: NutritionTargets) => void }) {
  const [section, setSection] = useState<DietSection>("plano");
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [templateRevision, setTemplateRevision] = useState(0);
  const targets = state.targets!;
  const preferences = state.preferences!;

  useEffect(() => {
    const syncFromUrl = () => setSection(sectionFromUrl());
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function selectSection(next: DietSection) {
    if (next === section) return;
    setSection(next);
    const url = new URL(window.location.href);
    if (next === "plano") url.searchParams.delete("secao");
    else url.searchParams.set("secao", next);
    window.history.pushState({}, "", url);
  }

  async function recalculate() {
    if (targets.source === "manual" && !window.confirm("Isso substituirá seus ajustes manuais pela estimativa atual do Apex. Continuar?")) return;
    setRecalculating(true);
    setMessage("");
    try {
      onTargetsChange(await recalculateNutritionTargets(state));
      setMessage("Estimativa recalculada com os dados atuais do Perfil.");
    } catch {
      setMessage("Não foi possível recalcular agora. Verifique sua conexão e tente novamente.");
    } finally {
      setRecalculating(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <nav className="sticky top-0 z-30 grid grid-cols-4 gap-1 rounded-card border border-line bg-surface-raised/95 p-1 shadow-xl shadow-black/10 backdrop-blur" role="tablist" aria-label="Seções da Dieta">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => selectSection(id)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-control px-2 text-[9px] font-semibold transition sm:text-[10px] ${section === id ? "bg-accent-subtle text-accent" : "text-ink-muted hover:bg-surface-hover hover:text-ink"}`}><Icon size={13} /><span>{label}</span></button>)}
      </nav>

      <div className={section === "plano" || section === "compras" ? "block" : "hidden"}>
        <WeeklyPlan state={state} catalogRevision={catalogRevision} templateRevision={templateRevision} view={section === "compras" ? "shopping" : "plan"} onOpenPlan={() => selectSection("plano")} onTemplateChange={() => setTemplateRevision((current) => current + 1)} />
      </div>

      {section === "alimentos" && <DietFoodLibrary userId={state.profile.id} preferences={preferences} catalogRevision={catalogRevision} templateRevision={templateRevision} onCatalogChange={() => setCatalogRevision((current) => current + 1)} onTemplateChange={() => setTemplateRevision((current) => current + 1)} />}

      {section === "ajustes" && <div className="space-y-4">
        <section className="apex-card-emphasis overflow-hidden p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2"><p className="apex-kicker">Metas diárias</p><span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-amber-200">Provisórias</span>{targets.source === "manual" && <span className="rounded-full border border-line px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-ink-muted">Ajustadas por você</span>}</div>
              <h2 className="text-[18px] font-semibold text-ink">Sua base nutricional está salva</h2>
              <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-ink-muted">A estimativa é uma referência inicial para adultos saudáveis, não uma prescrição clínica. Você pode editá-la a qualquer momento.</p>
            </div>
            <button type="button" onClick={onEdit} className="apex-button-secondary shrink-0"><Settings2 size={15} />Editar configuração</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TargetCard value={Math.round(Number(targets.calories))} unit="kcal" label="Energia" />
            <TargetCard value={Math.round(Number(targets.protein_g))} unit="g" label="Proteína" />
            <TargetCard value={Math.round(Number(targets.carbs_g))} unit="g" label="Carboidratos" />
            <TargetCard value={Math.round(Number(targets.fat_g))} unit="g" label="Gorduras" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-subtle pt-3">
            <button type="button" disabled={recalculating} onClick={() => void recalculate()} className="flex min-h-9 items-center gap-2 text-[10px] font-semibold text-accent disabled:opacity-50">{recalculating ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />}Recalcular com o Perfil</button>
            {message && <span className="text-[9px] text-ink-muted">{message}</span>}
          </div>
        </section>

        <section className="apex-card p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><CheckCircle2 size={17} /></span><div><p className="text-[13px] font-semibold text-ink">Preferências configuradas</p><p className="mt-1 text-[10px] leading-relaxed text-ink-muted">Essas regras serão aplicadas à geração de novos planos semanais.</p></div></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Info icon={Utensils} label="Rotina" value={`${preferences.meal_count} refeições por dia`} />
            <Info icon={Clock3} label="Preparo" value={`Até ${preferences.cooking_time_minutes} min`} />
            <Info icon={Sparkles} label="Estilo" value={`${patternLabels[preferences.dietary_pattern]} · ${budgetLabels[preferences.budget_level]}`} />
          </div>
          {(preferences.allergies.length > 0 || preferences.restrictions.length > 0) && <div className="mt-3 flex items-start gap-2 rounded-card border border-amber-300/20 bg-amber-300/5 p-3"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" /><p className="text-[10px] leading-relaxed text-amber-100">Restrições salvas: {[...preferences.allergies, ...preferences.restrictions].join(", ")}.</p></div>}
        </section>
      </div>}
    </div>
  );
}

function TargetCard({ value, unit, label }: { value: number; unit: string; label: string }) {
  return <div className="rounded-card border border-line bg-surface/60 p-3"><p className="font-stat text-[17px] font-semibold text-accent">{value}<span className="ml-1 text-[9px] font-normal text-ink-muted">{unit}</span></p><p className="mt-1 text-[9px] text-ink-muted">{label}</p></div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Utensils; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-card border border-line bg-surface-raised p-3"><Icon size={14} className="shrink-0 text-accent" /><div><p className="text-[8px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 text-[10px] font-semibold text-ink-secondary">{value}</p></div></div>;
}
