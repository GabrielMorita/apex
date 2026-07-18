import type { CustomFoodInput, DietaryPattern, FoodCatalogItem, FoodCategory } from "@/lib/diet/types";

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  grain: "Cereal ou carboidrato",
  vegetable: "Legume ou verdura",
  fruit: "Fruta",
  fat: "Gordura",
  fish: "Peixe",
  meat: "Carne",
  dairy: "Laticínio",
  egg: "Ovo",
  legume: "Leguminosa",
};

export const DIETARY_PATTERN_LABELS: Record<DietaryPattern, string> = {
  omnivore: "Onívoro",
  vegetarian: "Vegetariano",
  vegan: "Vegano",
  pescatarian: "Pescetariano",
};

export interface CustomFoodFormValues {
  namePt: string;
  category: FoodCategory;
  dietaryPatterns: DietaryPattern[];
  allergens: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  servingGrams: string;
  servingLabel: string;
}

export type CustomFoodFormErrors = Partial<Record<keyof CustomFoodFormValues | "form", string>>;

export function emptyCustomFoodForm(pattern: DietaryPattern): CustomFoodFormValues {
  return {
    namePt: "",
    category: "grain",
    dietaryPatterns: [pattern],
    allergens: "",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    fiberG: "0",
    servingGrams: "100",
    servingLabel: "1 porção",
  };
}

export function customFoodToForm(food: FoodCatalogItem): CustomFoodFormValues {
  return {
    namePt: food.name_pt,
    category: food.category,
    dietaryPatterns: food.dietary_patterns,
    allergens: food.allergen_tags.join(", "),
    calories: String(food.calories),
    proteinG: String(food.protein_g),
    carbsG: String(food.carbs_g),
    fatG: String(food.fat_g),
    fiberG: String(food.fiber_g),
    servingGrams: String(food.serving_grams),
    servingLabel: food.serving_label,
  };
}

function numeric(value: string) {
  return Number(value.trim().replace(",", "."));
}

function validateNumber(value: string, label: string, min: number, max: number, required = true) {
  if (!value.trim() && required) return `${label} é obrigatório.`;
  const parsed = numeric(value || "0");
  if (!Number.isFinite(parsed)) return `${label} deve ser um número válido.`;
  if (parsed < min || parsed > max) return `${label} deve ficar entre ${min} e ${max}.`;
  return "";
}

export function validateCustomFood(values: CustomFoodFormValues): { input?: CustomFoodInput; errors: CustomFoodFormErrors } {
  const errors: CustomFoodFormErrors = {};
  const name = values.namePt.trim();
  if (name.length < 2 || name.length > 80) errors.namePt = "Use um nome entre 2 e 80 caracteres.";
  if (values.dietaryPatterns.length === 0) errors.dietaryPatterns = "Selecione pelo menos um padrão alimentar.";
  const numberRules: Array<[keyof CustomFoodFormValues, string, number, number, boolean?]> = [
    ["calories", "Calorias", 0, 1000],
    ["proteinG", "Proteína", 0, 100],
    ["carbsG", "Carboidratos", 0, 100],
    ["fatG", "Gorduras", 0, 100],
    ["fiberG", "Fibras", 0, 100, false],
    ["servingGrams", "Peso da porção", 1, 1000],
  ];
  for (const [key, label, min, max, required] of numberRules) {
    const message = validateNumber(String(values[key]), label, min, max, required ?? true);
    if (message) errors[key] = message;
  }
  if (!values.servingLabel.trim() || values.servingLabel.trim().length > 80) errors.servingLabel = "Informe uma descrição de porção com até 80 caracteres.";
  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      name_pt: name,
      category: values.category,
      dietary_patterns: values.dietaryPatterns,
      allergen_tags: values.allergens.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).slice(0, 20),
      calories: numeric(values.calories),
      protein_g: numeric(values.proteinG),
      carbs_g: numeric(values.carbsG),
      fat_g: numeric(values.fatG),
      fiber_g: numeric(values.fiberG || "0"),
      serving_grams: numeric(values.servingGrams),
      serving_label: values.servingLabel.trim(),
    },
  };
}
