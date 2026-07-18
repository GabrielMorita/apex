"use client";

import { useState } from "react";
import { ChefHat, Database, Layers3 } from "lucide-react";
import CustomFoodManager from "@/components/diet/CustomFoodManager";
import RecipeManager from "@/components/diet/RecipeManager";
import MealTemplateManager from "@/components/diet/MealTemplateManager";
import type { DietPreferences } from "@/lib/diet/types";

type LibrarySection = "foods" | "recipes" | "templates";

const options = [
  { id: "foods" as const, label: "Meus alimentos", description: "Produtos cadastrados por você", icon: Database },
  { id: "recipes" as const, label: "Receitas", description: "Preparações e rendimentos", icon: ChefHat },
  { id: "templates" as const, label: "Modelos", description: "Combinações de refeições", icon: Layers3 },
];

export default function DietFoodLibrary({ userId, preferences, catalogRevision, templateRevision, onCatalogChange, onTemplateChange }: {
  userId: string;
  preferences: DietPreferences;
  catalogRevision: number;
  templateRevision: number;
  onCatalogChange: () => void;
  onTemplateChange: () => void;
}) {
  const [section, setSection] = useState<LibrarySection>("foods");

  return (
    <div className="space-y-4">
      <section className="apex-card p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Seções de alimentos">
          {options.map(({ id, label, description, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)} className={`flex min-h-16 items-center gap-3 rounded-card border p-3 text-left transition ${section === id ? "border-line-accent bg-accent-subtle text-accent" : "border-line bg-surface/50 text-ink-muted hover:bg-surface-hover hover:text-ink"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${section === id ? "bg-accent/10" : "bg-surface-raised"}`}><Icon size={15} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold">{label}</span><span className="mt-1 block text-[8px] leading-snug opacity-70">{description}</span></span></button>)}
        </div>
      </section>

      {section === "foods" && <CustomFoodManager userId={userId} currentPattern={preferences.dietary_pattern} onCatalogChange={onCatalogChange} />}
      {section === "recipes" && <RecipeManager userId={userId} preferences={preferences} catalogRevision={catalogRevision} onCatalogChange={onCatalogChange} />}
      {section === "templates" && <MealTemplateManager userId={userId} revision={templateRevision} onChange={onTemplateChange} />}
    </div>
  );
}
