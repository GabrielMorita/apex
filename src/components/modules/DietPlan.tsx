"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProfileDependencyNotice from "@/components/profile/ProfileDependencyNotice";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  defaultDietGoals,
  defaultDietPresets,
  defaultFoodBank,
  sumMealMacros,
  type DietDayPreset,
  type FoodItem,
  type Meal,
  type MealItem,
} from "@/data/extraData";

const DAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function dateToISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function addDays(value: string, amount: number) {
  const date = isoToDate(value);
  date.setDate(date.getDate() + amount);
  return dateToISO(date);
}

function getWeek(value: string) {
  const selected = isoToDate(value);
  const mondayOffset = (selected.getDay() + 6) % 7;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      iso: dateToISO(date),
      weekday: DAY_LABELS[date.getDay()],
      day: date.getDate(),
    };
  });
}

function formatDate(value: string) {
  const label = isoToDate(value).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatPortion(item: MealItem, food?: FoodItem) {
  if (!food) return item.quantity === 1 ? "1 porção" : `${trimNumber(item.quantity)} porções`;
  const match = food.portion.match(/^([\d.,]+)\s*(.*)$/);
  if (match) {
    const number = Number(match[1].replace(",", "."));
    if (Number.isFinite(number)) {
      return `${trimNumber(number * item.quantity)}${match[2] ? ` ${match[2]}` : ""}`;
    }
  }
  if (item.quantity === 1) return food.portion;
  return `${trimNumber(item.quantity)} × ${food.portion}`;
}

function mealMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getSuggestedMealId(meals: Meal[], selectedDate: string) {
  if (!meals.length) return "";
  if (selectedDate !== dateToISO(new Date())) return meals[0].id;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return meals.find((meal) => mealMinutes(meal.time) >= currentMinutes - 45)?.id ?? meals[meals.length - 1].id;
}

function buildMealItem(food: FoodItem, quantity: number): MealItem {
  return {
    foodId: food.id,
    name: food.name,
    quantity,
    calories: +(food.calories * quantity).toFixed(1),
    protein: +(food.protein * quantity).toFixed(1),
    carbs: +(food.carbs * quantity).toFixed(1),
    fat: +(food.fat * quantity).toFixed(1),
  };
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" aria-label="Fechar" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 max-h-[86vh] w-full overflow-hidden rounded-t-panel border border-line bg-surface-overlay shadow-float sm:max-w-lg sm:rounded-panel"
      >
        {children}
      </motion.div>
    </div>
  );
}

