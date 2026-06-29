import { useMemo } from "react";

import { useMenuStore } from "@/store/menuStore";

export function useMenu(categoryId?: string) {
  const categories = useMenuStore((state) => state.categories);
  const menuItems = useMenuStore((state) => state.menuItems);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const items = useMemo(
    () => menuItems.filter((item) => !categoryId || item.categoryId === categoryId),
    [categoryId, menuItems],
  );

  return {
    categories,
    menuItems,
    fetchMenu,
    items,
  };
}
