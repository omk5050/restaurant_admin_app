import { useEffect } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { COLORS } from "@/constants/colors";
import { useOrder } from "@/hooks/useOrder";
import { useOrderStore } from "@/store/orderStore";
import { useTableStore } from "@/store/tableStore";
import { formatCurrency, formatTime } from "@/utils/formatters";
import { Order } from "@/types";

const STATUS_META = {
  open: { label: "Cooking", tone: "orange" as const, color: COLORS.primary, bg: COLORS.primaryLight },
  hold: { label: "On Hold", tone: "gray" as const, color: COLORS.slate, bg: COLORS.grayLight },
  billed: { label: "Bill Ready", tone: "blue" as const, color: COLORS.blue, bg: COLORS.blueLight },
  paid: { label: "Paid", tone: "green" as const, color: COLORS.green, bg: COLORS.greenLight },
};

function Header({ orders }: { orders: Order[] }) {
  const liveOrders = orders.filter((order) => order.status !== "paid");
  const billedOrders = orders.filter((order) => order.status === "billed");
  const sales = orders.reduce((sum, order) => sum + order.total, 0);

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.hero, isSmallScreen && { flexWrap: "wrap", gap: 12 }]}>
        <View style={{ flex: 1, flexShrink: 1, minWidth: 150 }}>
          <Text style={styles.kicker}>ORDER RAIL</Text>
          <Text style={styles.heroTitle}>Live queue</Text>
          <Text style={styles.heroSubtitle}>Keep tables, bills, and payments moving.</Text>
        </View>
        <View style={[styles.heroBadge, isSmallScreen && { alignSelf: "flex-start" }]}>
          <Text style={styles.heroBadgeValue}>{liveOrders.length}</Text>
          <Text style={styles.heroBadgeLabel}>live</Text>
        </View>
      </View>

      <View style={[styles.metricRow, isSmallScreen && { flexWrap: "wrap", gap: 10 }]}>
        <Card style={[styles.metric, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={styles.metricValue}>{orders.length}</Text>
          <Text style={styles.metricLabel}>Total orders</Text>
        </Card>
        <Card style={[styles.metric, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={[styles.metricValue, { color: COLORS.blue }]}>{billedOrders.length}</Text>
          <Text style={styles.metricLabel}>Need payment</Text>
        </Card>
        <Card style={[styles.metricWide, isSmallScreen && { minWidth: "100%", flex: 0, alignItems: "center" }]}>
          <Text style={styles.metricValue}>{formatCurrency(sales)}</Text>
          <Text style={styles.metricLabel}>Order value</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Service tickets</Text>
          <Text style={styles.subtitle}>Newest order first</Text>
        </View>
        <View style={styles.queuePill}>
          <Text style={styles.queuePillText}>{billedOrders.length} bills ready</Text>
        </View>
      </View>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const tables = useTableStore((state) => state.tables);
  const table = tables.find((t) => t.id === order.tableId);
  const tableName = table ? table.name : `T${order.tableId}`;

  const meta = STATUS_META[order.status];
  const itemPreview = order.items.slice(0, 2).map((item) => `${item.qty}x ${item.name}`).join(" · ");
  const extraItems = Math.max(order.items.length - 2, 0);

  return (
    <Card style={styles.orderCard}>
      <View style={[styles.statusRail, { backgroundColor: meta.color }]} />
      <View style={styles.cardTop}>
        <View style={[styles.tablePlate, order.isTakeaway && { backgroundColor: COLORS.purpleLight }]}>
          <Text style={[styles.tablePlateText, order.isTakeaway && { color: COLORS.purple, fontSize: 20 }]}>
            {order.isTakeaway ? "🛍️" : tableName}
          </Text>
        </View>
        <View style={styles.orderInfo}>
          <View style={styles.orderTitleLine}>
            <Text style={styles.orderNo}>{order.orderNo}</Text>
            <Badge label={meta.label} tone={meta.tone} />
          </View>
          <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
            {order.isTakeaway
              ? `${order.customerName || "Takeaway"} (${order.customerPhone || "N/A"})`
              : `${order.guests} guests`}{" "}
            · {formatTime(order.openedAt)}
          </Text>
        </View>
      </View>

      <View style={[styles.previewBox, { backgroundColor: meta.bg }]}>
        <Text numberOfLines={2} style={styles.previewText}>
          {itemPreview || "No items yet"}{extraItems ? ` · +${extraItems} more` : ""}
        </Text>
      </View>

      <View style={styles.bottomLine}>
        <View style={styles.itemCountPill}>
          <Text style={styles.itemCountText}>{order.items.length} items</Text>
        </View>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </View>
    </Card>
  );
}

export default function OrdersScreen() {
  const orders = useOrderStore((state) => state.orders);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchTables = useTableStore((state) => state.fetchTables);

  useEffect(() => {
    fetchOrders();
    fetchTables();

    // Poll orders and tables every 10 seconds to keep live tickets updated
    const interval = setInterval(() => {
      fetchOrders();
      fetchTables();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders, fetchTables]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={[...orders].reverse()}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Header orders={orders} />}
      renderItem={({ item }) => <OrderCard order={item} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 18,
    paddingBottom: 34,
  },
  headerWrap: {
    gap: 14,
  },
  hero: {
    backgroundColor: COLORS.espresso,
    borderCurve: "continuous",
    borderRadius: 28,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    padding: 22,
  },
  kicker: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#D7CEC4",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    maxWidth: 250,
  },
  heroBadge: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: COLORS.blue,
    borderCurve: "continuous",
    borderRadius: 20,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroBadgeValue: {
    color: COLORS.white,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  heroBadgeLabel: {
    color: "#DBEAFE",
    fontSize: 11,
    fontWeight: "900",
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  metricWide: {
    flex: 1.35,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  metricValue: {
    color: COLORS.primaryDark,
    fontSize: 19,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  metricLabel: {
    color: COLORS.textSec,
    fontSize: 10,
    fontWeight: "800",
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  queuePill: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  queuePillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  orderCard: {
    gap: 13,
    overflow: "hidden",
    padding: 14,
    paddingLeft: 18,
    position: "relative",
  },
  statusRail: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 5,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  tablePlate: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderCurve: "continuous",
    borderRadius: 15,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  tablePlateText: {
    color: COLORS.primaryDark,
    fontSize: 17,
    fontWeight: "900",
  },
  orderInfo: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  orderTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  orderNo: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "700",
  },
  previewBox: {
    borderCurve: "continuous",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewText: {
    color: COLORS.slate,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  bottomLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemCountPill: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  itemCountText: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "900",
  },
  total: {
    color: COLORS.primaryDark,
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
