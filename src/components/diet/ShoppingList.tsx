"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Check, Copy, LoaderCircle, RotateCcw, ShoppingBasket } from "lucide-react";
import { clearShoppingChecks, loadDietRecipes, loadShoppingCheckedIds, setShoppingItemChecked } from "@/lib/diet/service";
import {
  buildShoppingList,
  formatShoppingAmount,
  SHOPPING_GROUP_LABELS,
  SHOPPING_GROUP_ORDER,
  shoppingListText,
} from "@/lib/diet/shopping";
import type { DietRecipe, FoodCatalogItem, WeeklyDietPlan } from "@/lib/diet/types";

function shoppingErrorMessage(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : JSON.stringify(error).toLowerCase();
  if (text.includes("diet_recipes") || text.includes("recipe_id")) return "A migration v0.20.0 de receitas ainda não foi executada; a lista continua disponível sem expandir preparações.";
  if (text.includes("diet_shopping_checks")) return "A migration v0.19.0 da lista de compras ainda não foi executada no Supabase.";
  return "Não foi possível sincronizar a lista de compras. Verifique sua conexão e tente novamente.";
}

export default function ShoppingList({ userId, plan, catalog, catalogRevision = 0, weekNavigation }: { userId: string; plan: WeeklyDietPlan; catalog: FoodCatalogItem[]; catalogRevision?: number; weekNavigation?: ReactNode }) {
  const [recipes, setRecipes] = useState<DietRecipe[]>([]);
  const items = useMemo(() => buildShoppingList(plan, catalog, recipes), [catalog, plan, recipes]);
  const itemIds = useMemo(() => new Set(items.map((item) => item.food_id)), [items]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.allSettled([loadShoppingCheckedIds(userId, plan.week_start), loadDietRecipes(userId, true)])
      .then(([checksResult, recipesResult]) => {
        if (!active) return;
        if (checksResult.status === "fulfilled") setCheckedIds(checksResult.value);
        if (recipesResult.status === "fulfilled") setRecipes(recipesResult.value);
        const failure = checksResult.status === "rejected" ? checksResult.reason : recipesResult.status === "rejected" ? recipesResult.reason : null;
        if (failure) setError(shoppingErrorMessage(failure));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [catalogRevision, plan.week_start, userId]);

  const checkedCount = checkedIds.filter((id) => itemIds.has(id)).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  async function toggleChecked(foodId: string) {
    const checked = !checkedIds.includes(foodId);
    setSavingId(foodId);
    setError("");
    try {
      await setShoppingItemChecked(userId, plan.week_start, foodId, checked);
      setCheckedIds((current) => checked ? [...new Set([...current, foodId])] : current.filter((id) => id !== foodId));
    } catch (saveError) {
      setError(shoppingErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  }

  async function clearChecks() {
    if (checkedCount === 0 || !window.confirm("Desmarcar todos os itens comprados desta semana?")) return;
    setClearing(true);
    setError("");
    try {
      await clearShoppingChecks(userId, plan.week_start);
      setCheckedIds([]);
    } catch (clearError) {
      setError(shoppingErrorMessage(clearError));
    } finally {
      setClearing(false);
    }
  }

  async function copyList() {
    setCopied(false);
    setError("");
    try {
      await navigator.clipboard.writeText(shoppingListText(items, plan.week_start));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar automaticamente. Verifique a permissão da área de transferência do navegador.");
    }
  }

  return (
    <section className="apex-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line-subtle p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent"><ShoppingBasket size={17} /></span>
          <div>
            <p className="apex-kicker">Lista automática</p>
            <h2 className="mt-1.5 text-[15px] font-semibold text-ink">Compras da semana</h2>
            <p className="mt-1 text-[9px] leading-relaxed text-ink-muted">Quantidades somadas a partir dos sete dias do plano. Ao trocar um ingrediente, a lista é atualizada.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            {checkedCount > 0 && <button type="button" disabled={clearing || savingId !== null} onClick={() => void clearChecks()} className="apex-button-secondary min-h-9 px-3 text-[9px] disabled:opacity-40">{clearing ? <LoaderCircle size={12} className="animate-spin" /> : <RotateCcw size={12} />}Limpar marcas</button>}
            <button type="button" disabled={loading || items.length === 0} onClick={() => void copyList()} className="apex-button-secondary min-h-9 px-3 text-[9px] disabled:opacity-40">{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copiada" : "Copiar lista"}</button>
          </div>
          {weekNavigation}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="rounded-card border border-line bg-surface-raised p-3">
          <div className="flex items-center justify-between gap-3 text-[9px]"><span className="font-semibold text-ink-secondary">{loading ? "Sincronizando marcações..." : `${checkedCount} de ${items.length} itens comprados`}</span><span className="font-stat font-semibold text-accent">{progress}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover"><span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div>
        </div>

        {error && <div className="mt-3 flex items-start gap-2 rounded-card border border-red-400/25 bg-red-400/5 p-3 text-[9px] leading-relaxed text-red-200"><AlertCircle size={13} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {SHOPPING_GROUP_ORDER.map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <article key={group} className="overflow-hidden rounded-card border border-line bg-surface/50">
                <div className="flex items-center justify-between border-b border-line-subtle px-3 py-2.5"><h3 className="text-[10px] font-semibold text-ink-secondary">{SHOPPING_GROUP_LABELS[group]}</h3><span className="text-[8px] text-ink-faint">{groupItems.length} {groupItems.length === 1 ? "item" : "itens"}</span></div>
                <div className="divide-y divide-line-subtle">
                  {groupItems.map((item) => {
                    const checked = checkedIds.includes(item.food_id);
                    const saving = savingId === item.food_id;
                    return (
                      <button key={item.food_id} type="button" aria-pressed={checked} disabled={loading || clearing || savingId !== null} onClick={() => void toggleChecked(item.food_id)} className="flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-hover disabled:cursor-wait disabled:opacity-60">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked ? "border-accent bg-accent text-[#17110a]" : "border-line bg-surface-raised text-transparent"}`}>{saving ? <LoaderCircle size={11} className="animate-spin text-ink-muted" /> : <Check size={11} />}</span>
                        <span className="min-w-0 flex-1"><span className={`block truncate text-[10px] font-medium ${checked ? "text-ink-faint line-through" : "text-ink-secondary"}`}>{item.food_name}</span><span className="mt-0.5 block text-[8px] text-ink-faint">Usado em {item.occurrences} {item.occurrences === 1 ? "refeição" : "refeições"}{item.is_custom ? " · alimento pessoal" : ""}</span></span>
                        <span className={`shrink-0 font-stat text-[10px] font-semibold ${checked ? "text-ink-faint line-through" : "text-accent"}`}>{formatShoppingAmount(item.grams)}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        {items.length === 0 && <p className="py-8 text-center text-[10px] text-ink-muted">A lista aparecerá quando houver refeições no plano semanal.</p>}
        <p className="mt-4 text-[8px] leading-relaxed text-ink-faint">As quantidades são uma referência bruta baseada nas porções do plano. Ajustes de rendimento, embalagem e estoque doméstico ficam a seu critério.</p>
      </div>
    </section>
  );
}
