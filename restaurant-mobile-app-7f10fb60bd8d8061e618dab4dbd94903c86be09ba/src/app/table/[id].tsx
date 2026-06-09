import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { CategorySidebar } from "@/components/menu/CategorySidebar";
import { MenuList } from "@/components/menu/MenuList";
import { OrderBottomBar } from "@/components/orders/OrderBottomBar";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";
import { useMenu } from "@/hooks/useMenu";
import { useOrder } from "@/hooks/useOrder";
import { useTables } from "@/hooks/useTables";
import { formatCurrency, formatTime } from "@/utils/formatters";
import { MenuItem } from "@/types";

export default function TableOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = Number(id);
  const { findTable, ensureOrderForTable, clearTable } = useTables();
  const { categories } = useMenu();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? "popular");
  const { getOrderForTable, updateOrderItem, generateBill } = useOrder();

  useEffect(() => {
    if (Number.isFinite(tableId)) {
      ensureOrderForTable(tableId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const table = findTable(tableId);
  const order = getOrderForTable(tableId);
  const activeCategory = categories.find((category) => category.id === selectedCategory);
  const { items } = useMenu(selectedCategory);

  const qtyById = useMemo(() => {
    const map = new Map<string, number>();
    order?.items.forEach((item) => map.set(item.menuItemId, item.qty));
    return map;
  }, [order?.items]);

  function changeQty(item: MenuItem, qty: number) {
    if (!order) {
      return;
    }
    updateOrderItem(order.id, item, qty);
  }

  function reviewBill() {
    if (!order) {
      return;
    }
    generateBill(order.id);
    router.push(`/payment/${tableId}` as never);
  }

  if (!table || !order) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Preparing table...</Text>
      </View>
    );
  }

  if (table.status === "paid") {
    return (
      <View style={styles.paidScreen}>
        <View style={styles.paidCard}>
          <Text style={styles.paidEmoji}>✅</Text>
          <Text style={styles.paidTitle}>{table.name} is Paid</Text>
          <Text style={styles.paidSubtitle}>
            Order {order.orderNo} was completed for {formatCurrency(order.total)}.
          </Text>
          <Text style={styles.paidTimer}>
            Table will auto-clear in 5 mins.
          </Text>
          
          <View style={styles.paidActions}>
            <Button
              onPress={async () => {
                await clearTable(tableId);
                router.replace("/(tabs)" as never);
              }}
            >
              Clear Table Now
            </Button>
            
            <Button
              variant="secondary"
              onPress={async () => {
                await clearTable(tableId);
                await ensureOrderForTable(tableId);
              }}
            >
              Start New Session
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>👥</Text>
          <View>
            <Text style={styles.infoLabel}>Guests</Text>
            <Text style={styles.infoValue}>{order.guests}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View>
            <Text style={styles.infoLabel}>Opened At</Text>
            <Text style={styles.infoValue}>{formatTime(order.openedAt)}</Text>
          </View>
        </View>
        <View style={styles.infoItemLast}>
          <Text style={styles.infoIcon}>📋</Text>
          <View>
            <Text style={styles.infoLabel}>Order No.</Text>
            <Text style={styles.infoValue}>{order.orderNo}</Text>
          </View>
        </View>
        <Badge label={order.status === "billed" ? "Bill Ready" : "Active"} />
      </View>

      <View style={styles.body}>
        <CategorySidebar categories={categories} selectedId={selectedCategory} onSelect={setSelectedCategory} />
        <MenuList
          title={activeCategory?.name ?? "Menu"}
          items={items}
          getQty={(itemId) => qtyById.get(itemId) ?? 0}
          onChangeQty={changeQty}
        />
      </View>

      <OrderSummary order={order} onReviewBill={reviewBill} />

      <OrderBottomBar onKotPress={() => Alert.alert("KOT ready", "Kitchen Order Ticket print is UI-only for this MVP.")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
  emptyScreen: {
    alignItems: "center",
    backgroundColor: COLORS.bg,
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "700",
  },
  infoBar: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoItem: {
    alignItems: "center",
    borderRightColor: COLORS.border,
    borderRightWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    paddingRight: 6,
  },
  infoItemLast: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoLabel: {
    color: COLORS.textSec,
    fontSize: 9,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  paidScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  paidCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  paidEmoji: {
    fontSize: 48,
  },
  paidTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
  },
  paidSubtitle: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: "center",
  },
  paidTimer: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.green,
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  paidActions: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
});

