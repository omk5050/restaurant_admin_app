import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from "react-native";

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
import { useTableStore } from "@/store/tableStore";
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
  const [selectedFoodType, setSelectedFoodType] = useState<"all" | "veg" | "non-veg">("all");

  function handleSelectSection(section: MenuSection) {
    setSelectedSection(section);
    const firstCategory = getSubCategories(categories, section)[0];
    if (firstCategory) setSelectedCategory(firstCategory.id);
    setSelectedFoodType("all");
  }
  const { getOrderForTable, updateOrderItem, generateBill } = useOrder();
  const createOrder = useOrderStore((state) => state.createOrder);

  const table = findTable(tableId);
  const order = getOrderForTable(tableId);
  const initialized = useRef(false);

  // KOT success modal state
  const [kotModalVisible, setKotModalVisible] = useState(false);
  // Clear table confirm modal state
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  // Error modal state
  const [errorModal, setErrorModal] = useState("");

  // Takeaway state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [takeawayModalVisible, setTakeawayModalVisible] = useState(false);

  useEffect(() => {
    if (table && table.name.startsWith("T") && !order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTakeawayModalVisible(true);
    } else {
      setTakeawayModalVisible(false);
    }
  }, [table, order]);

  useEffect(() => {
    if (Number.isFinite(tableId) && table && !table.name.startsWith("T") && !initialized.current) {
      initialized.current = true;
      ensureOrderForTable(tableId).catch((err) => {
        console.error("ensureOrderForTable failed:", err);
        setErrorModal(err.message || "Failed to initialize table session.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, table]);

  // Resolve table status dynamically for takeaways
  const tableStatus = useMemo(() => {
    if (!table) return "empty";
    if (table.name.startsWith("T")) {
      if (order) {
        if (order.status === "open" || order.status === "hold") return "active";
        if (order.status === "billed") return "bill";
        if (order.status === "paid") return "paid";
      }
      return "empty";
    }
    return table.status;
  }, [table, order]);

  const activeCategory = categories.find((category) => category.id === selectedCategory);
  const { items } = useMenu(selectedCategory);

  const qtyById = useMemo(() => {
    const map = new Map<string, number>();
    order?.items.forEach((item) => map.set(item.menuItemId, item.qty));
    return map;
  }, [order?.items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedFoodType === "veg" && !item.isVeg) return false;
      if (selectedFoodType === "non-veg" && item.isVeg) return false;
      return true;
    });
  }, [items, selectedFoodType]);

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

        {/* Takeaway Details Modal */}
        <Modal
          visible={takeawayModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setTakeawayModalVisible(false);
            router.replace("/(tabs)" as never);
          }}
        >
          <View style={styles.kotOverlay}>
            <View style={styles.kotCard}>
              <Text style={styles.kotEmoji}>🛍️</Text>
              <Text style={styles.kotTitle}>New Takeaway Order</Text>
              <Text style={styles.kotMessage}>
                Please enter the customer details for Takeaway {table?.name || `T${tableId - 10}`}
              </Text>
              
              <View style={styles.takeawayForm}>
                <Text style={styles.takeawayInputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.takeawayInput}
                  placeholder="Enter customer name"
                  placeholderTextColor={COLORS.textSec}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                
                <Text style={styles.takeawayInputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.takeawayInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={COLORS.textSec}
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.kotDismissBtn,
                  (!customerName.trim() || !customerPhone.trim()) && { opacity: 0.5 }
                ]}
                disabled={!customerName.trim() || !customerPhone.trim()}
                onPress={async () => {
                  try {
                    const newOrder = await createOrder(tableId, 1, true, customerName, customerPhone);
                    await useTableStore.getState().setTableOrder(tableId, newOrder.id);
                    setTakeawayModalVisible(false);
                  } catch (err: any) {
                    setErrorModal(err.message || "Failed to create takeaway order.");
                  }
                }}
              >
                <Text style={styles.kotDismissText}>Start Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.kotDismissBtn, { backgroundColor: "#f1f5f9", marginTop: 0 }]}
                onPress={() => {
                  setTakeawayModalVisible(false);
                  router.replace("/(tabs)" as never);
                }}
              >
                <Text style={[styles.kotDismissText, { color: "#64748b" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal visible={!!errorModal} transparent animationType="fade" onRequestClose={() => setErrorModal("")}>
          <View style={styles.kotOverlay}>
            <View style={styles.kotCard}>
              <Text style={styles.kotEmoji}>⚠️</Text>
              <Text style={[styles.kotTitle, { color: "#f59e0b" }]}>Error</Text>
              <Text style={styles.kotMessage}>{errorModal}</Text>
              <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#f59e0b" }]} onPress={() => setErrorModal("")}>
                <Text style={styles.kotDismissText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (tableStatus === "paid") {
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
                if (table.name.startsWith("T")) {
                  setCustomerName("");
                  setCustomerPhone("");
                  setTakeawayModalVisible(true);
                } else {
                  await ensureOrderForTable(tableId);
                }
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
              <Text style={styles.infoIcon}>{order.isTakeaway ? "👤" : "👥"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">
                  {order.isTakeaway ? order.customerPhone : "Guests"}
                </Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                  {order.isTakeaway ? order.customerName : order.guests}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">Opened At</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{formatTime(order.openedAt)}</Text>
              </View>
            </View>
            <View style={styles.infoItemLast}>
              <Text style={styles.infoIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">Order No.</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{order.orderNo}</Text>
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
              selectedFoodType={selectedFoodType}
              onSelectFoodType={setSelectedFoodType}
            />
            <MenuList
              title={activeCategory?.name ?? "Menu"}
              items={filteredItems}
              getQty={(itemId) => qtyById.get(itemId) ?? 0}
              onChangeQty={changeQty}
            />
          </View>

      {/* Clear Table Button for active/billed tables */}
      {(tableStatus === "active" || tableStatus === "bill") && (
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
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  infoItem: {
    alignItems: "center",
    borderRightColor: COLORS.border,
    borderRightWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    paddingRight: 4,
  },
  infoItemLast: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 4,
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 30,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      },
    }),
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
  takeawayForm: {
    width: "100%",
    gap: 8,
    marginVertical: 10,
  },
  takeawayInputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSec,
    alignSelf: "flex-start",
  },
  takeawayInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    width: "100%",
  },
});
