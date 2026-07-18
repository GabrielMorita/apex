"use client";

import { useMemo, useState } from "react";
import { History, LoaderCircle, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import { isAllowed, sumNutrients } from "@/lib/diet/generator";
import { addConsumedFood, setConsumedItemGrams } from "@/lib/diet/consumption";
import { filterAndRankFoods, type FoodCatalogFilter } from "@/lib/diet/foodDiscovery";
import type { DietConsumptionEntry, DietConsumptionItem, DietPreferences, FoodCatalogItem } from "@/lib/diet/types";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function ConsumptionEditor({ entry, catalog, preferences, favoriteIds, recentFoodIds, favoriteSaving, onToggleFavorite, saving, saveError, onSave, onClose }: {
  entry: DietConsumptionEntry;
  catalog: FoodCatalogItem[];
  preferences: DietPreferences;
  favoriteIds: string[];
  recentFoodIds: string[];
  favoriteSaving: string | null;
  onToggleFavorite: (foodId: string) => void;
  saving: boolean;
  saveError?: string;
  onSave: (items: DietConsumptionItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DietConsumptionItem[]>(entry.items_snapshot);
  const [search, setSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(false);
  const [filter, setFilter] = useState<FoodCatalogFilter>("all");
  const [error, setError] = useState("");
  const totals = sumNutrients(items);
  const allowedCatalog = useMemo(() => catalog.filter((food) => isAllowed(food, preferences)), [catalog, preferences]);
  const candidates = useMemo(() => filterAndRankFoods(allowedCatalog, filter, favoriteIds, recentFoodIds)
    .filter((food) => normalize(food.name_pt).includes(normalize(search)))
    .slice(0, 30), [allowedCatalog, favoriteIds, filter, recentFoodIds, search]);
  const favoriteCount = allowedCatalog.filter((food) => favoriteIds.includes(food.id)).length;
  const recentCount = allowedCatalog.filter((food) => recentFoodIds.includes(food.id)).length;

  function updateGrams(index: number, value: string) {
    const grams = Number(value);
    setItems((current) => setConsumedItemGrams(current, index, grams, catalog));
  }

  function addFood(food: FoodCatalogItem) {
    setItems((current) => addConsumedFood(current, food));
    setSearch("");
    setShowCatalog(false);
    setError("");
  }

  function submit() {
    if (items.length === 0) return setError("Mantenha pelo menos um alimento ou marque a refeição como pendente.");
    if (items.some((item) => !Number.isFinite(item.grams) || item.grams < 1 || item.grams > 1000)) return setError("Use quantidades entre 1 g e 1.000 g.");
    setError("");
    onSave(items);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="consumption-editor-title" onMouseDown={(event) => { if (!saving && event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[92vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-raised shadow-2xl sm:max-w-2xl sm:rounded-panel">
        <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
          <div><p className="apex-kicker">Consumo realizado</p><h3 id="consumption-editor-title" className="mt-2 text-[16px] font-semibold text-ink">Editar {entry.meal_name.toLowerCase()}</h3><p className="mt-1 text-[10px] text-ink-muted">Ajuste o que foi realmente consumido sem alterar a refeição planejada.</p></div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"><X size={15} /></button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-5">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={`${item.food_id}-${item.item_order}`} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-[11px] font-semibold text-ink-secondary">{item.food_name}</p>{item.origin === "extra" && <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2 py-0.5 text-[7px] font-semibold uppercase text-amber-200">Extra</span>}</div><p className="mt-1 text-[8px] text-ink-faint">{Math.round(item.calories)} kcal · P {Math.round(item.protein_g)} g · C {Math.round(item.carbs_g)} g · G {Math.round(item.fat_g)} g</p></div>
                <label className="shrink-0"><span className="sr-only">Quantidade de {item.food_name} em gramas</span><span className="flex items-center rounded-control border border-line bg-surface-raised"><input type="number" min="1" max="1000" step="1" value={Number.isFinite(item.grams) ? item.grams : ""} onChange={(event) => updateGrams(index, event.target.value)} className="h-9 w-20 bg-transparent px-2 text-right font-stat text-[11px] font-semibold text-ink outline-none" /><span className="pr-2 text-[8px] text-ink-faint">g</span></span></label>
                <button type="button" disabled={saving} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover ${item.food_name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:border-red-400/30 hover:bg-red-400/5 hover:text-red-300 disabled:opacity-40"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          {!showCatalog ? <button type="button" disabled={saving} onClick={() => setShowCatalog(true)} className="apex-button-secondary mt-3 w-full"><Plus size={14} />Adicionar alimento extra</button> : (
            <div className="mt-3 rounded-card border border-line bg-surface/60 p-3">
              <div className="flex items-center gap-2"><label className="relative block flex-1"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no catálogo..." className="apex-input min-h-10 pl-9 text-[11px]" /></label><button type="button" onClick={() => { setShowCatalog(false); setSearch(""); }} className="flex h-10 w-10 items-center justify-center rounded-control border border-line text-ink-muted"><X size={13} /></button></div>
              <div className="mt-2 flex gap-2 overflow-x-auto"><CatalogFilter active={filter === "all"} onClick={() => setFilter("all")} label="Todos" /><CatalogFilter active={filter === "favorites"} onClick={() => setFilter("favorites")} label={`Favoritos (${favoriteCount})`} Icon={Star} /><CatalogFilter active={filter === "recent"} onClick={() => setFilter("recent")} label={`Recentes (${recentCount})`} Icon={History} /></div>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {candidates.map((food) => <article key={food.id} className="flex items-center gap-1 rounded-control hover:bg-surface-hover"><button type="button" onClick={() => addFood(food)} className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left text-[10px] text-ink-secondary hover:text-ink"><span className="flex min-w-0 items-center gap-2"><span className="truncate">{food.name_pt}</span>{food.source_type === "custom" && <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[6px] font-semibold uppercase ${food.recipe_id ? "border-amber-300/25 bg-amber-300/5 text-amber-200" : "border-line text-ink-faint"}`}>{food.recipe_id ? "Receita" : "Pessoal"}</span>}</span><span className="shrink-0 text-[8px] text-ink-faint">{Math.round(food.serving_grams)} g · {Math.round(food.calories * food.serving_grams / 100)} kcal</span></button><button type="button" disabled={favoriteSaving === food.id} onClick={() => onToggleFavorite(food.id)} aria-label={favoriteIds.includes(food.id) ? `Remover ${food.name_pt} dos favoritos` : `Favoritar ${food.name_pt}`} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control border disabled:opacity-40 ${favoriteIds.includes(food.id) ? "border-amber-300/30 bg-amber-300/5 text-accent" : "border-line text-ink-faint hover:text-accent"}`}><Star size={11} fill={favoriteIds.includes(food.id) ? "currentColor" : "none"} /></button></article>)}
                {candidates.length === 0 && <p className="p-3 text-center text-[9px] text-ink-muted">Nenhum alimento compatível encontrado.</p>}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Total label="Energia" value={totals.calories} unit="kcal" />
            <Total label="Proteína" value={totals.protein_g} unit="g" />
            <Total label="Carboidratos" value={totals.carbs_g} unit="g" />
            <Total label="Gorduras" value={totals.fat_g} unit="g" />
          </div>
          {(error || saveError) && <p className="mt-3 rounded-control border border-red-400/20 bg-red-400/5 p-3 text-[9px] text-red-300">{error || saveError}</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line p-4 sm:flex-row sm:justify-end">
          <button type="button" disabled={saving} onClick={onClose} className="apex-button-secondary disabled:opacity-40">Cancelar</button>
          <button type="button" disabled={saving} onClick={submit} className="apex-button-primary disabled:opacity-50">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}Salvar consumo real</button>
        </div>
      </div>
    </div>
  );
}

function Total({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className="rounded-control border border-line bg-surface p-2.5"><p className="text-[7px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p><p className="mt-1 font-stat text-[11px] font-semibold text-ink">{Math.round(value)} <span className="text-[8px] font-normal text-ink-muted">{unit}</span></p></div>;
}

function CatalogFilter({ active, onClick, label, Icon }: { active: boolean; onClick: () => void; label: string; Icon?: typeof Star }) {
  return <button type="button" onClick={onClick} className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[8px] font-semibold ${active ? "border-line-accent bg-accent-subtle text-accent" : "border-line text-ink-muted"}`}>{Icon && <Icon size={10} />}{label}</button>;
}
