import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Modal, TextInput, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";
import { useMenu } from "@/hooks/useMenu";
import { useMenuStore } from "@/store/menuStore";
import { formatCurrency } from "@/utils/formatters";
import { Category, MenuItem } from "@/types";

function Header({
  categories,
  menuItems,
  averagePrice,
  selectedCategoryId,
  onSelectCategory,
  onAddPress,
}: {
  categories: Category[];
  menuItems: MenuItem[];
  averagePrice: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onAddPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const sectionTitle = activeCategory ? `${activeCategory.icon} ${activeCategory.name}` : "All Items";
  const visibleCount = menuItems.filter((item) => item.isAvailable).length;

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.hero, isSmallScreen && { flexWrap: "wrap", gap: 12 }]}>
        <View style={{ flex: 1, flexShrink: 1, minWidth: 150 }}>
          <Text style={styles.kicker}>MENU CONTROL</Text>
          <Text style={styles.heroTitle}>Kitchen catalog</Text>
          <Text style={styles.heroSubtitle}>Fast edits, quick scanning, live availability.</Text>
        </View>
        <View style={[styles.heroBadge, isSmallScreen && { alignSelf: "flex-start" }]}>
          <Text style={styles.heroBadgeValue}>{menuItems.length}</Text>
          <Text style={styles.heroBadgeLabel}>items</Text>
        </View>
      </View>

      <View style={[styles.metricRow, isSmallScreen && { flexWrap: "wrap", gap: 10 }]}>
        <Card style={[styles.metric, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={styles.metricValue}>{categories.length}</Text>
          <Text style={styles.metricLabel}>Categories</Text>
        </Card>
        <Card style={[styles.metric, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={styles.metricValue}>{formatCurrency(averagePrice)}</Text>
          <Text style={styles.metricLabel}>Avg price</Text>
        </Card>
        <Card style={[styles.metric, isSmallScreen && { minWidth: "100%", flex: 0, alignItems: "center" }]}>
          <Text style={styles.metricValue}>{menuItems.filter((item) => item.isVeg).length}</Text>
          <Text style={styles.metricLabel}>Veg items</Text>
        </Card>
      </View>

      <View style={styles.categoryRail}>
        {categories.map((category) => {
          const isActive = selectedCategoryId === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => onSelectCategory(category.id)}
              style={[
                styles.categoryPill,
                isActive && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryText, isActive && { color: COLORS.white }]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>{sectionTitle}</Text>
          <Text style={styles.subtitle}>
            {selectedCategoryId ? "Filtered by category" : "Tap-friendly cards for quick item review"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={styles.availableText}>{visibleCount} available</Text>
          <Pressable onPress={onAddPress} style={[styles.categoryPill, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
            <Text style={[styles.categoryText, { color: COLORS.white }]}>+ Add Item</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MenuCard({
  item,
  categoryName,
  onDeletePress,
}: {
  item: MenuItem;
  categoryName?: string;
  onDeletePress: (id: string) => void;
}) {
  return (
    <Card style={styles.menuCard}>
      <View style={styles.menuTop}>
        <View style={styles.emojiPlate}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => onDeletePress(item.id)}>
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </Pressable>
          <View style={[styles.vegDot, { borderColor: item.isVeg ? COLORS.green : COLORS.danger }]}>
            <View style={[styles.vegInner, { backgroundColor: item.isVeg ? COLORS.green : COLORS.danger }]} />
          </View>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      <Text numberOfLines={1} style={styles.meta}>
        {categoryName}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        <View style={[styles.statusPill, item.isAvailable ? styles.availablePill : styles.unavailablePill]}>
          <Text style={[styles.statusText, item.isAvailable ? styles.availableStatusText : styles.unavailableStatusText]}>
            {item.isAvailable ? "Live" : "Off"}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function MenuManagementScreen() {
  const { menuItems, categories } = useMenu();
  const addMenuItem = useMenuStore((state) => state.addMenuItem);
  const deleteMenuItem = useMenuStore((state) => state.deleteMenuItem);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]?.id || "popular");
  const [formEmoji, setFormEmoji] = useState("🍔");
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  // Toggle category filter — click same pill again to show all
  function handleSelectCategory(id: string) {
    setSelectedCategoryId((prev) => (prev === id ? null : id));
  }

  const averagePrice = Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / Math.max(menuItems.length, 1));

  // Apply category filter to the displayed list
  const filteredItems = selectedCategoryId
    ? menuItems.filter((item) => item.categoryId === selectedCategoryId)
    : menuItems;

  const handleOpenAdd = () => {
    setFormName("");
    setFormPrice("");
    setFormCategory(categories[0]?.id || "popular");
    setFormEmoji("🍔");
    setFormIsVeg(true);
    setFormIsAvailable(true);
    setError("");
    setAddModalVisible(true);
  };

  const handleAddItem = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      setError("Name and Price are required.");
      return;
    }
    const priceVal = Number(formPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      setError("Price must be a positive number.");
      return;
    }

    try {
      await addMenuItem({
        name: formName,
        price: priceVal,
        categoryId: formCategory,
        emoji: formEmoji,
        isVeg: formIsVeg,
        isAvailable: formIsAvailable,
      });
      setAddModalVisible(false);
    } catch (err: any) {
      setError(err.message || "Failed to add menu item");
    }
  };

  const handleDeleteItem = (id: string) => {
    const targetItem = menuItems.find((i) => i.id === id);
    if (!targetItem) return;
    setItemToDelete({ id: targetItem.id, name: targetItem.name });
    setDeleteConfirmVisible(true);
  };

  const executeDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleteConfirmVisible(false);
    await deleteMenuItem(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.menuRow}
        ListHeaderComponent={
          <Header
            categories={categories}
            menuItems={menuItems}
            averagePrice={averagePrice}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onAddPress={handleOpenAdd}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.menuItemWrap}>
            <MenuCard
              item={item}
              categoryName={categories.find((category) => category.id === item.categoryId)?.name}
              onDeletePress={handleDeleteItem}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items in this category</Text>
          </View>
        }
      />

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Menu Item</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput value={formName} onChangeText={setFormName} style={styles.input} placeholder="e.g. Garlic Bread" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" style={styles.input} placeholder="e.g. 150" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emoji Icon</Text>
              <TextInput value={formEmoji} onChangeText={setFormEmoji} style={styles.input} placeholder="e.g. 🍞" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", gap: 8, marginVertical: 4 }}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setFormCategory(cat.id)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: formCategory === cat.id ? COLORS.primary : COLORS.white,
                        borderColor: formCategory === cat.id ? COLORS.primary : COLORS.border,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                      },
                    ]}
                  >
                    <Text style={{ color: formCategory === cat.id ? COLORS.white : COLORS.slate, fontSize: 12, fontWeight: "800" }}>
                      {cat.icon} {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Type</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setFormIsVeg(true)}
                  style={[
                    styles.categoryPill,
                    {
                      flex: 1,
                      justifyContent: "center",
                      backgroundColor: formIsVeg ? COLORS.greenLight : COLORS.white,
                      borderColor: formIsVeg ? COLORS.green : COLORS.border,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <Text style={{ color: formIsVeg ? COLORS.green : COLORS.slate, fontWeight: "800" }}>🟢 Veg</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFormIsVeg(false)}
                  style={[
                    styles.categoryPill,
                    {
                      flex: 1,
                      justifyContent: "center",
                      backgroundColor: !formIsVeg ? "#FEF2F2" : COLORS.white,
                      borderColor: !formIsVeg ? COLORS.danger : COLORS.border,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <Text style={{ color: !formIsVeg ? COLORS.danger : COLORS.slate, fontWeight: "800" }}>🔴 Non-Veg</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Availability</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setFormIsAvailable(true)}
                  style={[
                    styles.categoryPill,
                    {
                      flex: 1,
                      justifyContent: "center",
                      backgroundColor: formIsAvailable ? COLORS.greenLight : COLORS.white,
                      borderColor: formIsAvailable ? COLORS.green : COLORS.border,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <Text style={{ color: formIsAvailable ? COLORS.green : COLORS.slate, fontWeight: "800" }}>Live (Available)</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFormIsAvailable(false)}
                  style={[
                    styles.categoryPill,
                    {
                      flex: 1,
                      justifyContent: "center",
                      backgroundColor: !formIsAvailable ? "#FEF2F2" : COLORS.white,
                      borderColor: !formIsAvailable ? COLORS.danger : COLORS.border,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <Text style={{ color: !formIsAvailable ? COLORS.danger : COLORS.slate, fontWeight: "800" }}>Off (Unavailable)</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={() => setAddModalVisible(false)}>Cancel</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button onPress={handleAddItem}>Save</Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <View style={styles.kotOverlay}>
          <View style={styles.kotCard}>
            <Text style={styles.kotEmoji}>🗑️</Text>
            <Text style={[styles.kotTitle, { color: "#ef4444" }]}>Delete Item?</Text>
            <Text style={styles.kotMessage}>
              Are you sure you want to delete "{itemToDelete?.name}"? This cannot be undone.
            </Text>
            <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#ef4444" }]} onPress={executeDeleteItem}>
              <Text style={styles.kotDismissText}>Yes, Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.kotDismissBtn, { backgroundColor: "#f1f5f9", marginTop: 0 }]} onPress={() => setDeleteConfirmVisible(false)}>
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
  content: {
    gap: 12,
    padding: 18,
    paddingBottom: 34,
  },
  headerWrap: {
    gap: 14,
    marginBottom: 2,
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
    backgroundColor: COLORS.primary,
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
    color: "#FFEAD9",
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
  categoryRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  categoryIcon: {
    fontSize: 13,
  },
  categoryText: {
    color: COLORS.slate,
    fontSize: 11,
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
  availableText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
  },
  menuRow: {
    gap: 12,
  },
  menuItemWrap: {
    flex: 1,
    maxWidth: "48.6%",
  },
  menuCard: {
    gap: 9,
    minHeight: 158,
    padding: 13,
  },
  menuTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emojiPlate: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderCurve: "continuous",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  emoji: {
    fontSize: 23,
  },
  vegDot: {
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  vegInner: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
  },
  meta: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "800",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  price: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  statusPill: {
    borderCurve: "continuous",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  availablePill: {
    backgroundColor: COLORS.greenLight,
  },
  unavailablePill: {
    backgroundColor: "#FEF2F2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  availableStatusText: {
    color: COLORS.green,
  },
  unavailableStatusText: {
    color: COLORS.danger,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textSec,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: COLORS.textSec,
    fontSize: 14,
    fontWeight: "700",
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
});

