import { create } from "zustand";
import { Category, MenuItem } from "@/types";
import { API_URL } from "@/constants/config";
import { DEFAULT_CATEGORIES, DEFAULT_MENU } from "@/constants/mockData";
import { apiFetch } from "@/utils/api";

interface MenuStore {
  categories: Category[];
  menuItems: MenuItem[];
  fetchMenu: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set) => ({
  categories: DEFAULT_CATEGORIES,
  menuItems: DEFAULT_MENU,
  fetchMenu: async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        apiFetch(`${API_URL}/api/categories`),
        apiFetch(`${API_URL}/api/menu`),
      ]);
      if (catRes.ok && menuRes.ok) {
        const categories = await catRes.json();
        const menuItems = await menuRes.json();
        set({ categories, menuItems });
      }
    } catch (err) {
      console.error("Failed to fetch menu/categories:", err);
    }
  },
  addMenuItem: async (item) => {
    try {
      const res = await apiFetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const newItem = await res.json();
        set((state) => ({ menuItems: [...state.menuItems, newItem] }));
      }
    } catch (err) {
      console.error("Failed to add menu item:", err);
    }
  },
  deleteMenuItem: async (id) => {
    try {
      const res = await apiFetch(`${API_URL}/api/menu/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        set((state) => ({ menuItems: state.menuItems.filter((item) => item.id !== id) }));
      }
    } catch (err) {
      console.error("Failed to delete menu item:", err);
    }
  },
}));

