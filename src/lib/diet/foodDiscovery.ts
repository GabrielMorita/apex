import type { FoodCatalogItem } from "@/lib/diet/types";

export type FoodCatalogFilter = "all" | "favorites" | "recent";

export function mergeRecentFoodIds(current: string[], used: string[]) {
  return [...new Set([...used, ...current])].slice(0, 30);
}

export function filterAndRankFoods(foods: FoodCatalogItem[], filter: FoodCatalogFilter, favoriteIds: string[], recentIds: string[]) {
  const favorites = new Set(favoriteIds);
  const recentPositions = new Map(recentIds.map((id, index) => [id, index]));
  return foods
    .filter((food) => filter === "favorites" ? favorites.has(food.id) : filter === "recent" ? recentPositions.has(food.id) : true)
    .sort((left, right) => {
      const favoriteDifference = Number(favorites.has(right.id)) - Number(favorites.has(left.id));
      if (favoriteDifference !== 0) return favoriteDifference;
      const leftRecent = recentPositions.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightRecent = recentPositions.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      if (leftRecent !== rightRecent) return leftRecent - rightRecent;
      return left.name_pt.localeCompare(right.name_pt, "pt-BR");
    });
}
