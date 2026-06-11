import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CategorySidebar } from "@/components/menu/CategorySidebar";
import { MenuList } from "@/components/menu/MenuList";
import { OrderBottomBar } from "@/components/orders/OrderBottomBar";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";
import { getSubCategories } from "@/constants/menuSections";
import { useMenu } from "@/hooks/useMenu";
import { useOrder } from "@/hooks/useOrder";
import { useTables } from "@/hooks/useTables";
import { useOrderStore } from "@/store/orderStore";
import { MenuItem, MenuSection } from "@/types";
import { formatCurrency, formatTime } from "@/utils/formatters";

export default function TableOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = Number(id);
  const { findTable, ensureOrderForTable, clearTable, setTableStatus } = useTables();
  const { categories } = useMenu();
  const [selectedSection, setSelectedSection] = useState<MenuSection>("restaurant");
  const [selectedCategory, setSelectedCategory] = useState(
    () => getSubCategories(categories, "restaurant")[0]?.id ?? categories[0]?.id ?? "popular",
  );

  function handleSelectSection(section: MenuSection) {
    setSelectedSection(section);
    const firstCategory = getSubCategories(categories, section)[0];
    if (firstCategory) setSelectedCategory(firstCategory.id);
  }
  const { getOrderForTable, updateOrderItem, generateBill } = useOrder();

  // KOT success modal state
  const [kotModalVisible, setKotModalVisible] = useState(false);
  // Clear table confirm modal state
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  // Error modal state
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    if (Number.isFinite(tableId)) {
      ensureOrderForTable(tableId).catch((err) => {
        console.error("ensureOrderForTable failed:", err);
        setErrorModal(err.message || "Failed to initialize table session.");
      });
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
    if (!order) return;
    updateOrderItem(order.id, item, qty);
  }

  function reviewBill() {
    if (!order) return;
    generateBill(order.id);
    router.push(`/payment/${tableId}` as never);
  }

  // Hold: save current items, keep table active, go back to dashboard
  async function handleHold() {
    if (!order) return;
    if (order.items.length === 0) {
      setErrorModal("Add at least one item before putting on hold.");
      return;
    }
    // Table is already active if items exist; ensure status is set to active
    await setTableStatus(tableId, "active");
    router.replace("/(tabs)" as never);
  }

  // Clear Table: show custom confirm modal (Alert.alert doesn't work on web)
  function handleClearTable() {
    setClearConfirmVisible(true);
  }

  async function executeClearTable() {
    setClearConfirmVisible(false);
    await clearTable(tableId);
    await useOrderStore.getState().fetchOrders();
    await useOrderStore.getState().fetchAnalytics();
    router.replace("/(tabs)" as never);
  }

  // KOT: show confirmation popup, set table active, go back to dashboard
  async function handleKot() {
    if (!order) return;
    if (order.items.length === 0) {
      setErrorModal("Add at least one item before printing KOT.");
      return;
    }
    await setTableStatus(tableId, "active");
    setKotModalVisible(true);
  }

  function handleKotDismiss() {
    setKotModalVisible(false);
    router.replace("/(tabs)" as never);
  }

  // Add custom item: creates a temporary menu-item-like entry with a unique ID
  function handleAddCustomItem(name: string, price: number) {
    if (!order) return;
    const customItem: MenuItem = {
      id: `custom_${Date.now()}`,
      categoryId: "custom",
      name,
      price,
      emoji: "✏️",
      isAvailable: true,
      isVeg: true,
    };
    // Add with qty 1
    updateOrderItem(order.id, customItem, 1);
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
            Table will auto-clear in 2 mins.
          </Text>

          <View style={styles.paidActions}>
            <Button
              onPress={async () => {
                await clearTable(tableId);
                await useOrderStore.getState().fetchOrders();
                await useOrderStore.getState().fetchAnalytics();
                router.replace("/(tabs)" as never);
              }}
            >
              Clear Table Now
            </Button>

            <Button
              variant="secondary"
              onPress={async () => {
                await clearTable(tableId);
                await useOrderStore.getState().fetchOrders();
                await useOrderStore.getState().fetchAnalytics();
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
        <TouchableOpacity style={styles.clearNowBtn} onPress={handleClearTable} activeOpacity={0.8}>
          <Text style={styles.clearNowBtnText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <CategorySidebar
          categories={categories}
          selectedSection={selectedSection}
          selectedId={selectedCategory}
          onSelectSection={handleSelectSection}
          onSelect={setSelectedCategory}
        />
        <MenuList
          title={activeCategory?.name ?? "Menu"}
          items={items}
          getQty={(itemId) => qtyById.get(itemId) ?? 0}
          onChangeQty={changeQty}
        />
      </View>

      {/* Clear Table Button for active/billed tables */}
      {(table.status === "active" || table.status === "bill") && (
        <TouchableOpacity style={styles.clearTableBtn} onPress={handleClearTable} activeOpacity={0.8}>
          <Text style={styles.clearTableBtnText}>🗑️  Clear Table</Text>
        </TouchableOpacity>
      )}

      <OrderSummary order={order} onReviewBill={reviewBill} />

      <OrderBottomBar
        onHoldPress={handleHold}
        onKotPress={handleKot}
        onAddCustomItem={handleAddCustomItem}
      />

      {/* Error Modal */}
      <Modal visible={!!errorModal} transparent animationType="fade" onRequestClose={() => setErrorModal("")}>
        <View style={styles.kotOverlay}>
          <View style={styles.kotCard}>
            <Text style={styles.kotEmoji}>⚠️</Text>
            <Text style={[styles.kotTitle, { color: "#f59e0b" }]}>No Items</Text>
            <Text style={styles.kotMessage}>{errorModal}</Text>
            <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#f59e0b" }]} onPress={() => setErrorModal("")}>
              <Text style={styles.kotDismissText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* KOT Success Modal */}
      <Modal visible={kotModalVisible} transparent animationType="fade" onRequestClose={handleKotDismiss}>
        <View style={styles.kotOverlay}>
          <View style={styles.kotCard}>
            <Text style={styles.kotEmoji}>🖨️</Text>
            <Text style={styles.kotTitle}>KOT Sent!</Text>
            <Text style={styles.kotMessage}>
              Kitchen Order Ticket for {table.name} ({order.orderNo}) has been sent to the kitchen.
            </Text>
            <TouchableOpacity style={styles.kotDismissBtn} onPress={handleKotDismiss}>
              <Text style={styles.kotDismissText}>OK, Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Table Confirm Modal */}
      <Modal visible={clearConfirmVisible} transparent animationType="fade" onRequestClose={() => setClearConfirmVisible(false)}>
        <View style={styles.kotOverlay}>
          <View style={styles.kotCard}>
            <Text style={styles.kotEmoji}>🗑️</Text>
            <Text style={[styles.kotTitle, { color: "#ef4444" }]}>Clear Table?</Text>
            <Text style={styles.kotMessage}>
              This will cancel the current order and free {table.name}. This cannot be undone.
            </Text>
            <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#ef4444" }]} onPress={executeClearTable}>
              <Text style={styles.kotDismissText}>Yes, Clear Table</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#f1f5f9", marginTop: 0 }]} onPress={() => setClearConfirmVisible(false)}>
              <Text style={[styles.kotDismissText, { color: "#64748b" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  clearNowBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  clearNowBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
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
    flexDirection: "column",
  },
  clearTableBtn: {
    backgroundColor: "#fef2f2",
    borderTopColor: "#fecaca",
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  clearTableBtnText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "800",
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
  // KOT Modal
  kotOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  kotCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  kotEmoji: {
    fontSize: 52,
  },
  kotTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#15803d",
  },
  kotMessage: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: "center",
    lineHeight: 20,
  },
  kotDismissBtn: {
    backgroundColor: "#15803d",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  kotDismissText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
