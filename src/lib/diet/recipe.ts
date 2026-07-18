import { nutrientFromFood, sumNutrients } from "@/lib/diet/generator";
import type { DietRecipe, DietRecipeInput, FoodCatalogItem, FoodCategory, NutrientTotals } from "@/lib/diet/types";

export interface RecipeIngredientDraft {
  foodId: string;
  grams: string;
}

export interface RecipeFormValues {
  namePt: string;
  category: FoodCategory;
  servings: string;
  yieldGrams: string;
  preparationMinutes: string;
  instructions: string;
  items: RecipeIngredientDraft[];
}

export type RecipeFormErrors = Partial<Record<"namePt" | "servings" | "yieldGrams" | "preparationMinutes" | "items" | "form", string>>;

export function emptyRecipeForm(): RecipeFormValues {
  return {
    namePt: "",
    category: "grain",
    servings: "4",
    yieldGrams: "",
    preparationMinutes: "30",
    instructions: "",
    items: [],
  };
}

export function recipeToForm(recipe: DietRecipe): RecipeFormValues {
  return {
    namePt: recipe.name_pt,
    category: recipe.category,
    servings: String(recipe.servings),
    yieldGrams: String(recipe.yield_grams),
    preparationMinutes: String(recipe.preparation_minutes),
    instructions: recipe.instructions,
    items: recipe.items.map((item) => ({ foodId: item.food_id, grams: String(item.grams) })),
  };
}

export function recipeIngredientGrams(items: RecipeIngredientDraft[]) {
  return Math.round(items.reduce((total, item) => total + (Number(item.grams.replace(",", ".")) || 0), 0) * 10) / 10;
}

export function calculateRecipePreview(items: RecipeIngredientDraft[], catalog: FoodCatalogItem[]) {
  const foods = new Map(catalog.map((food) => [food.id, food]));
  const nutrients = items.map((item) => {
    const food = foods.get(item.foodId);
    const grams = Number(item.grams.replace(",", "."));
    return food && Number.isFinite(grams) ? nutrientFromFood(food, grams) : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  });
  const totals = sumNutrients(nutrients);
  const fiber_g = Math.round(items.reduce((total, item) => {
    const food = foods.get(item.foodId);
    const grams = Number(item.grams.replace(",", "."));
    return total + (food && Number.isFinite(grams) ? food.fiber_g * grams / 100 : 0);
  }, 0) * 10) / 10;
  return { ...totals, fiber_g };
}

export function recipePerServing(totals: NutrientTotals, servings: number): NutrientTotals {
  const divisor = Number.isFinite(servings) && servings > 0 ? servings : 1;
  return {
    calories: Math.round(totals.calories / divisor * 10) / 10,
    protein_g: Math.round(totals.protein_g / divisor * 10) / 10,
    carbs_g: Math.round(totals.carbs_g / divisor * 10) / 10,
    fat_g: Math.round(totals.fat_g / divisor * 10) / 10,
  };
}

function numeric(value: string) {
  return Number(value.trim().replace(",", "."));
}

export function validateRecipeForm(values: RecipeFormValues, catalog: FoodCatalogItem[]): { input?: DietRecipeInput; errors: RecipeFormErrors } {
  const errors: RecipeFormErrors = {};
  const name = values.namePt.trim();
  const servings = numeric(values.servings);
  const yieldGrams = numeric(values.yieldGrams);
  const preparationMinutes = numeric(values.preparationMinutes || "0");
  if (name.length < 2 || name.length > 80) errors.namePt = "Use um nome entre 2 e 80 caracteres.";
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) errors.servings = "Use entre 1 e 100 porções.";
  if (!Number.isFinite(yieldGrams) || yieldGrams < 1 || yieldGrams > 10000) errors.yieldGrams = "Informe um rendimento final entre 1 g e 10.000 g.";
  if (!Number.isInteger(preparationMinutes) || preparationMinutes < 0 || preparationMinutes > 1440) errors.preparationMinutes = "Use um tempo inteiro entre 0 e 1.440 minutos.";
  if (values.instructions.length > 5000) errors.form = "O modo de preparo deve ter no máximo 5.000 caracteres.";
  const foodIds = new Set(catalog.filter((food) => !food.recipe_id).map((food) => food.id));
  if (values.items.length < 2 || values.items.length > 30) errors.items = "Use entre 2 e 30 ingredientes.";
  if (new Set(values.items.map((item) => item.foodId)).size !== values.items.length) errors.items = "Não repita o mesmo ingrediente.";
  const parsedItems = values.items.map((item) => ({ food_id: item.foodId, grams: numeric(item.grams) }));
  if (parsedItems.some((item) => !foodIds.has(item.food_id) || !Number.isFinite(item.grams) || item.grams < 0.1 || item.grams > 10000)) errors.items = "Revise os ingredientes e use quantidades entre 0,1 g e 10.000 g.";
  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      name_pt: name,
      category: values.category,
      servings,
      yield_grams: yieldGrams,
      preparation_minutes: preparationMinutes,
      instructions: values.instructions.trim(),
      items: parsedItems,
    },
  };
}
