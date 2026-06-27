"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProgressRing from "@/components/ui/ProgressRing";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  defaultFoodBank, defaultDietGoals, defaultDietPresets, MICRO_TARGETS,
  sumMealMacros, type FoodItem, type MealItem, type Meal, type DietDayPreset,
} from "@/data/extraData";

function today() { return new Date().toISOString().split("T")[0]; }

// ── Modal de adicionar alimento ───────────────────────────────
function AddFoodModal({ foodBank, onAdd, onClose }: {
  foodBank: FoodItem[]; onAdd: (i: MealItem) => void; onClose: () => void;
}) {
  const [tab, setTab]   = useState<"bank" | "manual">("bank");
  const [search, setSearch] = useState("");
  const [qty, setQty]   = useState<Record<string, number>>({});
  const [mn, setMn]     = useState("");
  const [mc, setMc]     = useState(0);
  const [mp, setMp]     = useState(0);
  const [mca, setMca]   = useState(0);
  const [mf, setMf]     = useState(0);

  const filtered = foodBank.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  function addBank(f: FoodItem) {
    const q = qty[f.id] ?? 1;
    onAdd({ foodId: f.id, name: f.name, quantity: q, calories: +(f.calories * q).toFixed(1), protein: +(f.protein * q).toFixed(1), carbs: +(f.carbs * q).toFixed(1), fat: +(f.fat * q).toFixed(1) });
    onClose();
  }
  function addManual() {
    if (!mn.trim()) return;
    onAdd({ foodId: `m${Date.now()}`, name: mn.trim(), quantity: 1, calories: mc, protein: mp, carbs: mca, fat: mf });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-apex-surface border border-apex-border rounded-2xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-apex-white">Adicionar alimento</p>
          <button onClick={onClose} className="text-apex-faint hover:text-apex-muted"><X size={16} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {(["bank", "manual"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] border transition-colors ${tab === t ? "bg-apex-gold-bg border-gold text-gold" : "border-apex-border text-apex-muted"}`}>
              {t === "bank" ? "Banco de alimentos" : "Item avulso"}
            </button>
          ))}
        </div>

        {tab === "bank" ? (
          <div>
            <input type="text" placeholder="Buscar alimento..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-apex-card border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold mb-3" />
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {filtered.map(f => (
                <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 bg-apex-card border border-apex-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-apex-white truncate">{f.name}</p>
                    <p className="text-[9px] text-apex-faint font-mono">{f.calories}kcal · P{f.protein}g · C{f.carbs}g · G{f.fat}g</p>
                    <p className="text-[9px] text-apex-faint opacity-60">por {f.portion}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input type="number" min={0.25} step={0.25} value={qty[f.id] ?? 1}
                      onChange={e => setQty(p => ({ ...p, [f.id]: +e.target.value }))}
                      className="w-12 bg-apex-surface border border-apex-border rounded px-1.5 py-1 text-[10px] text-apex-white text-center outline-none focus:border-gold" />
                    <button onClick={() => addBank(f)} className="w-7 h-7 bg-gold text-apex-bg rounded-lg flex items-center justify-center hover:bg-amber-500 transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-[11px] text-apex-faint italic px-2 py-3">Nenhum resultado</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <input type="text" placeholder="Nome do alimento" value={mn} onChange={e => setMn(e.target.value)}
              className="w-full bg-apex-card border border-apex-border rounded-lg px-3 py-2 text-[12px] text-apex-white placeholder-apex-faint outline-none focus:border-gold" />
            <div className="grid grid-cols-4 gap-2">
              {[{ l: "Calorias", v: mc, s: setMc }, { l: "Proteína", v: mp, s: setMp }, { l: "Carbo", v: mca, s: setMca }, { l: "Gordura", v: mf, s: setMf }].map(f => (
                <div key={f.l}>
                  <p className="text-[8px] text-apex-faint uppercase mb-1">{f.l}</p>
                  <input type="number" value={f.v} onChange={e => f.s(+e.target.value)}
                    className="w-full bg-apex-card border border-apex-border rounded-lg px-2 py-1.5 text-[11px] text-apex-white outline-none focus:border-gold text-center" />
                </div>
              ))}
            </div>
            <button onClick={addManual}
              className="w-full py-2.5 bg-gold text-apex-bg rounded-xl text-[12px] font-medium hover:bg-amber-500 transition-colors mt-1">
              Adicionar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Barra de macro inline ─────────────────────────────────────
function MacroBar({ label, done, goal, color }: { label: string; done: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((done / goal) * 100, 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-apex-faint uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{Math.round(done)}/{goal}g</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(128,128,128,0.12)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
          className="h-1.5 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

export default function DietaPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [foodBank]  = useLocalStorage<FoodItem[]>("apex-food-bank", defaultFoodBank);
  const [dietGoals] = useLocalStorage("apex-diet-goals", defaultDietGoals);
  const [presets]   = useLocalStorage<DietDayPreset[]>("apex-diet-presets", defaultDietPresets);
  const [exceptions, setExceptions] = useLocalStorage<Record<string, Meal[]>>("apex-diet-exceptions", {});
  const [doneToday, setDoneToday]   = useLocalStorage<Record<string, boolean>>("apex-diet-done", {});
  const [microOpen, setMicroOpen]   = useState(false);
  const [addingTo,  setAddingTo]    = useState<string | null>(null);

  const td  = today();
  const dow = new Date().getDay();
  const todayMeals: Meal[] = exceptions[td] ?? presets.find(p => p.dow === dow)?.meals ?? [];

  function toggleMeal(id: string) { setDoneToday(p => ({ ...p, [id]: !p[id] })); }
  function addItem(mealId: string, item: MealItem) {
    const updated = todayMeals.map(m => m.id === mealId ? { ...m, items: [...m.items, item] } : m);
    setExceptions(p => ({ ...p, [td]: updated }));
  }
  function removeItem(mealId: string, idx: number) {
    const updated = todayMeals.map(m => m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== idx) } : m);
    setExceptions(p => ({ ...p, [td]: updated }));
  }

  // Totais apenas das refeições marcadas como feitas
  const totals = todayMeals.reduce((a, m) => {
    if (!doneToday[m.id]) return a;
    const s = sumMealMacros(m.items);
    return { calories: a.calories + s.calories, protein: a.protein + s.protein, carbs: a.carbs + s.carbs, fat: a.fat + s.fat };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (!mounted) return null;

  const calPct = dietGoals.calories > 0 ? Math.min(Math.round((totals.calories / dietGoals.calories) * 100), 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Dieta" subtitle="Macros e refeições do dia" />
      <div className="px-8 py-6 max-w-2xl space-y-6">

        {/* Painel de macros — anel central + barras */}
        <div className="bg-apex-card border border-apex-border rounded-2xl overflow-hidden">
          {/* Header — calorias */}
          <div className="flex items-center gap-6 px-6 py-5 border-b border-apex-border">
            <ProgressRing done={Math.round(totals.calories)} goal={dietGoals.calories} color="#c9a84c" size={88} stroke={9} label="kcal" />
            <div className="flex-1 space-y-3">
              <MacroBar label="Proteína" done={totals.protein} goal={dietGoals.protein} color="#3B82F6" />
              <MacroBar label="Carboidrato" done={totals.carbs} goal={dietGoals.carbs} color="#10b981" />
              <MacroBar label="Gordura" done={totals.fat} goal={dietGoals.fat} color="#ef4444" />
            </div>
          </div>

          {/* Micronutrientes */}
          <button onClick={() => setMicroOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-apex-surface transition-colors">
            <span className="text-[9px] text-apex-faint tracking-[2px] uppercase">Micronutrientes essenciais</span>
            {microOpen ? <ChevronUp size={12} className="text-apex-faint" /> : <ChevronDown size={12} className="text-apex-faint" />}
          </button>
          <AnimatePresence>
            {microOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-4 gap-3 px-6 pb-4">
                  {MICRO_TARGETS.map(m => (
                    <div key={m.key} className="bg-apex-surface border border-apex-border rounded-xl px-3 py-2 text-center">
                      <p className="text-[9px] text-apex-faint mb-0.5">{m.label}</p>
                      <p className="text-[12px] text-apex-muted font-mono">{m.target}{m.unit}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refeições */}
        <div>
          <p className="text-[9px] text-apex-faint tracking-[2px] uppercase mb-3">
            Refeições de hoje
            <span className="ml-2 text-apex-faint opacity-60 normal-case">— marque ao consumir</span>
          </p>
          <div className="space-y-2">
            {todayMeals.map(meal => {
              const isDone  = doneToday[meal.id] ?? false;
              const macros  = sumMealMacros(meal.items);
              const calPctM = dietGoals.calories > 0 ? Math.round((macros.calories / dietGoals.calories) * 100) : 0;

              return (
                <div key={meal.id}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{ borderColor: isDone ? "#2a1f0a" : "#1e1e1e", background: isDone ? "#18140a" : "#141414" }}>

                  {/* Header da refeição */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => toggleMeal(meal.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0 transition-all"
                      style={{ background: isDone ? "#c9a84c" : "transparent", borderColor: isDone ? "#c9a84c" : "#2a2a2a" }}>
                      {isDone && <Check size={12} color="#080808" strokeWidth={3} />}
                    </button>
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-apex-white">{meal.name}</p>
                      <p className="text-[9px] text-apex-faint font-mono">{meal.time}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[12px] font-mono" style={{ color: isDone ? "#c9a84c" : "#888" }}>{Math.round(macros.calories)}</p>
                      <p className="text-[8px] text-apex-faint">kcal</p>
                    </div>
                    <div className="flex gap-2.5 flex-shrink-0 text-right">
                      {[
                        { v: macros.protein, c: "#3B82F6", l: "P" },
                        { v: macros.carbs,   c: "#10b981", l: "C" },
                        { v: macros.fat,     c: "#ef4444", l: "G" },
                      ].map(m => (
                        <div key={m.l} className="text-center" style={{ minWidth: 28 }}>
                          <p className="text-[10px] font-mono leading-none" style={{ color: m.c }}>{Math.round(m.v)}</p>
                          <p className="text-[7px] text-apex-faint mt-0.5">{m.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itens da refeição */}
                  {meal.items.length > 0 && (
                    <div className="border-t border-[#1e1e1e] px-4 py-2 space-y-1">
                      {meal.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group py-0.5">
                          <span className="text-[10px] text-apex-faint">{item.name}{item.quantity !== 1 ? ` ×${item.quantity}` : ""}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-apex-faint font-mono">{Math.round(item.calories)}kcal</span>
                            <button onClick={() => removeItem(meal.id, idx)}
                              className="opacity-0 group-hover:opacity-100 text-apex-faint hover:text-red-400 transition-opacity">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add button */}
                  <button onClick={() => setAddingTo(meal.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[10px] text-apex-faint hover:text-gold transition-colors border-t border-[#1e1e1e]">
                    <Plus size={11} /> Adicionar alimento
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addingTo && (
          <AddFoodModal
            foodBank={foodBank}
            onAdd={item => addItem(addingTo, item)}
            onClose={() => setAddingTo(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
