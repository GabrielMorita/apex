"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Layers3, LoaderCircle, Trash2 } from "lucide-react";
import { archiveMealTemplate, loadMealTemplates } from "@/lib/diet/service";
import type { DietMealTemplate } from "@/lib/diet/types";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : JSON.stringify(error).toLowerCase();
  if (message.includes("diet_meal_templates") || message.includes("archive_diet_meal_template")) return "A migration v0.23.0 de modelos de refeição ainda não foi executada no Supabase.";
  if (message.includes("fetch") || message.includes("network")) return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente.";
  return "Não foi possível carregar os modelos agora.";
}

export default function MealTemplateManager({ userId, revision, onChange }: { userId: string; revision: number; onChange: () => void }) {
  const [templates, setTemplates] = useState<DietMealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void loadMealTemplates(userId)
      .then((loaded) => { if (active) setTemplates(loaded); })
      .catch((loadError: unknown) => { if (active) setError(friendlyError(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, userId]);

  async function archive(template: DietMealTemplate) {
    if (!window.confirm(`Arquivar o modelo “${template.name_pt}”?`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await archiveMealTemplate(template.id);
      setTemplates((current) => current.filter((candidate) => candidate.id !== template.id));
      setMessage("Modelo arquivado.");
      onChange();
    } catch (archiveError) {
      setError(friendlyError(archiveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="apex-card p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><Layers3 size={17} /></span><div><p className="text-[13px] font-semibold text-ink">Modelos de refeições</p><p className="mt-1 max-w-lg text-[10px] leading-relaxed text-ink-muted">Salve uma combinação no editor do plano e reutilize-a em qualquer semana. Os modelos ficam privados na sua conta.</p></div></div>

      {loading && <div className="mt-4 flex items-center gap-2 rounded-control border border-line p-3 text-[9px] text-ink-muted"><LoaderCircle size={13} className="animate-spin text-accent" />Carregando modelos...</div>}
      {!loading && error && <div className="mt-4 flex items-start gap-2 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-300"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</div>}
      {message && <p className="mt-4 rounded-control border border-emerald-300/20 bg-emerald-300/5 p-3 text-[9px] text-emerald-200">{message}</p>}

      {!loading && !error && templates.length === 0 && <div className="mt-4 rounded-card border border-dashed border-line p-5 text-center"><p className="text-[10px] font-semibold text-ink-secondary">Nenhum modelo salvo</p><p className="mt-1 text-[8px] text-ink-muted">Abra uma refeição do plano, clique em Editar e use “Salvar como modelo”.</p></div>}
      {templates.length > 0 && <div className="mt-4 grid gap-2 lg:grid-cols-2">{templates.map((template) => <article key={template.id} className="rounded-card border border-line bg-surface/60 p-3"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-[11px] font-semibold text-ink-secondary">{template.name_pt}</p><span className="rounded-full border border-line px-2 py-0.5 text-[7px] font-semibold uppercase text-ink-faint">Modelo</span></div><p className="mt-1 text-[8px] text-ink-muted">{template.item_count} {template.item_count === 1 ? "item" : "itens"} · {Math.round(template.calories)} kcal</p><p className="mt-2 font-stat text-[8px] text-ink-faint">P {Math.round(template.protein_g)} g · C {Math.round(template.carbs_g)} g · G {Math.round(template.fat_g)} g</p><p className="mt-1 truncate text-[8px] text-ink-faint">{template.items.map((item) => item.food_name_snapshot).join(" · ")}</p></div><button type="button" disabled={saving} onClick={() => void archive(template)} aria-label={`Arquivar ${template.name_pt}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:border-red-400/30 hover:bg-red-400/5 hover:text-red-300 disabled:opacity-40"><Trash2 size={12} /></button></div></article>)}</div>}
      <p className="mt-4 text-[8px] leading-relaxed text-ink-faint">Ao aplicar um modelo, os valores são recalculados com a composição atual dos alimentos e receitas disponíveis.</p>
    </section>
  );
}

