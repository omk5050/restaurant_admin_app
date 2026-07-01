import { useCallback, useMemo } from "react";

import { useOrderStore } from "@/store/orderStore";
import { useTableStore } from "@/store/tableStore";
import { PaymentMethod } from "@/types";

export function useOrder(orderId?: string) {
  const orders = useOrderStore((state) => state.orders);
  const updateOrderItem = useOrderStore((state) => state.updateOrderItem);
  const updateOrderMetadata = useOrderStore((state) => state.updateOrderMetadata);
  const generateBillInStore = useOrderStore((state) => state.generateBill);
  const closeOrderInStore = useOrderStore((state) => state.closeOrder);
  const createOrder = useOrderStore((state) => state.createOrder);
  const tables = useTableStore((state) => state.tables);
  const setTableOrder = useTableStore((state) => state.setTableOrder);
  const setTableStatus = useTableStore((state) => state.setTableStatus);

  const order = useMemo(
    () => (orderId ? orders.find((item) => item.id === orderId) : undefined),
    [orderId, orders],
  );

  const findOrder = useCallback((targetOrderId: string) => orders.find((item) => item.id === targetOrderId), [orders]);

  const getOrderForTable = useCallback(
    (tableId: number) => {
      const table = tables.find((item) => item.id === tableId);
      return (
        orders.find((item) => item.id === table?.currentOrderId) ??
        orders.find((item) => item.tableId === tableId && item.status !== "paid")
      );
    },
    [orders, tables],
  );

  const ensureOrderForTable = useCallback(
    async (tableId: number) => {
      const currentOrder = getOrderForTable(tableId);
      if (currentOrder) {
        return currentOrder;
      }
      const newOrder = await createOrder(tableId, 4);
      setTableOrder(tableId, newOrder.id);
      return newOrder;
    },
    [createOrder, getOrderForTable, setTableOrder],
  );

  const generateBill = useCallback(
    (targetOrderId: string) => {
      generateBillInStore(targetOrderId);
      const targetOrder = orders.find((item) => item.id === targetOrderId);
      if (targetOrder) {
        setTableStatus(targetOrder.tableId, "bill");
      }
    },
    [generateBillInStore, orders, setTableStatus],
  );

  const closeOrder = useCallback(
    async (
      targetOrderId: string,
      method: PaymentMethod,
      splits?: { method: PaymentMethod; amount: number }[],
      gstAmount?: number,
      total?: number
    ) => {
      const invoice = await closeOrderInStore(targetOrderId, method, splits, gstAmount, total);
      setTableStatus(invoice.tableId, "paid");
      return invoice;
    },
    [closeOrderInStore, setTableStatus],
  );

  return {
    order,
    orders,
    updateOrderItem,
    updateOrderMetadata,
    generateBill,
    closeOrder,
    findOrder,
    getOrderForTable,
    ensureOrderForTable,
  };
}
