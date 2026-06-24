import { calculateOrder } from "@/utils/calculations";
import { Category, MenuItem, Order, Table } from "@/types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "popular", name: "Popular", icon: "★", sortOrder: 0, section: "restaurant" },
  { id: "starters", name: "Starters", icon: "🥗", sortOrder: 1, section: "restaurant" },
  { id: "main", name: "Main Course", icon: "🍛", sortOrder: 2, section: "restaurant" },
  { id: "rice", name: "Rice", icon: "🍚", sortOrder: 3, section: "restaurant" },
  { id: "beverages", name: "Beverages", icon: "🥤", sortOrder: 0, section: "cafe" },
  { id: "snacks", name: "Snacks", icon: "🍟", sortOrder: 1, section: "cafe" },
  { id: "desserts", name: "Desserts", icon: "🍰", sortOrder: 2, section: "cafe" },
];

export const DEFAULT_MENU: MenuItem[] = [
  // ── Desserts ──────────────────────────────────────────────────────────────
  { id: "m38", categoryId: "desserts", name: "Tripple Choco Bowl", price: 150, emoji: "🍫", isAvailable: true, isVeg: true },
  { id: "m39", categoryId: "desserts", name: "Oreo Choco Bowl", price: 160, emoji: "🍪", isAvailable: true, isVeg: true },

  // ── Snacks ────────────────────────────────────────────────────────────────
  { id: "m40", categoryId: "snacks", name: "French Fries Classic", price: 80, emoji: "🍟", isAvailable: true, isVeg: true },
  { id: "m41", categoryId: "snacks", name: "Peri Peri French Fries", price: 100, emoji: "🌶️", isAvailable: true, isVeg: true },
  { id: "m46", categoryId: "snacks", name: "Tandoori Lollipop", price: 220, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m47", categoryId: "snacks", name: "Reshmi Kebab", price: 240, emoji: "🍢", isAvailable: true, isVeg: false },

  // ── Rice ──────────────────────────────────────────────────────────────────
  { id: "m42", categoryId: "rice", name: "Veg Dum Biryani", price: 180, emoji: "🍛", isAvailable: true, isVeg: true },
  { id: "m43", categoryId: "rice", name: "Egg Dum Biryani", price: 200, emoji: "🍳", isAvailable: true, isVeg: false },
  { id: "m44", categoryId: "rice", name: "Paneer Tikka Biryani", price: 220, emoji: "🍢", isAvailable: true, isVeg: true },
  { id: "m48", categoryId: "rice", name: "Chicken Dum Biryani", price: 240, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m49", categoryId: "rice", name: "Mutton Dum Biryani", price: 280, emoji: "🐑", isAvailable: true, isVeg: false },
  { id: "m50", categoryId: "rice", name: "Chicken Tikka Biryani", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m51", categoryId: "rice", name: "Tandoori Biryani", price: 260, emoji: "🔥", isAvailable: true, isVeg: false },

  // ── Main Course ───────────────────────────────────────────────────────────
  { id: "m45", categoryId: "main", name: "Paneer Kalimiri Kabab", price: 180, emoji: "🫕", isAvailable: true, isVeg: true },
  { id: "m52", categoryId: "main", name: "Afghani Tandoor", price: 320, emoji: "🔥", isAvailable: true, isVeg: false },
  { id: "m53", categoryId: "main", name: "Chicken Sheekh Kabab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m54", categoryId: "main", name: "Mutton Sheekh Kebab", price: 300, emoji: "🐑", isAvailable: true, isVeg: false },
  { id: "m55", categoryId: "main", name: "Chicken Tikka Kebab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m56", categoryId: "main", name: "Chicken Tangadi Kebab", price: 280, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m57", categoryId: "main", name: "Lahsuni Kebab", price: 240, emoji: "🧄", isAvailable: true, isVeg: false },
  { id: "m58", categoryId: "main", name: "Paneer Tikka Kebab", price: 220, emoji: "🧀", isAvailable: true, isVeg: true },
  { id: "m59", categoryId: "main", name: "Speacial Paradise Kebab", price: 350, emoji: "⭐", isAvailable: true, isVeg: false },
  { id: "m60", categoryId: "main", name: "Chicken Hariyali Kebab", price: 260, emoji: "🌿", isAvailable: true, isVeg: false },
  { id: "m61", categoryId: "main", name: "Paneer Kalimiri kebab", price: 200, emoji: "🧀", isAvailable: true, isVeg: true },
  { id: "m62", categoryId: "main", name: "Chicken Kalimiri kebab", price: 260, emoji: "🍗", isAvailable: true, isVeg: false },
  { id: "m63", categoryId: "main", name: "Tandoor Chicken Red", price: 280, emoji: "🔴", isAvailable: true, isVeg: false },
  { id: "m64", categoryId: "main", name: "Tandoor Chicken White", price: 280, emoji: "⚪", isAvailable: true, isVeg: false },
];

const seededOrderItems = [
  { menuItemId: "m42", name: "Veg Dum Biryani", price: 180, qty: 1 },
  { menuItemId: "m38", name: "Tripple Choco Bowl", price: 150, qty: 1 },
];

const seedTotals = calculateOrder(seededOrderItems);

export const DEFAULT_ORDERS: Order[] = [
  {
    id: "ord_1025",
    tableId: 2,
    orderNo: "#1025",
    guests: 4,
    status: "open",
    items: seededOrderItems,
    ...seedTotals,
    openedAt: new Date().toISOString(),
  },
  {
    id: "ord_1024",
    tableId: 5,
    orderNo: "#1024",
    guests: 3,
    status: "open",
    items: [
      { menuItemId: "m43", name: "Egg Dum Biryani", price: 200, qty: 1 },
      { menuItemId: "m40", name: "French Fries Classic", price: 80, qty: 1 },
    ],
    ...calculateOrder([
      { menuItemId: "m43", name: "Egg Dum Biryani", price: 200, qty: 1 },
      { menuItemId: "m40", name: "French Fries Classic", price: 80, qty: 1 },
    ]),
    openedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: "ord_1023",
    tableId: 9,
    orderNo: "#1023",
    guests: 2,
    status: "billed",
    items: [
      { menuItemId: "m44", name: "Paneer Tikka Biryani", price: 220, qty: 1 },
      { menuItemId: "m39", name: "Oreo Choco Bowl", price: 160, qty: 1 },
    ],
    ...calculateOrder([
      { menuItemId: "m44", name: "Paneer Tikka Biryani", price: 220, qty: 1 },
      { menuItemId: "m39", name: "Oreo Choco Bowl", price: 160, qty: 1 },
    ]),
    openedAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
  },
];

export const DEFAULT_TABLES: Table[] = Array.from({ length: 12 }, (_, index) => {
  const id = index + 1;
  const order = DEFAULT_ORDERS.find((item) => item.tableId === id);
  return {
    id,
    name: `T${id}`,
    seats: 4,
    status: id === 12 ? "paid" : order?.status === "billed" ? "bill" : order ? "active" : "empty",
    currentOrderId: order?.id,
  };
});