function AddFoodSheet({
  foodBank,
  onAdd,
  onClose,
}: {
  foodBank: FoodItem[];
  onAdd: (item: MealItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const filtered = foodBank.filter((food) => food.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold text-ink">Adicionar alimento</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">Escolha o alimento e ajuste a quantidade.</p>
        </div>
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar no banco de alimentos"
            className="apex-input pl-10"
          />
        </div>

        <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
          {filtered.map((food) => {
            const quantity = quantities[food.id] ?? 1;
            return (
              <div key={food.id} className="flex items-center gap-3 rounded-card border border-line bg-surface-raised p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{food.name}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">{food.portion} · {food.calories} kcal</p>
                </div>
                <input
                  aria-label={`Quantidade de ${food.name}`}
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={quantity}
                  onChange={(event) => setQuantities((current) => ({ ...current, [food.id]: Math.max(0.25, Number(event.target.value) || 1) }))}
                  className="h-10 w-14 rounded-control border border-line bg-surface px-2 text-center text-[12px] text-ink outline-none focus:border-line-accent"
                />
                <button
                  onClick={() => {
                    onAdd(buildMealItem(food, quantity));
                    onClose();
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent text-ink-inverse shadow-gold"
                  aria-label={`Adicionar ${food.name}`}
                >
                  <Plus size={17} />
                </button>
              </div>
            );
          })}
          {!filtered.length && <p className="py-8 text-center text-[12px] text-ink-muted">Nenhum alimento encontrado.</p>}
        </div>
      </div>
    </Overlay>
  );
}

function SubstituteSheet({
  original,
  foodBank,
  onReplace,
  onClose,
}: {
  original: MealItem;
  foodBank: FoodItem[];
  onReplace: (item: MealItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const candidates = useMemo(() => {
    return foodBank
      .filter((food) => food.id !== original.foodId && food.name.toLowerCase().includes(search.toLowerCase()))
      .map((food) => {
        const quantity = food.calories > 0 ? Math.max(0.25, Math.min(5, original.calories / food.calories)) : 1;
        const replacement = buildMealItem(food, +quantity.toFixed(2));
        const calorieDifference = Math.abs(replacement.calories - original.calories);
        const proteinDifference = Math.abs(replacement.protein - original.protein) * 2;
        return { food, replacement, score: calorieDifference + proteinDifference };
      })
      .sort((a, b) => a.score - b.score);
  }, [foodBank, original, search]);

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="min-w-0 pr-4">
          <p className="text-[15px] font-semibold text-ink">Substituir alimento</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-muted">Alternativas próximas de {Math.round(original.calories)} kcal</p>
        </div>
        <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-hover hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar substituição"
            className="apex-input pl-10"
          />
        </div>

        <div className="mb-3 rounded-card border border-line-accent bg-accent-subtle px-4 py-3 text-[11px] leading-relaxed text-ink-secondary">
          As quantidades são ajustadas automaticamente para manter valor calórico semelhante.
        </div>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {candidates.map(({ food, replacement }) => (
            <button
              key={food.id}
              onClick={() => {
                onReplace(replacement);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-card border border-line bg-surface-raised p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent">
                <ArrowLeftRight size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{food.name}</span>
                <span className="mt-1 block text-[11px] text-ink-muted">{formatPortion(replacement, food)}</span>
              </span>
              <span className="font-stat text-[11px] text-ink-secondary">{Math.round(replacement.calories)} kcal</span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

function NutritionSummary({ planned, goal }: {
  planned: ReturnType<typeof sumMealMacros>;
  goal: typeof defaultDietGoals;
}) {
  const [open, setOpen] = useState(false);
  const items = [
    { label: "Energia", value: `${Math.round(planned.calories)} kcal`, target: `${goal.calories} meta` },
    { label: "Proteína", value: `${Math.round(planned.protein)}g`, target: `${goal.protein}g meta` },
    { label: "Carboidrato", value: `${Math.round(planned.carbs)}g`, target: `${goal.carbs}g meta` },
    { label: "Gordura", value: `${Math.round(planned.fat)}g`, target: `${goal.fat}g meta` },
  ];

  return (
    <div className="apex-card overflow-hidden">
      <button onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center justify-between px-4 text-left sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-subtle text-accent"><Flame size={16} /></span>
          <div>
            <p className="text-[13px] font-semibold text-ink">Resumo nutricional do plano</p>
            <p className="text-[10px] text-ink-muted">{Math.round(planned.calories)} kcal planejadas</p>
          </div>
        </div>
        <ChevronDown size={17} className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {items.map((item) => (
                <div key={item.label} className="bg-surface-raised px-4 py-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-muted">{item.label}</p>
                  <p className="font-stat mt-2 text-[17px] font-medium text-ink">{item.value}</p>
                  <p className="mt-1 text-[9px] text-ink-faint">{item.target}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DietaPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => dateToISO(new Date()));
  const [expandedMealIds, setExpandedMealIds] = useState<string[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [substituting, setSubstituting] = useState<{ mealId: string; itemIndex: number; item: MealItem } | null>(null);

  const [foodBank] = useLocalStorage<FoodItem[]>("apex-food-bank", defaultFoodBank);
  const [dietGoals] = useLocalStorage("apex-diet-goals", defaultDietGoals);
  const [presets] = useLocalStorage<DietDayPreset[]>("apex-diet-presets", defaultDietPresets);
  const [exceptions, setExceptions] = useLocalStorage<Record<string, Meal[]>>("apex-diet-exceptions", {});
  const [completedMeals, setCompletedMeals] = useLocalStorage<Record<string, boolean>>("apex-diet-done", {});

  useEffect(() => setMounted(true), []);

  const selectedDay = isoToDate(selectedDate).getDay();
  const selectedMeals = useMemo(
    () => exceptions[selectedDate] ?? presets.find((preset) => preset.dow === selectedDay)?.meals ?? [],
    [exceptions, presets, selectedDate, selectedDay],
  );
  const week = useMemo(() => getWeek(selectedDate), [selectedDate]);

  useEffect(() => {
    const suggestedId = getSuggestedMealId(selectedMeals, selectedDate);
    setExpandedMealIds(suggestedId ? [suggestedId] : []);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function completionKey(mealId: string) {
    return `${selectedDate}:${mealId}`;
  }

  function isMealDone(mealId: string) {
    const dated = completedMeals[completionKey(mealId)];
    if (dated !== undefined) return dated;
    return selectedDate === dateToISO(new Date()) ? Boolean(completedMeals[mealId]) : false;
  }

  function toggleMealDone(mealId: string) {
    const key = completionKey(mealId);
    const current = isMealDone(mealId);
    setCompletedMeals((previous) => {
      const next = { ...previous, [key]: !current };
      delete next[mealId];
      return next;
    });
  }

  function updateMeals(updater: (meals: Meal[]) => Meal[]) {
    setExceptions((previous) => ({ ...previous, [selectedDate]: updater(selectedMeals) }));
  }

  function addItem(mealId: string, item: MealItem) {
    updateMeals((meals) => meals.map((meal) => meal.id === mealId ? { ...meal, items: [...meal.items, item] } : meal));
    setExpandedMealIds((current) => current.includes(mealId) ? current : [...current, mealId]);
  }

  function removeItem(mealId: string, itemIndex: number) {
    updateMeals((meals) => meals.map((meal) => meal.id === mealId
      ? { ...meal, items: meal.items.filter((_, index) => index !== itemIndex) }
      : meal));
  }

  function replaceItem(mealId: string, itemIndex: number, replacement: MealItem) {
    updateMeals((meals) => meals.map((meal) => meal.id === mealId
      ? { ...meal, items: meal.items.map((item, index) => index === itemIndex ? replacement : item) }
      : meal));
  }

  function toggleExpanded(mealId: string) {
    setExpandedMealIds((current) => current.includes(mealId)
      ? current.filter((id) => id !== mealId)
      : [...current, mealId]);
  }

  const plannedTotals = selectedMeals.reduce((total, meal) => {
    const macros = sumMealMacros(meal.items);
    return {
      calories: total.calories + macros.calories,
      protein: total.protein + macros.protein,
      carbs: total.carbs + macros.carbs,
      fat: total.fat + macros.fat,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const completedCount = selectedMeals.filter((meal) => isMealDone(meal.id)).length;
  const adherence = selectedMeals.length ? Math.round((completedCount / selectedMeals.length) * 100) : 0;
  const suggestedMealId = getSuggestedMealId(selectedMeals, selectedDate);

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto">
      <PageHeader title="Dieta" subtitle="Seu plano alimentar, refeição por refeição" />

      <div className="apex-page max-w-3xl space-y-4 sm:space-y-5">
        <ProfileDependencyNotice feature="Dieta" />
        <section className="apex-card-emphasis overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} aria-label="Semana anterior" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 text-center">
              <p className="apex-kicker mb-1.5">Plano alimentar</p>
              <p className="truncate text-[14px] font-semibold text-ink sm:text-[16px]">{formatDate(selectedDate)}</p>
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} aria-label="Próxima semana" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-surface-hover hover:text-ink">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 px-3 pb-4 sm:gap-2 sm:px-5">
            {week.map((day) => {
              const active = day.iso === selectedDate;
              const isToday = day.iso === dateToISO(new Date());
              return (
                <button
                  key={day.iso}
                  onClick={() => setSelectedDate(day.iso)}
                  className={`flex min-h-[58px] flex-col items-center justify-center rounded-control border transition-colors ${
                    active
                      ? "border-line-accent bg-accent text-ink-inverse shadow-gold"
                      : "border-transparent bg-surface-raised text-ink-muted hover:border-line hover:text-ink"
                  }`}
                >
                  <span className={`text-[8px] font-bold tracking-[0.12em] ${active ? "text-ink-inverse/70" : "text-ink-faint"}`}>{day.weekday}</span>
                  <span className="font-stat mt-1 text-[15px] font-medium">{day.day}</span>
                  {isToday && <span className={`mt-1 h-1 w-1 rounded-full ${active ? "bg-ink-inverse" : "bg-accent"}`} />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-line bg-surface/55 px-4 py-4 sm:px-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-secondary">
                <CheckCircle2 size={15} className="text-accent" />
                {completedCount} de {selectedMeals.length} refeições registradas
              </div>
              <span className="font-stat text-[12px] font-medium text-accent">{adherence}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
              <motion.div initial={{ width: 0 }} animate={{ width: `${adherence}%` }} className="h-full rounded-full bg-accent" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between px-1 pt-1">
          <div>
            <p className="apex-kicker mb-1.5">Refeições</p>
            <h2 className="apex-section-heading">Plano do dia</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-[10px] font-semibold text-ink-muted">
            <CalendarDays size={13} className="text-accent" />
            {selectedMeals.length} refeições
          </div>
        </div>

        <section className="space-y-2.5">
          {selectedMeals.map((meal) => {
            const expanded = expandedMealIds.includes(meal.id);
            const done = isMealDone(meal.id);
            const isSuggested = meal.id === suggestedMealId && selectedDate === dateToISO(new Date());
            const macros = sumMealMacros(meal.items);

            return (
              <article key={meal.id} className={`apex-card overflow-hidden transition-colors ${done ? "border-line-accent" : ""}`}>
                <button onClick={() => toggleExpanded(meal.id)} className="flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left sm:px-5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${done ? "bg-accent text-ink-inverse" : "bg-accent-subtle text-accent"}`}>
                    {done ? <Check size={19} strokeWidth={3} /> : <Utensils size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-ink">{meal.name}</span>
                      {isSuggested && !done && <span className="rounded-full border border-line-accent bg-accent-subtle px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-accent">Próxima</span>}
                      {done && <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-accent">Registrada</span>}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted">
                      <Clock3 size={12} /> {meal.time} · {meal.items.length} {meal.items.length === 1 ? "alimento" : "alimentos"}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="font-stat block text-[12px] text-ink-secondary">{Math.round(macros.calories)} kcal</span>
                    <span className="mt-1 block text-[9px] text-ink-faint">P {Math.round(macros.protein)}g · C {Math.round(macros.carbs)}g</span>
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border-t border-line">
                        {meal.items.map((item, itemIndex) => {
                          const food = foodBank.find((candidate) => candidate.id === item.foodId);
                          return (
                            <div key={`${item.foodId}-${itemIndex}`} className="group flex items-start gap-3 border-b border-line-subtle px-4 py-4 last:border-b-0 sm:px-5">
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-ink">{item.name}</p>
                                <p className="mt-1 text-[11px] text-ink-secondary">{formatPortion(item, food)}</p>
                                <p className="font-stat mt-1.5 text-[9px] text-ink-faint">{Math.round(item.calories)} kcal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · G {Math.round(item.fat)}g</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  onClick={() => setSubstituting({ mealId: meal.id, itemIndex, item })}
                                  className="flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-[10px] font-semibold text-ink-muted hover:bg-surface-hover hover:text-accent"
                                  aria-label={`Substituir ${item.name}`}
                                >
                                  <ArrowLeftRight size={13} />
                                  <span className="hidden sm:inline">Substituir</span>
                                </button>
                                <button
                                  onClick={() => removeItem(meal.id, itemIndex)}
                                  className="flex h-9 w-9 items-center justify-center rounded-control text-ink-faint hover:bg-surface-hover hover:text-status-error"
                                  aria-label={`Remover ${item.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {!meal.items.length && <p className="px-5 py-8 text-center text-[12px] text-ink-muted">Nenhum alimento nesta refeição.</p>}

                        <div className="grid gap-2 border-t border-line bg-surface/55 p-3 sm:grid-cols-2 sm:p-4">
                          <button
                            onClick={() => setAddingTo(meal.id)}
                            className="apex-button-secondary w-full"
                          >
                            <Plus size={15} /> Adicionar alimento
                          </button>
                          <button
                            onClick={() => toggleMealDone(meal.id)}
                            className={done ? "apex-button-secondary w-full text-accent" : "apex-button-primary w-full"}
                          >
                            {done ? <CheckCircle2 size={16} /> : <Check size={16} />}
                            {done ? "Refeição registrada" : "Registrar refeição"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}

          {!selectedMeals.length && (
            <div className="apex-card flex flex-col items-center px-6 py-12 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-accent-subtle text-accent"><Utensils size={20} /></span>
              <p className="text-[14px] font-semibold text-ink">Nenhuma refeição planejada</p>
              <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-ink-muted">Este dia ainda não possui um plano alimentar configurado.</p>
            </div>
          )}
        </section>

        {selectedMeals.length > 0 && <NutritionSummary planned={plannedTotals} goal={dietGoals} />}
      </div>

      <AnimatePresence>
        {addingTo && (
          <AddFoodSheet
            foodBank={foodBank}
            onAdd={(item) => addItem(addingTo, item)}
            onClose={() => setAddingTo(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {substituting && (
          <SubstituteSheet
            original={substituting.item}
            foodBank={foodBank}
            onReplace={(replacement) => replaceItem(substituting.mealId, substituting.itemIndex, replacement)}
            onClose={() => setSubstituting(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
