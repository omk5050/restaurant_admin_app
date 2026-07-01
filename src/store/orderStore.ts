import { create } from "zustand";
import { Invoice, MenuItem, Order, PaymentMethod } from "@/types";
import { API_URL } from "@/constants/config";
import { apiFetch } from "@/utils/api";

// Default structure for analytics state
const DEFAULT_ANALYTICS = {
  todaySales: 0,
  todaySalesComparison: 18,
  openOrdersCount: 0,
  activeTablesCount: 0,
  billedTablesCount: 0,
  paidTablesCount: 0,
  emptyTablesCount: 0,
  weeklySales: [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
  ],
  monthlySales: [
    { label: "Jan", value: 0 },
    { label: "Feb", value: 0 },
    { label: "Mar", value: 0 },
    { label: "Apr", value: 0 },
    { label: "May", value: 0 },
    { label: "Jun", value: 0 },
  ],
  averageTicket: 0,
  paidCount: 0,
  activeCount: 0,
  monthPace: 0,
  latestOrderOpenedAt: new Date().toISOString(),
  paymentComparison: [
    { label: "Cash", value: 0 },
    { label: "Card", value: 0 },
    { label: "UPI", value: 0 },
  ],
};

interface OrderStore {
  orders: Order[];
  invoices: Invoice[];
  analytics: typeof DEFAULT_ANALYTICS;
  fetchOrders: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  createOrder: (
    tableId: number,
    guests: number,
    isTakeaway?: boolean,
    customerName?: string,
    customerPhone?: string
  ) => Promise<Order>;
  updateOrderItem: (orderId: string, menuItem: MenuItem, qty: number) => Promise<void>;
  updateOrderMetadata: (
    orderId: string,
    metadata: { guests?: number; customerName?: string; customerPhone?: string; isTakeaway?: boolean }
  ) => Promise<void>;
  generateBill: (orderId: string) => Promise<void>;
  closeOrder: (
    orderId: string,
    method: PaymentMethod,
    splits?: { method: PaymentMethod; amount: number }[]
  ) => Promise<Invoice>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  invoices: [],
  analytics: DEFAULT_ANALYTICS,
  fetchOrders: async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        apiFetch(`${API_URL}/api/orders`),
        apiFetch(`${API_URL}/api/invoices`),
      ]);
      if (ordersRes.ok && invoicesRes.ok) {
        const orders = await ordersRes.json();
        const invoices = await invoicesRes.json();
        set({ orders, invoices });
      }
    } catch (err) {
      console.error("Failed to fetch orders/invoices:", err);
    }
  },
  fetchAnalytics: async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        set({ analytics: data });
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  },
  createOrder: async (tableId, guests, isTakeaway = false, customerName = "", customerPhone = "") => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, guests, isTakeaway, customerName, customerPhone }),
      });
      if (res.ok) {
        const order = await res.json();
        set((state) => ({ orders: [...state.orders, order] }));
        return order;
      }
      throw new Error("Failed to create order");
    } catch (err) {
      console.error("Failed to create order:", err);
      throw err;
    }
  },
  updateOrderItem: async (orderId, menuItem, qty) => {
    try {
      const order = get().orders.find((o) => o.id === orderId);
      if (!order) return;

      const withoutItem = order.items.filter((item) => item.menuItemId !== menuItem.id);
      const items =
        qty > 0
          ? [
              ...withoutItem,
              {
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                qty,
              },
            ]
          : withoutItem;

      const res = await apiFetch(`${API_URL}/api/orders/${orderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to update order item:", err);
    }
  },
  generateBill: async (orderId) => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders/${orderId}/bill`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to generate bill:", err);
    }
  },
  closeOrder: async (orderId, method, splits) => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method, splits }),
      });
      if (res.ok) {
        const invoice = await res.json();
        // Update order locally to "paid" status
        set((state) => ({
          invoices: [...state.invoices, invoice],
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: "paid", paymentMethod: method, closedAt: invoice.createdAt }
              : o
          ),
        }));
        return invoice;
      }
      throw new Error("Failed to close order");
    } catch (err) {
      console.error("Failed to close order:", err);
      throw err;
    }
  },
  updateOrderMetadata: async (orderId, metadata) => {
    try {
      const res = await apiFetch(`${API_URL}/api/orders/${orderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to update order metadata:", err);
    }
  },
}));

