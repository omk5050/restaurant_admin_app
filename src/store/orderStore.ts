import { create } from "zustand";
import { Invoice, MenuItem, Order, PaymentMethod } from "@/types";
import { API_URL } from "@/constants/config";
import { apiFetch } from "@/utils/api";
import { useSettingsStore } from "./settingsStore";
import { useTableStore } from "./tableStore";

// Store pending order promises mapping tempIds to server Order promises
const pendingOrders = new Map<string, Promise<Order>>();

function calculateTotal(items: any[], gstPercent = 5) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gstAmount = Math.round(subtotal * (gstPercent / 100));
  return {
    subtotal,
    gstAmount,
    total: subtotal + gstAmount,
  };
}


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
    splits?: { method: PaymentMethod; amount: number }[],
    gstAmount?: number,
    total?: number
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
    const tempId = `temp_${tableId}_${Date.now()}`;
    const newOrder: Order = {
      id: tempId,
      tableId,
      orderNo: "Loading...",
      guests,
      status: "open",
      items: [],
      subtotal: 0,
      gstAmount: 0,
      total: 0,
      openedAt: new Date().toISOString(),
      isTakeaway,
      customerName,
      customerPhone,
    };

    // 1. Update orders list synchronously (instant load!)
    set((state) => ({ orders: [...state.orders, newOrder] }));

    // 2. Update table currentOrderId synchronously
    useTableStore.setState((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, currentOrderId: tempId, status: "active" } : t
      ),
    }));

    // 3. Trigger backend creation
    const creationPromise = (async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId, guests, isTakeaway, customerName, customerPhone }),
        });
        if (res.ok) {
          const serverOrder = await res.json();
          // Swap the temporary order ID with the real order ID in both stores
          set((state) => ({
            orders: state.orders.map((o) => (o.id === tempId ? serverOrder : o)),
          }));
          useTableStore.setState((state) => ({
            tables: state.tables.map((t) =>
              t.id === tableId ? { ...t, currentOrderId: serverOrder.id } : t
            ),
          }));
          pendingOrders.delete(tempId);
          return serverOrder;
        }
        throw new Error("Failed to create order on server");
      } catch (err) {
        console.error("Failed to sync order creation to server:", err);
        pendingOrders.delete(tempId);
        return newOrder;
      }
    })();

    pendingOrders.set(tempId, creationPromise);
    return newOrder;
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

      // 1. Perform local calculation and update store synchronously (instant UI feedback!)
      const gstPercent = useSettingsStore.getState().settings.gstPercent ?? 5;
      const totals = calculateTotal(items, gstPercent);
      const localUpdatedOrder = {
        ...order,
        items,
        ...totals,
      };

      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? localUpdatedOrder : o)),
      }));

      // 2. Synchronize with backend in a non-blocking way
      let activeOrderId = orderId;
      if (orderId.startsWith("temp_")) {
        const pendingPromise = pendingOrders.get(orderId);
        if (pendingPromise) {
          const serverOrder = await pendingPromise;
          activeOrderId = serverOrder.id;
        }
      }

      const res = await apiFetch(`${API_URL}/api/orders/${activeOrderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.id === activeOrderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to update order item:", err);
    }
  },
  generateBill: async (orderId) => {
    try {
      let activeOrderId = orderId;
      if (orderId.startsWith("temp_")) {
        const pendingPromise = pendingOrders.get(orderId);
        if (pendingPromise) {
          const serverOrder = await pendingPromise;
          activeOrderId = serverOrder.id;
        }
      }

      const res = await apiFetch(`${API_URL}/api/orders/${activeOrderId}/bill`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.id === activeOrderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to generate bill:", err);
    }
  },
  closeOrder: async (orderId, method, splits, gstAmount, total) => {
    try {
      let activeOrderId = orderId;
      if (orderId.startsWith("temp_")) {
        const pendingPromise = pendingOrders.get(orderId);
        if (pendingPromise) {
          const serverOrder = await pendingPromise;
          activeOrderId = serverOrder.id;
        }
      }

      const res = await apiFetch(`${API_URL}/api/orders/${activeOrderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method, splits, gstAmount, total }),
      });
      if (res.ok) {
        const invoice = await res.json();
        // Update order locally to "paid" status
        set((state) => ({
          invoices: [...state.invoices, invoice],
          orders: state.orders.map((o) =>
            o.id === orderId || o.id === activeOrderId
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
      let activeOrderId = orderId;
      if (orderId.startsWith("temp_")) {
        const pendingPromise = pendingOrders.get(orderId);
        if (pendingPromise) {
          const serverOrder = await pendingPromise;
          activeOrderId = serverOrder.id;
        }
      }

      const res = await apiFetch(`${API_URL}/api/orders/${activeOrderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.id === activeOrderId ? updatedOrder : o)),
        }));
      }
    } catch (err) {
      console.error("Failed to update order metadata:", err);
    }
  },
}));

