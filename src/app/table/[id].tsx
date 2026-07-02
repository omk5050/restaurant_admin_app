import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
  ScrollView,
  Alert,
} from "react-native";
import * as Print from "expo-print";

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
import { useSettingsStore } from "@/store/settingsStore";
import { useEventStore } from "@/store/eventStore";
import { MenuItem, MenuSection, PaymentMethod } from "@/types";
import { formatCurrency, formatTime } from "@/utils/formatters";
import { generateInvoiceHTML, generateKotHTML } from "@/utils/invoiceTemplate";

// Desktop menu item image map
const desktopMenuImages: Record<string, number> = {
  "Veg Dum Biryani":        require("../../../assets/images/Veg-Dum-Biryani.jpg"),
  "Egg Dum Biryani":        require("../../../assets/images/egg-dum-biryani.jpg"),
  "French Fries Classic":   require("../../../assets/images/french-fries-classic.jpg"),
  "Peri Peri French Fries": require("../../../assets/images/peri-peri-fries.jpg"),
  "Tripple Choco Bowl":     require("../../../assets/images/triple-choco-bowl.jpg"),
  "Oreo Choco Bowl":        require("../../../assets/images/oreo-choco-bowl.jpg"),
  "Paneer Tikka Biryani":   require("../../../assets/images/Paneer-Tikka-Biryani.jpg"),
  "Paneer Kalimiri Kabab":  require("../../../assets/images/paneer-kalimiri-kabab.jpg"),
  "Chicken Dum Biryani":    require("../../../assets/images/Chicken-Dum-Biryani.jpg"),
  "Mutton Dum Biryani":     require("../../../assets/images/Mutton-Dum-Biryani.jpg"),
  "Chicken Tikka Biryani":  require("../../../assets/images/chicken-Tikka-Biryani.jpg"),
  "Tandoori Biryani":       require("../../../assets/images/Tandoori-Biryani.jpg"),
  "Afghani Tandoor":        require("../../../assets/images/Afghani-Tandoor.jpg"),
  "Chicken Sheekh Kabab":   require("../../../assets/images/Chicken-Sheekh-Kabab.jpg"),
  "Mutton Sheekh Kebab":    require("../../../assets/images/Mutton-Sheekh-Kebab.jpg"),
  "Chicken Tikka Kebab":    require("../../../assets/images/Chicken-Tikka-Kebab.jpg"),
  "Chicken Tangadi Kebab":  require("../../../assets/images/Chicken-Tangadi-Kebab.jpg"),
  "Lahsuni Kebab":          require("../../../assets/images/Lahsuni-Kebab.jpg"),
  "Paneer Tikka Kebab":     require("../../../assets/images/Paneer-Tikka-Kebab.jpg"),
  "Speacial Paradise Kebab":require("../../../assets/images/Speacial-Paradise-Kebab.jpg"),
  "Chicken Hariyali Kebab": require("../../../assets/images/Chicken-Hariyali-Kebab.jpg"),
  "Paneer Kalimiri kebab":  require("../../../assets/images/Paneer-Kalimiri-kebab.jpg"),
  "Chicken Kalimiri kebab": require("../../../assets/images/Chicken-Kalimiri-kebab.jpg"),
  "Tandoor Chicken Red":    require("../../../assets/images/Tandoor-Chicken-Red.jpg"),
  "Tandoor Chicken White":  require("../../../assets/images/Tandoor-chicken-White.jpg"),
  "Tandoori Lollipop":      require("../../../assets/images/Tandoori-Lollipop.jpg"),
  "Reshmi Kebab":           require("../../../assets/images/Reshmi-Kebab.jpg"),
};

