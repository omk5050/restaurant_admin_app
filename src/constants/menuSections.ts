import { Category, MenuSection } from "@/types";

export const MENU_SECTIONS: { id: MenuSection; name: string; icon: string }[] = [
  { id: "restaurant", name: "Restaurant", icon: "🍽️" },
];

const RESTAURANT_CATEGORY_KEYS = new Set(["popular", "main", "rice"]);
const CAFE_CATEGORY_KEYS = new Set(["beverages", "snacks", "desserts"]);
const LEGACY_TOP_LEVEL_IDS = new Set(["cafe", "restaurant"]);

function getCategoryKey(id: string): string {
  return id.split("_")[0].toLowerCase();
}

function getSectionForKey(key: string): MenuSection | null {
  if (RESTAURANT_CATEGORY_KEYS.has(key)) return "restaurant";
  if (CAFE_CATEGORY_KEYS.has(key)) return "cafe";
  return null;
}

export function getCategorySection(category: Category): MenuSection | null {
  const key = getCategoryKey(category.id);
  if (LEGACY_TOP_LEVEL_IDS.has(key) || LEGACY_TOP_LEVEL_IDS.has(category.id)) return null;
  if (category.section === "restaurant" || category.section === "cafe") return category.section;

  const sectionFromKey = getSectionForKey(key);
  if (sectionFromKey) return sectionFromKey;

  const normalizedName = category.name.toLowerCase();
  if (normalizedName.includes("cafe menu") || normalizedName === "cafe") return null;
  if (normalizedName.includes("restaurant menu") || normalizedName === "restaurant") return null;
  if (normalizedName.includes("beverage") || normalizedName.includes("snack") || normalizedName.includes("dessert")) {
    return "cafe";
  }

  return "restaurant";
}

export function getSubCategories(categories: Category[], section: MenuSection): Category[] {
  return categories
    .filter((category) => {
      const key = getCategoryKey(category.id);
      return key !== "breakfast" && getCategorySection(category) === section;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
