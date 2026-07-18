"use client";

import { useMemo, useState } from "react";
import { ArrowRight, History, Search, Star, X } from "lucide-react";
import { equivalentReplacementGrams, nutrientFromFood } from "@/lib/diet/generator";
import { filterAndRankFoods, type FoodCatalogFilter } from "@/lib/diet/foodDiscovery";
import type { DietMealItem, FoodCatalogItem } from "@/lib/diet/types";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function IngredientPicker({
  current,
  alternatives,
  favoriteIds,
  recentFoodIds,
  favoriteSaving,
  favoriteError,
  onToggleFavorite,
  onSelect,
  onClose,
}: {
  current: DietMealItem;
  alternatives: FoodCatalogItem[];
  favoriteIds: string[];
  recentFoodIds: string[];
  favoriteSaving: string | null;
  favoriteError?: string;
  onToggleFavorite: (foodId: string) => void;
  onSelect: (food: FoodCatalogItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FoodCatalogFilter>("all");
  const filtered = useMemo(() => filterAndRankFoods(alternatives, filter, favoriteIds, recentFoodIds).filter((food) => normalize(food.name_pt).includes(normalize(search))), [alternatives, favoriteIds, filter, recentFoodIds, search]);
  const favoriteCount = alternatives.filter((food) => favoriteIds.includes(food.id)).length;
  const recentCount = alternatives.filter((food) => recentFoodIds.includes(food.id)).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="ingredient-picker-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[88vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-raised shadow-2xl sm:max-w-xl sm:rounded-panel">
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div><p className="apex-kicker">Trocar ingrediente</p><h3 id="ingredient-picker-title" className="mt-2 text-[16px] font-semibold text-ink">Escolha uma alternativa</h3><p className="mt-1 text-[10px] text-ink-muted">No lugar de <strong className="text-ink-secondary">{current.food_name}</strong>. A porção será ajustada para manter energia aproximada.</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink"><X size={15} /></button>
        </div>

        <div className="border-b border-line-subtle p-4">
          <label className="relative block"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alimento..." className="apex-input pl-9" /></label>
          <div className="mt-3 flex gap-2 overflow-x-auto"><FilterButton active={filter === "all"} onClick={() => setFilter("all")} label={`Todos (${alternatives.length})`} /><FilterButton active={filter === "favorites"} onClick={() => setFilter("favorites")} label={`Favoritos (${favoriteCount})`} Icon={Star} /><FilterButton active={filter === "recent"} onClick={() => setFilter("recent")} label={`Recentes (${recentCount})`} Icon={History} /></div>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-3 sm:p-4">
          {filtered.length === 0 && <div className="rounded-card border border-line p-5 text-center text-[10px] text-ink-muted">Nenhuma alternativa compatível encontrada.</div>}
          <div className="space-y-2">
            {filtered.map((food) => {
              const grams = equivalentReplacementGrams(current, food);
              const nutrients = nutrientFromFood(food, grams);
              return (
                <article key={food.id} className="group flex items-center gap-1 rounded-card border border-line bg-surface p-1 transition hover:border-amber-300/30 hover:bg-surface-hover"><button type="button" onClick={() => onSelect(food)} className="flex min-w-0 flex-1 items-center justify-between gap-3 p-2 text-left"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-[11px] font-semibold text-ink-secondary group-hover:text-ink">{food.name_pt}</p>{food.source_type === "custom" && <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[6px] font-semibold uppercase ${food.recipe_id ? "border-amber-300/25 bg-amber-300/5 text-amber-200" : "border-line text-ink-faint"}`}>{food.recipe_id ? "Receita" : "Pessoal"}</span>}</div><p className="mt-1 text-[8px] text-ink-faint">Porção estimada: {grams} g · {Math.round(nutrients.calories)} kcal</p><p className="mt-1 text-[8px] text-ink-muted">P {Math.round(nutrients.protein_g)} g · C {Math.round(nutrients.carbs_g)} g · G {Math.round(nutrients.fat_g)} g</p></div><ArrowRight size={14} className="shrink-0 text-accent" /></button><button type="button" disabled={favoriteSaving === food.id} onClick={() => onToggleFavorite(food.id)} aria-label={favoriteIds.includes(food.id) ? `Remover ${food.name_pt} dos favoritos` : `Favoritar ${food.name_pt}`} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control border disabled:opacity-40 ${favoriteIds.includes(food.id) ? "border-amber-300/30 bg-amber-300/5 text-accent" : "border-line text-ink-faint hover:text-accent"}`}><Star size={13} fill={favoriteIds.includes(food.id) ? "currentColor" : "none"} /></button></article>
              );
            })}
          </div>
        </div>

        <div className={`border-t border-line-subtle px-4 py-3 text-center text-[8px] leading-relaxed ${favoriteError ? "text-red-300" : "text-ink-faint"}`}>{favoriteError || "A lista respeita o padrão alimentar, alergias, restrições e alimentos rejeitados salvos na Dieta."}</div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, Icon }: { active: boolean; onClick: () => void; label: string; Icon?: typeof Star }) {
  return <button type="button" onClick={onClick} className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[8px] font-semibold ${active ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{Icon && <Icon size={10} />}{label}</button>;
}