export default function TableOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = Number(id);
  const { findTable, ensureOrderForTable, clearTable, setTableStatus } = useTables();
  const { categories, fetchMenu, menuItems: allMenuItems } = useMenu();
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

  const { getOrderForTable, updateOrderItem, updateOrderMetadata, generateBill, closeOrder } = useOrder();
  const createOrder = useOrderStore((state) => state.createOrder);
  const orders = useOrderStore((state) => state.orders);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  const table = findTable(tableId);
  const order = getOrderForTable(tableId);
  const initialized = useRef(false);

  // KOT success modal state
  const [kotModalVisible, setKotModalVisible] = useState(false);
  // Clear table confirm modal state
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  // Clear reason text
  const [clearReason, setClearReason] = useState("");
  // KOT item removal reason modal
  const [kotRemovalReasonVisible, setKotRemovalReasonVisible] = useState(false);
  const [kotRemovalReason, setKotRemovalReason] = useState("");
  const [kotRemovalItemName, setKotRemovalItemName] = useState("");
  const kotRemovalCallback = useRef<((reason: string) => void) | null>(null);
  // Error modal state
  const [errorModal, setErrorModal] = useState("");
  const addEvent = useEventStore((state) => state.addEvent);

  // Responsive state
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Desktop specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  // Tax & Discount local state (desktop only, session-only — not persisted)
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [discountInputText, setDiscountInputText] = useState("");
  const [localGuests, setLocalGuests] = useState(4);
  // Kitchen comment (persists for session, sent to KOT only)
  const [orderComment, setOrderComment] = useState("");

  // Dine In / Pick Up selection
  const [activeOrderType, setActiveOrderType] = useState<"dine-in" | "pick-up">("dine-in");

  // Split Bill Modal State
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [paidSplits, setPaidSplits] = useState<{ [key: number]: PaymentMethod }>({});

  // Pay Bill Modal State (Direct checkout selector)
  const [payBillModalVisible, setPayBillModalVisible] = useState(false);

  // Custom Item Modal State
  const [customItemModalVisible, setCustomItemModalVisible] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemNameError, setCustomItemNameError] = useState("");
  const [customItemPriceError, setCustomItemPriceError] = useState("");

  // Sync checked items on load
  useEffect(() => {
    if (order?.items) {
      const next = new Set<string>();
      order.items.forEach((item) => next.add(item.menuItemId));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckedItems(next);
    }
  }, [order?.items]);

  // Sync guests count on load
  useEffect(() => {
    if (order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalGuests(order.guests || 4);
      setActiveOrderType(order.isTakeaway ? "pick-up" : "dine-in");
    }
  }, [order]);

  // Fetch categories, items and orders from database on mount
  useEffect(() => {
    fetchMenu();
    fetchOrders();
  }, [fetchMenu, fetchOrders]);

  // Sync selectedCategory to first available category of the section once loaded.
  // Skip if selectedCategory is "" — user has explicitly deselected all categories.
  useEffect(() => {
    if (selectedCategory === "") return; // user deselected — don't auto-reselect
    const subCats = getSubCategories(categories, selectedSection);
    if (subCats.length > 0) {
      const exists = subCats.some((cat) => cat.id === selectedCategory);
      if (!exists) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCategory(subCats[0].id);
      }
    }
  }, [categories, selectedSection, selectedCategory]);

  // Auto-initialize orders (both Dine-In and Takeaway) on load without prompting customer details
  useEffect(() => {
    if (Number.isFinite(tableId) && table && !initialized.current) {
      initialized.current = true;
      const isTakeaway = table.name.startsWith("T");
      const currentOrder = getOrderForTable(tableId);

      if (!currentOrder) {
        createOrder(tableId, isTakeaway ? 1 : 4, isTakeaway, "", "")
          .then((newOrder) => {
            useTableStore.getState().setTableOrder(tableId, newOrder.id);
          })
          .catch((err) => {
            console.error("Failed to auto create order:", err);
            setErrorModal(err.message || "Failed to start order session.");
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, table]);

  // Resolve table status dynamically
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

  // IDs of categories belonging to the currently selected section (used to scope deselect)
  const sectionCategoryIds = useMemo(
    () => new Set(getSubCategories(categories, selectedSection).map((c) => c.id)),
    [categories, selectedSection],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // When no category is selected, scope to current section only
      if (!selectedCategory && !sectionCategoryIds.has(item.categoryId)) return false;
      // Food type filter
      if (selectedFoodType === "veg" && !item.isVeg) return false;
      if (selectedFoodType === "non-veg" && item.isVeg) return false;
      // Short code search: exact prefix match on shortCode only
      if (shortCode.trim()) {
        const sc = shortCode.toLowerCase().trim();
        return item.shortCode ? item.shortCode.toLowerCase().startsWith(sc) : false;
      }
      // Name search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [items, selectedFoodType, searchQuery, shortCode, selectedCategory, sectionCategoryIds]);

  // Effective totals applying local tax/discount overrides (desktop only)
  const discountAmount = useMemo(() => {
    if (!order || discountValue <= 0) return 0;
    if (discountType === "percent") return (order.subtotal * discountValue) / 100;
    return Math.min(discountValue, order.subtotal);
  }, [order, discountValue, discountType]);

  const effectiveTotal = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.subtotal - discountAmount + (taxEnabled ? order.gstAmount : 0));
  }, [order, discountAmount, taxEnabled]);

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
    await setTableStatus(tableId, "active");
    router.replace("/(tabs)" as never);
  }

  // Clear Table: show custom confirm modal
  function handleClearTable() {
    setClearReason("");
    setClearConfirmVisible(true);
  }

  async function executeClearTable() {
    setClearConfirmVisible(false);
    // Log event with reason to queue before clearing
    if (table) {
      addEvent({
        type: "table_cleared",
        tableName: table.name,
        tableId,
        reason: clearReason.trim() || "No reason provided",
      });
    }
    await clearTable(tableId);
    await useOrderStore.getState().fetchOrders();
    await useOrderStore.getState().fetchAnalytics();
    router.replace("/(tabs)" as never);
  }

  // KOT: detect removed items and prompt for removal reason
  const prevKotItemsRef = useRef<{ menuItemId: string; name: string; qty: number }[]>([]);

  // Seed initial KOT items ref when order items load
  useEffect(() => {
    if (order?.items && prevKotItemsRef.current.length === 0) {
      prevKotItemsRef.current = order.items.map((i) => ({ menuItemId: i.menuItemId, name: i.name, qty: i.qty }));
    }
  }, [order?.items]);

  async function handleKot() {
    if (!order) return;
    if (order.items.length === 0) {
      setErrorModal("Add at least one item before printing KOT.");
      return;
    }

    // Check if any items were removed since last KOT
    const prev = prevKotItemsRef.current;
    const removedItems = prev.filter((prevItem) => {
      const curr = order.items.find((i) => i.menuItemId === prevItem.menuItemId);
      return !curr || curr.qty < prevItem.qty;
    });

    if (removedItems.length > 0 && prev.length > 0) {
      // Prompt reason for first removed item (or all)
      const removedNames = removedItems.map((i) => i.name).join(", ");
      await new Promise<void>((resolve) => {
        setKotRemovalItemName(removedNames);
        setKotRemovalReason("");
        kotRemovalCallback.current = (reason: string) => {
          if (table) {
            removedItems.forEach((item) => {
              addEvent({
                type: "kot_item_removed",
                tableName: table.name,
                tableId,
                reason: reason.trim() || "No reason provided",
                detail: item.name,
              });
            });
          }
          resolve();
        };
        setKotRemovalReasonVisible(true);
      });
    }

    // Update ref for next KOT comparison
    prevKotItemsRef.current = order.items.map((i) => ({ menuItemId: i.menuItemId, name: i.name, qty: i.qty }));

    await setTableStatus(tableId, "active");
    setKotModalVisible(true);
  }

  function handleKotDismiss() {
    setKotModalVisible(false);
    router.replace("/(tabs)" as never);
  }

  // Add custom item
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
    updateOrderItem(order.id, customItem, 1);
  }

  // Guests modification
  async function incrementGuests() {
    if (!order) return;
    const next = localGuests + 1;
    setLocalGuests(next);
    await updateOrderMetadata(order.id, { guests: next });
  }

  async function decrementGuests() {
    if (!order) return;
    if (localGuests <= 1) return;
    const next = localGuests - 1;
    setLocalGuests(next);
    await updateOrderMetadata(order.id, { guests: next });
  }

  const settings = useSettingsStore((state) => state.settings);

  // Print helper for HTML
  const triggerPrintHtml = (htmlContent: string) => {
    if (Platform.OS === "web") {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        }, 500);
      }
    } else {
      Print.printAsync({ html: htmlContent }).catch((err) => {
        console.error("Print failed:", err);
      });
    }
  };


  // Order Type Change Handler (Dine In / Pick Up only)
  async function handleOrderTypeChange(type: "dine-in" | "pick-up") {
    if (!order) return;
    setActiveOrderType(type);
    const isTakeaway = type !== "dine-in";
    await updateOrderMetadata(order.id, { isTakeaway });
  }

  // Desktop Save Handler (Saves changes as open, returns to dashboard)
  async function handleSaveOrder() {
    if (!order) return;
    await setTableStatus(tableId, "active");
    router.replace("/(tabs)" as never);
  }

  // Desktop Save & Print (Generates draft bill, prints, returns to dashboard)
  async function handleSaveAndPrint() {
    if (!order) return;
    await generateBill(order.id);
    const targetInvoice = {
      id: `preview_${order.id}`,
      orderId: order.id,
      tableId: order.tableId,
      orderNo: order.orderNo,
      items: order.items,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      total: order.total,
      paymentMethod: "cash",
      createdAt: new Date().toISOString(),
      isTakeaway: order.isTakeaway,
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
    };
    triggerPrintHtml(generateInvoiceHTML(targetInvoice as any, settings));
    router.replace("/(tabs)" as never);
  }

  // Desktop Direct Checkout payment handler
  async function executePayBill(method: PaymentMethod) {
    if (!order) return;
    try {
      const finalGst = taxEnabled ? order.gstAmount : 0;
      const invoice = await closeOrder(order.id, method, undefined, finalGst, effectiveTotal);
      setPayBillModalVisible(false);
      router.replace(`/invoice/${invoice.orderId}` as never);
    } catch (err: any) {
      setErrorModal(err.message || "Failed to process payment.");
    }
  }

  // Split pay share handler
  async function handleSplitPay(splitIdx: number, method: PaymentMethod) {
    if (!order) return;
    const nextPaid = { ...paidSplits, [splitIdx]: method };
    setPaidSplits(nextPaid);

    const paidCount = Object.keys(nextPaid).length;
    if (paidCount === splitCount) {
      try {
        const finalGst = taxEnabled ? order.gstAmount : 0;
        const splitsPayload = Array.from({ length: splitCount }).map((_, idx) => ({
          method: nextPaid[idx],
          amount: effectiveTotal / splitCount
        }));
        const invoice = await closeOrder(order.id, method, splitsPayload, finalGst, effectiveTotal);
        setSplitModalVisible(false);
        setPaidSplits({});
        router.replace(`/invoice/${invoice.orderId}` as never);
      } catch (err: any) {
        setErrorModal(err.message || "Failed to process split payment.");
      }
    } else {
      Alert.alert(
        "Split Share Paid",
        `Split #${splitIdx + 1} paid ${formatCurrency(effectiveTotal / splitCount)} via ${method.toUpperCase()}.`
      );
    }
  }

  // Custom Item Modal actions
  function executeAddCustomItem() {
    let valid = true;
    setCustomItemNameError("");
    setCustomItemPriceError("");

    if (!customItemName.trim()) {
      setCustomItemNameError("Item name is required.");
      valid = false;
    }
    const parsedPrice = parseFloat(customItemPrice);
    if (!customItemPrice.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setCustomItemPriceError("Enter a valid price greater than 0.");
      valid = false;
    }

    if (!valid) return;

    handleAddCustomItem(customItemName.trim(), parsedPrice);
    setCustomItemModalVisible(false);
    setCustomItemName("");
    setCustomItemPrice("");
  }

  function handleCustomItemModalClose() {
    setCustomItemModalVisible(false);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemNameError("");
    setCustomItemPriceError("");
  }

  if (!table) {
    return (
      <View style={styles.emptyScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Loading table...</Text>
      </View>
    );
  }

  // If table exists but order is still being created, show the full UI skeleton
  // with a lightweight overlay spinner instead of blocking the entire screen
  const isCreatingOrder = !order;

  if (tableStatus === "paid") {
    return (
      <View style={styles.paidScreen}>
        <View style={styles.paidCard}>
          <Text style={styles.paidEmoji}>✅</Text>
          <Text style={styles.paidTitle}>{table.name} is Paid</Text>
          <Text style={styles.paidSubtitle}>
            Order {order?.orderNo ?? "---"} was completed for {formatCurrency(order?.total ?? 0)}.
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

  // Render Desktop Layout (Mockup replica)
  if (isDesktop) {
    const totalSelectedQty = order?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    // Dashboard stats (reactive via top-level hook)
    const allAvgPrice = allMenuItems.length > 0
      ? Math.round(allMenuItems.reduce((sum, m) => sum + m.price, 0) / allMenuItems.length)
      : 0;
    const allVegCount = allMenuItems.filter((m) => m.isVeg).length;
    const liveOrdersCount = orders.filter((o) => o.status !== "paid").length;

    return (
      <View style={[styles.desktopScreen, { flexDirection: "row" }]}>
        {/* Left Column (Main workspace area) */}
        <View style={{ flex: 1, flexDirection: "column", height: "100%", backgroundColor: "#f8fafc" }}>
          {/* Dashboard Section (Stretched horizontally) */}
          <View style={styles.desktopDashboardSection}>
            {/* ── Menu Catalog Dashboard Header ── */}
            <View style={styles.menuCatalogBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuCatalogKicker}>MENU CONTROL</Text>
                <Text style={styles.menuCatalogTitle}>Kitchen catalog</Text>
                <Text style={styles.menuCatalogSubtitle}>Fast edits, quick scanning, live availability.</Text>
              </View>
              <View style={styles.menuCatalogBadge}>
                <Text style={styles.menuCatalogBadgeValue}>{allMenuItems.length}</Text>
                <Text style={styles.menuCatalogBadgeLabel}>items</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.menuCatalogStatsRow}>
              <View style={styles.menuCatalogStatCard}>
                <Text style={styles.menuCatalogStatValue}>{categories.length}</Text>
                <Text style={styles.menuCatalogStatLabel}>Categories</Text>
              </View>
              <View style={styles.menuCatalogStatCard}>
                <Text style={[styles.menuCatalogStatValue, { color: "#F97316" }]}>{formatCurrency(allAvgPrice)}</Text>
                <Text style={styles.menuCatalogStatLabel}>Avg price</Text>
              </View>
              <View style={styles.menuCatalogStatCard}>
                <Text style={styles.menuCatalogStatValue}>{allVegCount}</Text>
                <Text style={styles.menuCatalogStatLabel}>Veg items</Text>
              </View>
            </View>
          </View>

          {/* Menu Workspace (Row) */}
          <View style={[styles.desktopWorkspace, { paddingBottom: 0 }]}>
            {/* Left Category Sidebar (dropped till menu section) */}
            <View style={styles.desktopLeftSidebar}>
              {/* Sidebar food type tabs (Veg / All / Non-Veg) */}
              <View style={styles.desktopSidebarFoodTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.desktopSidebarFoodTypeBtn,
                    selectedFoodType === "veg" && styles.desktopSidebarFoodTypeBtnVegActive,
                  ]}
                  onPress={() => setSelectedFoodType(selectedFoodType === "veg" ? "all" : "veg")}
                >
                  <Text
                    style={[
                      styles.desktopSidebarFoodTypeText,
                      selectedFoodType === "veg" && styles.desktopSidebarFoodTextVegActive,
                    ]}
                  >
                    Veg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.desktopSidebarFoodTypeBtn,
                    selectedFoodType === "all" && styles.desktopSidebarFoodTypeBtnAllActive,
                  ]}
                  onPress={() => setSelectedFoodType("all")}
                >
                  <Text
                    style={[
                      styles.desktopSidebarFoodTypeText,
                      selectedFoodType === "all" && styles.desktopSidebarFoodTextAllActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.desktopSidebarFoodTypeBtn,
                    { flex: 1.4 },
                    selectedFoodType === "non-veg" && styles.desktopSidebarFoodTypeBtnNonVegActive,
                  ]}
                  onPress={() => setSelectedFoodType(selectedFoodType === "non-veg" ? "all" : "non-veg")}
                >
                  <Text
                    style={[
                      styles.desktopSidebarFoodTypeText,
                      selectedFoodType === "non-veg" && styles.desktopSidebarFoodTextNonVegActive,
                    ]}
                  >
                    Non Veg
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable Category List */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {categories.map((cat) => {
                  const isActive = cat.id === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(isActive ? "" : cat.id)}
                      style={[
                        styles.desktopCategoryItem,
                        isActive && styles.desktopCategoryItemActive,
                        styles.desktopCategoryItemWithBorder,
                      ]}
                    >
                      <Text style={styles.desktopCategoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.desktopCategoryItemText,
                          isActive && styles.desktopCategoryItemTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Middle Menu Items Grid */}
            <View style={styles.desktopMiddlePanel}>
              {/* Menu Header with Live Orders Badge */}
              <View style={styles.desktopMenuHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.desktopMenuTitleIcon}>🍽️</Text>
                  <Text style={styles.desktopMenuTitleText}>Menu</Text>
                </View>
                {liveOrdersCount > 0 && (
                  <View style={styles.desktopLiveOrdersBadge}>
                    <Text style={styles.desktopLiveOrdersBadgeText}>{liveOrdersCount} live orders</Text>
                  </View>
                )}
              </View>

              {/* Compact Search Row with Orange Icon Button */}
              <View style={styles.desktopSearchRow}>
                <View style={styles.desktopSearchInputContainer}>
                  <TextInput
                    style={styles.desktopSearchInput}
                    placeholder="Search item"
                    placeholderTextColor={COLORS.textSec}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      // Clear short code when name search is used
                      if (text) setShortCode("");
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.desktopSearchBtn}
                  onPress={() => {}}
                  activeOpacity={0.7}
                >
                  <Text style={styles.desktopSearchBtnText}>🔍</Text>
                </TouchableOpacity>

                {/* Short code input (compact) */}
                <View style={styles.desktopShortCodeContainer}>
                  <TextInput
                    style={styles.desktopShortCodeInput}
                    placeholder="Short Code"
                    placeholderTextColor={COLORS.textSec}
                    value={shortCode}
                    onChangeText={(text) => {
                      setShortCode(text);
                      // Clear name search when short code is used
                      if (text) setSearchQuery("");
                    }}
                  />
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.desktopItemsScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.desktopItemsGrid}>
                  {filteredItems.map((item) => {
                    const qty = qtyById.get(item.id) || 0;
                    const imgSrc = item.imageUrl
                      ? { uri: item.imageUrl }
                      : desktopMenuImages[item.name as keyof typeof desktopMenuImages] ||
                        require("../../../assets/images/Veg-Dum-Biryani.jpg");
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.desktopMenuItemCard, qty > 0 && styles.desktopMenuItemCardSelected]}
                        onPress={() => changeQty(item, qty + 1)}
                        activeOpacity={0.75}
                      >
                        {/* Veg/Non-veg indicator strip on the left edge */}
                        <View
                          style={[
                            styles.desktopMenuItemCardIndicator,
                            { backgroundColor: item.isVeg ? "#22c55e" : "#ef4444" },
                          ]}
                        />
                        {/* Image on left */}
                        <Image
                          source={imgSrc}
                          style={styles.desktopMenuItemCardImage}
                          resizeMode="cover"
                        />
                        {/* Text on right */}
                        <View style={styles.desktopMenuItemCardInfo}>
                          <Text style={styles.desktopMenuItemCardText} numberOfLines={3}>
                            {item.name}
                          </Text>
                          <Text style={styles.desktopMenuItemCardPrice}>{formatCurrency(item.price)}</Text>
                        </View>
                        {qty > 0 && (
                          <View style={styles.desktopMenuItemQtyBadge}>
                            <Text style={styles.desktopMenuItemQtyBadgeText}>{qty}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Bottom Order Summary & Custom Actions Bar */}
          <View style={styles.desktopBottomBar}>
            {/* Left: Table Order Back button (shortened/compact) */}
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <TouchableOpacity
                style={styles.desktopBottomBackBtn}
                onPress={() => router.replace("/(tabs)" as never)}
                activeOpacity={0.7}
              >
                <Text style={styles.desktopBottomBackBtnText}>← Table Order</Text>
              </TouchableOpacity>
            </View>

            {/* Middle: Order Summary (centered) */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <View style={styles.desktopBottomSummaryBadge}>
                <Text style={styles.desktopBottomSummaryBadgeText}>
                  Order Summary ({totalSelectedQty})
                </Text>
              </View>
            </View>

            {/* Right: Total (at the right end) */}
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.desktopBottomSummaryTotal}>Total: {formatCurrency(effectiveTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Right Billing Sidebar (covers full height) */}
        <View style={styles.desktopRightPanel}>
          {/* Top widgets above Dine In / Pick Up tabs */}
          <View style={styles.rightTopWidgetsGrid}>
            <View style={styles.rightTopWidgetsRow}>
              {/* Guests widget */}
              <View style={styles.rightTopWidgetCard}>
                <Text style={styles.desktopWidgetIcon}>👥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightWidgetLabel}>Guests</Text>
                  <View style={styles.guestsCounterRow}>
                    <TouchableOpacity onPress={decrementGuests} style={styles.guestsCounterBtn}>
                      <Text style={styles.guestsCounterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.desktopWidgetValue}>{localGuests}</Text>
                    <TouchableOpacity onPress={incrementGuests} style={styles.guestsCounterBtn}>
                      <Text style={styles.guestsCounterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Opened At widget */}
              <View style={styles.rightTopWidgetCard}>
                <Text style={styles.desktopWidgetIcon}>🕐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightWidgetLabel}>Opened At</Text>
                  <Text style={styles.desktopWidgetValue}>{order ? formatTime(order.openedAt) : "--:--"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rightTopWidgetsRow}>
              {/* Order No widget */}
              <View style={styles.rightTopWidgetCard}>
                <Text style={styles.desktopWidgetIcon}>📋</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightWidgetLabel}>Order No.</Text>
                  <Text style={styles.desktopWidgetValue}>{order?.orderNo ?? "---"}</Text>
                </View>
              </View>

              {/* Clear Button — direct flex child so it matches rightTopWidgetCard height exactly */}
              <TouchableOpacity style={styles.rightClearBtn} onPress={handleClearTable}>
                <Text style={styles.desktopWidgetIcon}>🗑️</Text>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text style={styles.rightClearBtnText}>Clear</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.desktopRightMiddleSection}>
            {/* Type Tabs (Dine In & Pick Up only, emojis and delivery removed) */}
            <View style={styles.desktopRightTabs}>
              <TouchableOpacity
                style={[styles.desktopRightTab, activeOrderType === "dine-in" && styles.desktopRightTabActive]}
                onPress={() => handleOrderTypeChange("dine-in")}
              >
                <Text style={[styles.desktopRightTabText, activeOrderType === "dine-in" && styles.desktopRightTabTextActive]}>
                  Dine In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.desktopRightTab, activeOrderType === "pick-up" && styles.desktopRightTabActive]}
                onPress={() => handleOrderTypeChange("pick-up")}
              >
                <Text style={[styles.desktopRightTabText, activeOrderType === "pick-up" && styles.desktopRightTabTextActive]}>
                  Pick Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* White receipt card wrapper */}
            <View style={styles.desktopOrderListCard}>
              {/* Sub-Header Details (Avatar icons removed) */}
              <View style={styles.desktopRightSubHeader}>
                <Text style={[styles.desktopRightTitle, { fontWeight: "bold", fontSize: 18 }]}>
                  {isCreatingOrder ? "Loading..." : (order.isTakeaway ? `Takeaway: #${order.orderNo.replace("#", "")}` : `Table: ${table.name}`)}
                </Text>
                <View style={styles.desktopRightIcons}>
                  <View style={styles.desktopRightBadge}>
                    <Text style={styles.desktopRightBadgeText}>
                      {activeOrderType === "dine-in" ? "Dine In" : "Pick Up"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Columns Header */}
              <View style={styles.desktopRightTableHeader}>
                <Text style={[styles.desktopColText, { width: "45%" }]}>ITEMS</Text>
                <Text style={[styles.desktopColText, { width: "15%", textAlign: "center" }]}>CHECK ITEMS</Text>
                <Text style={[styles.desktopColText, { width: "22%", textAlign: "center" }]}>QTY.</Text>
                <Text style={[styles.desktopColText, { width: "18%", textAlign: "right" }]}>PRICE</Text>
              </View>

              {/* Scrollable Order Items List */}
              {isCreatingOrder ? (
                <View style={styles.desktopEmptyOrder}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.desktopEmptyOrderTitle}>Setting up table...</Text>
                  <Text style={styles.desktopEmptyOrderText}>Ready in a moment</Text>
                </View>
              ) : order.items.length === 0 ? (
                <View style={styles.desktopEmptyOrder}>
                  <Text style={styles.desktopEmptyOrderEmoji}>🍽️</Text>
                  <Text style={styles.desktopEmptyOrderTitle}>No Item Selected</Text>
                  <Text style={styles.desktopEmptyOrderText}>
                    Please select item from left menu item
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.desktopRightTableScroll} showsVerticalScrollIndicator={false}>
                  {order.items.map((item) => {
                    const isChecked = checkedItems.has(item.menuItemId);
                    return (
                      <View key={item.menuItemId} style={styles.desktopRightTableRow}>
                        <View style={{ width: "45%" }}>
                          <Text style={styles.desktopItemName} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>
                        <View style={{ width: "15%", alignItems: "center" }}>
                          <TouchableOpacity
                            style={styles.desktopRowCheckbox}
                            onPress={() => {
                              const next = new Set(checkedItems);
                              if (next.has(item.menuItemId)) {
                                next.delete(item.menuItemId);
                              } else {
                                next.add(item.menuItemId);
                              }
                              setCheckedItems(next);
                            }}
                          >
                            <View
                              style={[
                                styles.desktopRowCheckboxBox,
                                isChecked && styles.desktopRowCheckboxBoxChecked,
                              ]}
                            >
                              {isChecked && <Text style={styles.desktopRowCheckboxCheckmark}>✓</Text>}
                            </View>
                          </TouchableOpacity>
                        </View>
                        <View style={{ width: "22%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <TouchableOpacity
                            style={styles.desktopRowQtyBtn}
                            onPress={() => {
                              const menuItem = { id: item.menuItemId, name: item.name, price: item.price } as MenuItem;
                              changeQty(menuItem, Math.max(0, item.qty - 1));
                            }}
                          >
                            <Text style={styles.desktopRowQtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.desktopRowQtyVal}>{item.qty}</Text>
                          <TouchableOpacity
                            style={styles.desktopRowQtyBtn}
                            onPress={() => {
                              const menuItem = { id: item.menuItemId, name: item.name, price: item.price } as MenuItem;
                              changeQty(menuItem, item.qty + 1);
                            }}
                          >
                            <Text style={styles.desktopRowQtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ width: "18%", alignItems: "flex-end" }}>
                          <Text style={styles.desktopItemPrice}>
                            {formatCurrency(item.price * item.qty)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Bottom Billing Details Panel */}
          <View style={styles.desktopRightFooter}>
            {/* Totals breakdown */}
            {(discountValue > 0 || !taxEnabled) && (
              <View style={{ gap: 2, marginBottom: 4 }}>
                {discountValue > 0 && (
                  <View style={styles.desktopSplitRow}>
                    <Text style={{ fontSize: 11, color: COLORS.textSec }}>Discount</Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.primary }}>-{formatCurrency(discountAmount)}</Text>
                  </View>
                )}
                {!taxEnabled && (
                  <View style={styles.desktopSplitRow}>
                    <Text style={{ fontSize: 11, color: COLORS.textSec }}>GST ({settings.gstPercent}%)</Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.gray }}>Disabled</Text>
                  </View>
                )}
              </View>
            )}
            <View style={[styles.desktopSplitRow, { justifyContent: "flex-end", marginBottom: 6 }]}>
              <Text style={styles.desktopRightTotal}>Total: {formatCurrency(effectiveTotal)}</Text>
            </View>

            {/* Operational Action Buttons (Save, Save & Print, Pay Bill) */}
            <View style={styles.desktopActionGrid}>
              <View style={styles.desktopActionRow}>
                <TouchableOpacity style={styles.desktopActionBtnSave} onPress={handleSaveOrder}>
                  <Text style={styles.desktopActionBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.desktopActionBtnSave} onPress={handleSaveAndPrint}>
                  <Text style={styles.desktopActionBtnText}>Save & Print</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopActionBtnSave, { backgroundColor: COLORS.green }]}
                  onPress={() => setPayBillModalVisible(true)}
                >
                  <Text style={styles.desktopActionBtnText}>Pay Bill</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.desktopActionRow}>
                <TouchableOpacity style={styles.desktopActionBtnKOT} onPress={handleKot}>
                  <Text style={styles.desktopActionBtnText}>KOT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.desktopActionBtnKOT} onPress={async () => { await handleKot(); if (order) triggerPrintHtml(generateKotHTML(order, table, settings, orderComment)); }}>
                  <Text style={styles.desktopActionBtnText}>KOT & Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.desktopActionBtnHold} onPress={handleHold}>
                  <Text style={styles.desktopActionBtnHoldText}>Hold</Text>
                </TouchableOpacity>
              </View>
              {/* Row 3: Split Bill | TAX toggle | Discount */}
              <View style={styles.desktopActionRow}>
                <TouchableOpacity
                  style={[styles.desktopActionBtnHold, { flex: 1, borderColor: COLORS.primary }]}
                  onPress={() => setSplitModalVisible(true)}
                >
                  <Text style={[styles.desktopActionBtnHoldText, { color: COLORS.primary }]}>🥞 Split Bill</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopActionBtnHold, { flex: 1, borderColor: taxEnabled ? COLORS.green : "#cbd5e1", backgroundColor: taxEnabled ? COLORS.greenLight : COLORS.white }]}
                  onPress={() => setTaxEnabled(!taxEnabled)}
                >
                  <Text style={[styles.desktopActionBtnHoldText, { color: taxEnabled ? COLORS.green : "#94a3b8" }]}>
                    {taxEnabled ? "☑ TAX" : "☐ TAX"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopActionBtnHold, { flex: 1, borderColor: discountValue > 0 ? COLORS.primary : "#cbd5e1", backgroundColor: discountValue > 0 ? COLORS.primaryLight : COLORS.white }]}
                  onPress={() => {
                    setDiscountInputText(discountValue > 0 ? String(discountValue) : "");
                    setDiscountModalVisible(true);
                  }}
                >
                  <Text style={[styles.desktopActionBtnHoldText, { color: discountValue > 0 ? COLORS.primary : "#64748b" }]}>
                    {discountValue > 0
                      ? `🏷 -${discountType === "percent" ? discountValue + "%" : "₹" + discountValue}`
                      : "🏷 Discount"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comment Row */}
              <View style={styles.desktopCommentRow}>
                <Text style={styles.desktopCommentIcon}>✏️</Text>
                <TextInput
                  style={styles.desktopCommentInput}
                  placeholder="Add kitchen note... (KOT only)"
                  placeholderTextColor="#94a3b8"
                  value={orderComment}
                  onChangeText={setOrderComment}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Split Bill Modal (Select payment method per split share) */}
        <Modal
          visible={splitModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSplitModalVisible(false);
            setPaidSplits({});
          }}
        >
          <View style={styles.desktopCustomItemOverlay}>
            <View style={styles.desktopCustomItemCard}>
              <Text style={styles.desktopCustomItemTitle}>Split Bill Equally</Text>
              <Text style={styles.desktopCustomItemSubtitle}>
                Select split count and process custom payment methods per share. Total: {formatCurrency(effectiveTotal)}
              </Text>

              <View style={[styles.guestsCounterRow, { justifyContent: "center", marginVertical: 10 }]}>
                <TouchableOpacity
                  onPress={() => {
                    if (splitCount > 2) {
                      setSplitCount(splitCount - 1);
                      setPaidSplits({});
                    }
                  }}
                  style={styles.guestsCounterBtn}
                >
                  <Text style={styles.guestsCounterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.desktopWidgetValue, { fontSize: 18, marginHorizontal: 20 }]}>
                  {splitCount} Splits
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (splitCount < 12) {
                      setSplitCount(splitCount + 1);
                      setPaidSplits({});
                    }
                  }}
                  style={styles.guestsCounterBtn}
                >
                  <Text style={styles.guestsCounterBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ textAlign: "center", fontWeight: "800", color: "#ef4444", fontSize: 15, marginBottom: 12 }}>
                Each Share: {formatCurrency(effectiveTotal / splitCount)}
              </Text>

              <ScrollView style={{ maxHeight: 240, marginBottom: 12 }}>
                {Array.from({ length: splitCount }).map((_, idx) => {
                  const method = paidSplits[idx];
                  const isPaid = method !== undefined;
                  return (
                    <View key={idx} style={styles.desktopSplitPaymentRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.desktopSplitRowText}>Split #{idx + 1}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textSec }}>
                          Share: {formatCurrency(effectiveTotal / splitCount)}
                        </Text>
                      </View>
                      {isPaid ? (
                        <View style={{ backgroundColor: "#ecfdf5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
                          <Text style={{ color: "#16a34a", fontWeight: "800", fontSize: 11 }}>
                            ✓ Paid ({method.toUpperCase()})
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          <TouchableOpacity
                            style={[styles.desktopSplitPayBtn, { backgroundColor: "#22c55e" }]}
                            onPress={() => handleSplitPay(idx, "cash")}
                          >
                            <Text style={styles.desktopSplitPayBtnText}>Cash</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.desktopSplitPayBtn, { backgroundColor: "#3b82f6" }]}
                            onPress={() => handleSplitPay(idx, "card")}
                          >
                            <Text style={styles.desktopSplitPayBtnText}>Card</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.desktopSplitPayBtn, { backgroundColor: "#a855f7" }]}
                            onPress={() => handleSplitPay(idx, "upi")}
                          >
                            <Text style={styles.desktopSplitPayBtnText}>UPI</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.desktopSplitPayBtn, { backgroundColor: "#eab308" }]}
                            onPress={() => handleSplitPay(idx, "credit")}
                          >
                            <Text style={styles.desktopSplitPayBtnText}>Due</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.desktopCustomItemCancelBtn}
                onPress={() => {
                  setSplitModalVisible(false);
                  setPaidSplits({});
                }}
              >
                <Text style={styles.desktopCustomItemCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Pay Bill Modal (Dedicated payment selector) */}
        <Modal
          visible={payBillModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPayBillModalVisible(false)}
        >
          <View style={styles.desktopCustomItemOverlay}>
            <View style={styles.desktopCustomItemCard}>
              <Text style={styles.desktopCustomItemTitle}>Process Payment</Text>
              <Text style={styles.desktopCustomItemSubtitle}>
                Select payment method to close this bill session. Total: {formatCurrency(order?.total ?? 0)}
              </Text>

              <View style={{ gap: 10, marginVertical: 12 }}>
                <TouchableOpacity
                  style={[styles.desktopPayModalOptionBtn, { backgroundColor: "#22c55e" }]}
                  onPress={() => executePayBill("cash")}
                >
                  <Text style={styles.desktopPayModalOptionText}>💵 Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopPayModalOptionBtn, { backgroundColor: "#3b82f6" }]}
                  onPress={() => executePayBill("card")}
                >
                  <Text style={styles.desktopPayModalOptionText}>💳 Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopPayModalOptionBtn, { backgroundColor: "#a855f7" }]}
                  onPress={() => executePayBill("upi")}
                >
                  <Text style={styles.desktopPayModalOptionText}>📱 UPI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.desktopPayModalOptionBtn, { backgroundColor: "#eab308" }]}
                  onPress={() => executePayBill("credit")}
                >
                  <Text style={styles.desktopPayModalOptionText}>📄 Due (Credit)</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.desktopCustomItemCancelBtn}
                onPress={() => setPayBillModalVisible(false)}
              >
                <Text style={styles.desktopCustomItemCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Custom Item Modal */}
        <Modal
          visible={customItemModalVisible}
          animationType="fade"
          transparent
          onRequestClose={handleCustomItemModalClose}
        >
          <View style={styles.desktopCustomItemOverlay}>
            <View style={styles.desktopCustomItemCard}>
              <Text style={styles.desktopCustomItemTitle}>Add Custom Item</Text>
              <Text style={styles.desktopCustomItemSubtitle}>
                This custom item will only be added to this active bill session.
              </Text>

              <View style={styles.desktopCustomItemField}>
                <Text style={styles.desktopCustomItemFieldLabel}>Item Name</Text>
                <TextInput
                  style={[styles.desktopCustomItemInput, !!customItemNameError && { borderColor: "#ef4444" }]}
                  placeholder="e.g. Special Dessert"
                  placeholderTextColor="#cbd5e1"
                  value={customItemName}
                  onChangeText={(text) => {
                    setCustomItemName(text);
                    setCustomItemNameError("");
                  }}
                />
                {!!customItemNameError && (
                  <Text style={styles.desktopCustomItemErrorText}>{customItemNameError}</Text>
                )}
              </View>

              <View style={styles.desktopCustomItemField}>
                <Text style={styles.desktopCustomItemFieldLabel}>Price (₹)</Text>
                <TextInput
                  style={[styles.desktopCustomItemInput, !!customItemPriceError && { borderColor: "#ef4444" }]}
                  placeholder="e.g. 150"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  value={customItemPrice}
                  onChangeText={(text) => {
                    setCustomItemPrice(text);
                    setCustomItemPriceError("");
                  }}
                />
                {!!customItemPriceError && (
                  <Text style={styles.desktopCustomItemErrorText}>{customItemPriceError}</Text>
                )}
              </View>

              <View style={styles.desktopCustomItemActions}>
                <TouchableOpacity style={styles.desktopCustomItemCancelBtn} onPress={handleCustomItemModalClose}>
                  <Text style={styles.desktopCustomItemCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.desktopCustomItemAddBtn} onPress={executeAddCustomItem}>
                  <Text style={styles.desktopCustomItemAddText}>Add to Bill</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Unified Overlays/Modals */}
        {/* Error Modal */}
        <Modal visible={!!errorModal} transparent animationType="fade" onRequestClose={() => setErrorModal("")}>
          <View style={styles.kotOverlay}>
            <View style={styles.kotCard}>
              <Text style={styles.kotEmoji}>⚠️</Text>
              <Text style={[styles.kotTitle, { color: "#f59e0b" }]}>Alert</Text>
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
                Kitchen Order Ticket for {table.name} ({order?.orderNo ?? "---"}) has been sent to the kitchen.
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
              <View style={styles.reasonInputWrapper}>
                <Text style={styles.reasonInputLabel}>Reason for clearing (optional)</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g. Customer left, Wrong order..."
                  placeholderTextColor="#94a3b8"
                  value={clearReason}
                  onChangeText={setClearReason}
                  multiline
                  numberOfLines={2}
                />
              </View>
              <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#ef4444" }]} onPress={executeClearTable}>
                <Text style={styles.kotDismissText}>Yes, Clear Table</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#f1f5f9", marginTop: 0 }]} onPress={() => setClearConfirmVisible(false)}>
                <Text style={[styles.kotDismissText, { color: "#64748b" }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* KOT Item Removal Reason Modal */}
        <Modal visible={kotRemovalReasonVisible} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.kotOverlay}>
            <View style={styles.kotCard}>
              <Text style={styles.kotEmoji}>✂️</Text>
              <Text style={[styles.kotTitle, { color: "#f97316" }]}>Item Removed</Text>
              <Text style={styles.kotMessage}>
                You removed: <Text style={{ fontWeight: "900", color: "#ef4444" }}>{kotRemovalItemName}</Text>{"\n"}Please provide a reason for the kitchen.
              </Text>
              <View style={styles.reasonInputWrapper}>
                <Text style={styles.reasonInputLabel}>Reason for removal</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g. Customer changed mind, Out of stock..."
                  placeholderTextColor="#94a3b8"
                  value={kotRemovalReason}
                  onChangeText={setKotRemovalReason}
                  multiline
                  numberOfLines={2}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.kotDismissBtn, { backgroundColor: "#f97316" }]}
                onPress={() => {
                  setKotRemovalReasonVisible(false);
                  if (kotRemovalCallback.current) {
                    kotRemovalCallback.current(kotRemovalReason);
                    kotRemovalCallback.current = null;
                  }
                }}
              >
                <Text style={styles.kotDismissText}>Send KOT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.kotDismissBtn, { backgroundColor: "#f1f5f9", marginTop: 0 }]}
                onPress={() => {
                  setKotRemovalReasonVisible(false);
                  if (kotRemovalCallback.current) {
                    kotRemovalCallback.current("");
                    kotRemovalCallback.current = null;
                  }
                }}
              >
                <Text style={[styles.kotDismissText, { color: "#64748b" }]}>Skip Reason</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Discount Modal */}
        <Modal visible={discountModalVisible} transparent animationType="fade" onRequestClose={() => setDiscountModalVisible(false)}>
          <View style={styles.desktopCustomItemOverlay}>
            <View style={styles.desktopCustomItemCard}>
              <Text style={styles.desktopCustomItemTitle}>Apply Discount</Text>
              <Text style={styles.desktopCustomItemSubtitle}>Enter a percentage or flat amount to deduct from the bill.</Text>

              {/* Type toggle */}
              <View style={styles.discountTypeRow}>
                <TouchableOpacity
                  style={[styles.discountTypeBtn, discountType === "percent" && styles.discountTypeBtnActive]}
                  onPress={() => setDiscountType("percent")}
                >
                  <Text style={[styles.discountTypeBtnText, discountType === "percent" && { color: "#fff" }]}>% Percent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.discountTypeBtn, discountType === "flat" && styles.discountTypeBtnActive]}
                  onPress={() => setDiscountType("flat")}
                >
                  <Text style={[styles.discountTypeBtnText, discountType === "flat" && { color: "#fff" }]}>₹ Flat Amount</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.desktopCustomItemField}>
                <Text style={styles.desktopCustomItemFieldLabel}>
                  {discountType === "percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                </Text>
                <TextInput
                  style={styles.desktopCustomItemInput}
                  placeholder={discountType === "percent" ? "e.g. 10" : "e.g. 50"}
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  value={discountInputText}
                  onChangeText={setDiscountInputText}
                />
                {discountType === "percent" && discountInputText ? (
                  <Text style={{ fontSize: 11, color: "#f97316", fontWeight: "600", marginTop: 4 }}>
                    = {formatCurrency(((order?.subtotal ?? 0) * (parseFloat(discountInputText) || 0)) / 100)} off
                  </Text>
                ) : null}
              </View>

              <View style={styles.desktopCustomItemActions}>
                <TouchableOpacity
                  style={[styles.desktopCustomItemCancelBtn]}
                  onPress={() => {
                    setDiscountValue(0);
                    setDiscountInputText("");
                    setDiscountModalVisible(false);
                  }}
                >
                  <Text style={styles.desktopCustomItemCancelText}>Remove Discount</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.desktopCustomItemAddBtn}
                  onPress={() => {
                    const parsed = parseFloat(discountInputText);
                    if (!isNaN(parsed) && parsed > 0) {
                      setDiscountValue(parsed);
                    } else {
                      setDiscountValue(0);
                    }
                    setDiscountModalVisible(false);
                  }}
                >
                  <Text style={styles.desktopCustomItemAddText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // -------------------------------------------------------------
  // Mobile Layout Fallback (Original code preserved)
  // -------------------------------------------------------------

  // While order is being auto-created, show a quick loading screen
  if (isCreatingOrder) {
    return (
      <View style={styles.emptyScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Setting up table...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">Guests</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{order?.guests ?? 0}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">Opened At</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{order ? formatTime(order.openedAt) : "--:--"}</Text>
          </View>
        </View>
        <View style={styles.infoItemLast}>
          <Text style={styles.infoIcon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">Order No.</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">{order?.orderNo ?? "---"}</Text>
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

      {/* Unified Modals for Mobile */}
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
              Kitchen Order Ticket for {table.name} ({order?.orderNo ?? "---"}) has been sent to the kitchen.
            </Text>
            <TouchableOpacity style={styles.kotDismissBtn} onPress={handleKotDismiss}>
              <Text style={styles.kotDismissText}>OK, Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Table Confirm Modal (Mobile) */}
      <Modal visible={clearConfirmVisible} transparent animationType="fade" onRequestClose={() => setClearConfirmVisible(false)}>
        <View style={styles.kotOverlay}>
          <View style={styles.kotCard}>
            <Text style={styles.kotEmoji}>🗑️</Text>
            <Text style={[styles.kotTitle, { color: "#ef4444" }]}>Clear Table?</Text>
            <Text style={styles.kotMessage}>
              This will cancel the current order and free {table.name}. This cannot be undone.
            </Text>
            <View style={styles.reasonInputWrapper}>
              <Text style={styles.reasonInputLabel}>Reason for clearing (optional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="e.g. Customer left, Wrong order..."
                placeholderTextColor="#94a3b8"
                value={clearReason}
                onChangeText={setClearReason}
                multiline
                numberOfLines={2}
              />
            </View>
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
  // Original Mobile Styles
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

  // Desktop POS Styles
  desktopScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  desktopHeader: {
    height: 64,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  desktopHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  desktopBackBtn: {
    padding: 8,
  },
  desktopBackBtnText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  desktopHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  desktopHeaderWidgets: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  desktopHeaderWidget: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    minWidth: 110,
  },
  desktopWidgetIcon: {
    fontSize: 16,
  },
  desktopWidgetLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSec,
  },
  desktopWidgetValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  guestsCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  guestsCounterBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  guestsCounterBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: -2,
  },
  desktopClearBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopClearBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  desktopWorkspace: {
    flex: 1,
    flexDirection: "row",
    paddingBottom: 60,
  },
  desktopLeftSidebar: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
    paddingVertical: 8,
  },
  desktopCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
    gap: 8,
  },
  desktopCategoryItemActive: {
    borderLeftColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  desktopCategoryIcon: {
    fontSize: 16,
  },
  desktopCategoryItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSec,
    flex: 1,
  },
  desktopCategoryItemTextActive: {
    color: "#ef4444",
    fontWeight: "800",
  },
  desktopMiddlePanel: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  desktopSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  desktopSearchInputContainer: {
    width: 300,
    height: 40,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  desktopSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: COLORS.text,
    ...(Platform.select({
      web: { outlineStyle: 'none' }
    }) as any),
  },
  desktopSearchBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopSearchBtnText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  desktopShortCodeContainer: {
    width: 100,
    height: 40,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  desktopShortCodeInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    ...(Platform.select({
      web: { outlineStyle: 'none' }
    }) as any),
  },
  desktopItemsScroll: {
    paddingBottom: 24,
  },
  desktopItemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  desktopMenuItemCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    width: "23%",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 0,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  desktopMenuItemCardImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    flexShrink: 0,
  },
  desktopMenuItemCardInfo: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  desktopMenuItemCardPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ef4444",
  },
  desktopMenuItemCardSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    borderWidth: 1.5,
  },
  desktopMenuItemCardIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  desktopMenuItemCardText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 16,
    flexShrink: 1,
  },
  desktopMenuItemQtyBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ea580c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  desktopMenuItemQtyBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "800",
  },
  desktopRightPanel: {
    width: 360,
    backgroundColor: COLORS.bg,
    borderLeftWidth: 1,
    borderLeftColor: "#cbd5e1",
    padding: 14,
    justifyContent: "space-between",
  },
  desktopRightTabs: {
    flexDirection: "row",
    backgroundColor: "#e8e5dc",
    borderRadius: 24,
    padding: 3,
    marginBottom: 12,
  },
  desktopRightTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  desktopRightTabActive: {
    backgroundColor: COLORS.espresso,
  },
  desktopRightTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSec,
  },
  desktopRightTabTextActive: {
    color: COLORS.white,
  },
  desktopRightSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  desktopRightTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.espresso,
  },
  desktopRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  desktopRightBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  desktopRightBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  desktopOrderListCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    marginVertical: 10,
  },
  desktopRightTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    marginBottom: 4,
  },
  desktopColText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
  },
  desktopRightTableScroll: {
    flex: 1,
  },
  desktopRightTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 8,
    alignItems: "center",
  },
  desktopItemName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 16,
  },
  desktopRowCheckbox: {
    padding: 2,
  },
  desktopRowCheckboxBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#94a3b8",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  desktopRowCheckboxBoxChecked: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  desktopRowCheckboxCheckmark: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    marginTop: -2,
  },
  desktopRowQtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  desktopRowQtyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: -2,
  },
  desktopRowQtyVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 22,
    textAlign: "center",
  },
  desktopItemPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },
  desktopEmptyOrder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
  },
  desktopEmptyOrderEmoji: {
    fontSize: 40,
    opacity: 0.6,
  },
  desktopEmptyOrderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  desktopEmptyOrderText: {
    fontSize: 11,
    color: COLORS.textSec,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  desktopRightFooter: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
    gap: 8,
  },
  desktopSplitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  desktopRightTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  desktopActionGrid: {
    gap: 5,
    marginTop: 4,
  },
  desktopActionRow: {
    flexDirection: "row",
    gap: 5,
  },
  desktopActionBtnSave: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopActionBtnKOT: {
    flex: 1,
    backgroundColor: COLORS.espresso,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopActionBtnHold: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopActionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  desktopActionBtnHoldText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  desktopBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  // Veg/Non-Veg food type filter (desktop middle panel)
  desktopSidebarFoodTypeRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    backgroundColor: COLORS.white,
  },
  desktopSidebarFoodTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  desktopSidebarFoodTypeBtnVegActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  desktopSidebarFoodTypeBtnAllActive: {
    backgroundColor: "#f1f5f9",
    borderColor: "#64748b",
  },
  desktopSidebarFoodTypeBtnNonVegActive: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  desktopSidebarFoodTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  desktopSidebarFoodTextVegActive: {
    color: "#16a34a",
    fontWeight: "700",
  },
  desktopSidebarFoodTextAllActive: {
    color: "#334155",
    fontWeight: "700",
  },
  desktopSidebarFoodTextNonVegActive: {
    color: "#ef4444",
    fontWeight: "700",
  },
  desktopCategoryItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  desktopMenuHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  desktopMenuTitleIcon: {
    fontSize: 18,
  },
  desktopMenuTitleText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  desktopLiveOrdersBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  desktopLiveOrdersBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  // Discount modal
  discountTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  discountTypeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  discountTypeBtnActive: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  discountTypeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  desktopBottomSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  desktopBottomSummaryBadge: {
    backgroundColor: "#ffedd5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  desktopBottomSummaryBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ea580c",
  },
  desktopBottomSummaryTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ef4444",
    marginRight: 60,
  },
  desktopBottomSummaryExpand: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  desktopBottomSummaryExpandText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },
  desktopBottomActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  desktopBottomHoldBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopBottomHoldText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "800",
  },
  desktopBottomCustomBtn: {
    flex: 2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopBottomCustomText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  desktopBottomKotBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopBottomKotText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  desktopCustomItemOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  desktopCustomItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  desktopCustomItemTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  desktopCustomItemSubtitle: {
    fontSize: 11,
    color: COLORS.textSec,
    textAlign: "center",
    marginTop: -6,
  },
  desktopCustomItemField: {
    gap: 4,
  },
  desktopCustomItemFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSec,
  },
  desktopCustomItemInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#fafafa",
  },
  desktopCustomItemErrorText: {
    fontSize: 10,
    color: "#ef4444",
    fontWeight: "600",
  },
  desktopCustomItemActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  desktopCustomItemCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  desktopCustomItemCancelText: {
    color: COLORS.textSec,
    fontWeight: "700",
    fontSize: 13,
  },
  desktopCustomItemAddBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  desktopCustomItemAddText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },

  // Split Bill styles
  desktopSplitPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  desktopSplitRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  desktopSplitPayBtn: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  desktopSplitPayBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

  // Pay Modal Option styles
  desktopPayModalOptionBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopPayModalOptionText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },

  // ── Menu Catalog Dashboard Styles ──
  menuCatalogBanner: {
    backgroundColor: "#2d2416",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 32, // Stretched vertically
    gap: 12,
    marginBottom: 8,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.22)" },
    }),
  },
  menuCatalogKicker: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  menuCatalogTitle: {
    color: "#FFFFFF",
    fontSize: 26, // Stretched title text size
    fontWeight: "900",
  },
  menuCatalogSubtitle: {
    color: "#D7CEC4",
    fontSize: 13, // Stretched subtitle text size
    fontWeight: "600",
    marginTop: 4,
  },
  menuCatalogBadge: {
    backgroundColor: "#f97316",
    borderRadius: 16,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  menuCatalogBadgeValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  menuCatalogBadgeLabel: {
    color: "#FFE4C4",
    fontSize: 11,
    fontWeight: "800",
  },
  menuCatalogStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  menuCatalogStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 24, // Stretched vertically
    alignItems: "center", // Center horizontally
    justifyContent: "center", // Center vertically
    ...Platform.select({
      web: { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)" },
    }),
  },
  menuCatalogStatValue: {
    fontSize: 26, // Stretched value text size
    fontWeight: "900",
    color: "#ea580c",
  },
  menuCatalogStatLabel: {
    fontSize: 12, // Stretched label text size
    fontWeight: "700",
    color: COLORS.textSec,
    marginTop: 4,
  },

  // ── Comment / Kitchen Note styles ──
  desktopCommentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  desktopCommentIcon: {
    fontSize: 14,
    marginTop: 4,
  },
  desktopCommentInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    minHeight: 36,
    ...(Platform.select({
      web: { outlineStyle: "none" },
    }) as any),
  },
  desktopDashboardSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 12,
  },
  sidebarWidgetsContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    backgroundColor: COLORS.white,
    gap: 8,
  },
  sidebarWidgetCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sidebarWidgetContent: {
    flex: 1,
  },
  sidebarWidgetLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSec,
  },
  sidebarWidgetValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  sidebarGuestsCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  sidebarGuestsCounterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarGuestsCounterBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: -2,
  },
  sidebarClearBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sidebarClearBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  desktopBottomBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#334155",
  },
  desktopBottomBackBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  desktopBottomSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightTopWidgetsGrid: {
    gap: 6,
    marginBottom: 10,
  },
  rightTopWidgetsRow: {
    flexDirection: "row",
    gap: 6,
    height: 58,
  },
  rightTopWidgetCard: {
    flex: 1,
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 8,
    overflow: "hidden",
  },
  rightWidgetLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textSec,
  },
  rightClearBtn: {
    flex: 1,
    height: 58,
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    paddingHorizontal: 10,
  },
  rightClearBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  desktopRightMiddleSection: {
    flex: 1,
    marginTop: 4,
  },
  // Reason input styles (used in clear and KOT removal modals)
  reasonInputWrapper: {
    width: "100%",
    gap: 4,
    marginVertical: 4,
  },
  reasonInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSec,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  reasonInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: "#f8fafc",
    minHeight: 52,
    textAlignVertical: "top",
  },
});
