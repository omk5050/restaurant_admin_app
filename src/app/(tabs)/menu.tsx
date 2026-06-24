import { useState, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, Modal, TextInput, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Platform, Image } from "react-native";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";
import { MENU_SECTIONS, getSubCategories } from "@/constants/menuSections";
import { useMenu } from "@/hooks/useMenu";
import { useMenuStore } from "@/store/menuStore";
import { formatCurrency } from "@/utils/formatters";
import { Category, MenuItem, MenuSection } from "@/types";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/constants/config";
import { apiFetch } from "@/utils/api";

const menuImages: Record<string, any> = {
  // ── Existing items (corrected filenames) ────────────────────────────────────
  "Veg Dum Biryani":         require("../../../assets/images/Veg-Dum-Biryani.jpg"),
  "Egg Dum Biryani":         require("../../../assets/images/egg-dum-biryani.jpg"),
  "French Fries Classic":    require("../../../assets/images/french-fries-classic.jpg"),
  "Peri Peri French Fries":  require("../../../assets/images/peri-peri-fries.jpg"),
  "Tripple Choco Bowl":      require("../../../assets/images/triple-choco-bowl.jpg"),
  "Oreo Choco Bowl":         require("../../../assets/images/oreo-choco-bowl.jpg"),
  "Paneer Tikka Biryani":    require("../../../assets/images/Paneer-Tikka-Biryani.jpg"),
  "Paneer Kalimiri Kabab":   require("../../../assets/images/paneer-kalimiri-kabab.jpg"),

  // ── New items ────────────────────────────────────────────────────────────────
  "Chicken Dum Biryani":     require("../../../assets/images/Chicken-Dum-Biryani.jpg"),
  "Mutton Dum Biryani":      require("../../../assets/images/Mutton-Dum-Biryani.jpg"),
  "Chicken Tikka Biryani":   require("../../../assets/images/chicken-Tikka-Biryani.jpg"),
  "Tandoori Biryani":        require("../../../assets/images/Tandoori-Biryani.jpg"),
  "Afghani Tandoor":         require("../../../assets/images/Afghani-Tandoor.jpg"),
  "Chicken Sheekh Kabab":    require("../../../assets/images/Chicken-Sheekh-Kabab.jpg"),
  "Mutton Sheekh Kebab":     require("../../../assets/images/Mutton-Sheekh-Kebab.jpg"),
  "Chicken Tikka Kebab":     require("../../../assets/images/Chicken-Tikka-Kebab.jpg"),
  "Chicken Tangadi Kebab":   require("../../../assets/images/Chicken-Tangadi-Kebab.jpg"),
  "Lahsuni Kebab":           require("../../../assets/images/Lahsuni-Kebab.jpg"),
  "Paneer Tikka Kebab":      require("../../../assets/images/Paneer-Tikka-Kebab.jpg"),
  "Speacial Paradise Kebab": require("../../../assets/images/Speacial-Paradise-Kebab.jpg"),
  "Chicken Hariyali Kebab":  require("../../../assets/images/Chicken-Hariyali-Kebab.jpg"),
  "Paneer Kalimiri kebab":   require("../../../assets/images/Paneer-Kalimiri-kebab.jpg"),
  "Chicken Kalimiri kebab":  require("../../../assets/images/Chicken-Kalimiri-kebab.jpg"),
  "Tandoor Chicken Red":     require("../../../assets/images/Tandoor-Chicken-Red.jpg"),
  "Tandoor Chicken White":   require("../../../assets/images/Tandoor-chicken-White.jpg"),
  "Tandoori Lollipop":       require("../../../assets/images/Tandoori-Lollipop.jpg"),
  "Reshmi Kebab":            require("../../../assets/images/Reshmi-Kebab.jpg"),
};

function Header({
  categories,
  menuItems,
  averagePrice,
  selectedSection,
  selectedCategoryId,
  onSelectSection,
  onSelectCategory,
  onAddPress,
  onManageCategoriesPress,
}: {
  categories: Category[];
  menuItems: MenuItem[];
  averagePrice: number;
  selectedSection: MenuSection;
  selectedCategoryId: string | null;
  onSelectSection: (section: MenuSection) => void;
  onSelectCategory: (id: string) => void;
  onAddPress: () => void;
  onManageCategoriesPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;

  const subCategories = getSubCategories(categories, selectedSection);
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const activeSection = MENU_SECTIONS.find((section) => section.id === selectedSection);
  const sectionTitle = activeCategory
    ? `${activeSection?.icon ?? ""} ${activeCategory.icon} ${activeCategory.name}`
    : `${activeSection?.icon ?? ""} ${activeSection?.name ?? "All Items"}`;
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

      <View style={[styles.metricRow, isSmallScreen ? { flexWrap: "wrap", gap: 10 } : undefined]}>
        <Card style={[styles.metric, isSmallScreen ? { minWidth: "47%", flex: 1 } : undefined]}>
          <Text style={styles.metricValue}>{categories.length}</Text>
          <Text style={styles.metricLabel}>Categories</Text>
        </Card>
        <Card style={[styles.metric, isSmallScreen ? { minWidth: "47%", flex: 1 } : undefined]}>
          <Text style={styles.metricValue}>{formatCurrency(averagePrice)}</Text>
          <Text style={styles.metricLabel}>Avg price</Text>
        </Card>
        <Card style={[styles.metric, isSmallScreen ? { minWidth: "100%", flex: 1, alignItems: "center" } : undefined]}>
          <Text style={styles.metricValue}>{menuItems.filter((item) => item.isVeg).length}</Text>
          <Text style={styles.metricLabel}>Veg items</Text>
        </Card>
      </View>

      {MENU_SECTIONS.length > 1 && (
        <View style={styles.sectionRail}>
          {MENU_SECTIONS.map((section) => {
            const isActive = selectedSection === section.id;
            return (
              <Pressable
                key={section.id}
                onPress={() => onSelectSection(section.id)}
                style={[
                  styles.sectionTab,
                  isActive && styles.sectionTabActive,
                ]}
              >
                <Text style={styles.categoryIcon}>{section.icon}</Text>
                <Text style={[styles.sectionTabText, isActive && { color: COLORS.white }]}>
                  {section.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.categoryRail}>
        {subCategories.map((category) => {
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
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onManageCategoriesPress} style={[styles.categoryPill, { borderColor: COLORS.primary }]}>
              <Text style={[styles.categoryText, { color: COLORS.primary }]}>🏷️ Tags</Text>
            </Pressable>
            <Pressable onPress={onAddPress} style={[styles.categoryPill, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
              <Text style={[styles.categoryText, { color: COLORS.white }]}>+ Add Item</Text>
            </Pressable>
          </View>
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
  onDeletePress: (id: string, name: string) => void;
}) {
  return (
    <Card style={styles.menuCard}>
      <View style={{ position: "relative", width: "100%", height: 110 }}>
        <Image
          source={
            item.imageUrl
              ? { uri: item.imageUrl }
              : (menuImages[item.name] || require("../../../assets/images/Veg-Dum-Biryani.jpg"))
          }
          style={{
            width: "100%",
            height: 110,
            borderRadius: 16,
          }}
          resizeMode="cover"
        />

        <TouchableOpacity
          onPress={() => onDeletePress(item.id, item.name)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 16,
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 14 }}>🗑️</Text>
        </TouchableOpacity>

        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 10,
            padding: 4,
          }}
        >
          <View
            style={[
              styles.vegDot,
              {
                borderColor: item.isVeg
                  ? COLORS.green
                  : COLORS.danger,
              },
            ]}
          >
            <View
              style={[
                styles.vegInner,
                {
                  backgroundColor: item.isVeg
                    ? COLORS.green
                    : COLORS.danger,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <Text numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text style={styles.price}>({formatCurrency(item.price)})</Text>
      </View>

      <View style={styles.cardFooter}>
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
  const addCategory = useMenuStore((state) => state.addCategory);
  const deleteCategory = useMenuStore((state) => state.deleteCategory);

  const [selectedSection, setSelectedSection] = useState<MenuSection>("restaurant");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const scrollOffset = useRef(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    scrollOffset.current = offset;
    setShowLeftArrow(offset > 10);
  };

  const handleScrollLeft = () => {
    flatListRef.current?.scrollToOffset({
      offset: Math.max(0, scrollOffset.current - 172),
      animated: true,
    });
  };

  const handleScrollRight = () => {
    flatListRef.current?.scrollToOffset({
      offset: scrollOffset.current + 172,
      animated: true,
    });
  };
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]?.id || "popular");
  const [formEmoji, setFormEmoji] = useState("🍔");
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formSection, setFormSection] = useState<MenuSection>("restaurant");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Category management state
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  function handleSelectSection(section: MenuSection) {
    setSelectedSection(section);
    setSelectedCategoryId(null);
  }

  // Toggle category filter — click same pill again to show all in section
  function handleSelectCategory(id: string) {
    setSelectedCategoryId((prev) => (prev === id ? null : id));
  }

  const sectionCategoryIds = getSubCategories(categories, selectedSection).map((category) => category.id);

  const averagePrice = Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / Math.max(menuItems.length, 1));

  const filteredItems = menuItems.filter((item) => {
    if (!sectionCategoryIds.includes(item.categoryId)) return false;
    return !selectedCategoryId || item.categoryId === selectedCategoryId;
  });

  const handleFormSectionChange = (section: MenuSection) => {
    setFormSection(section);
    const subCats = getSubCategories(categories, section);
    if (subCats.length > 0) {
      setFormCategory(subCats[0].id);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access library is required to pick an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    if (Platform.OS === "web") {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "upload.jpg";

      const response = await fetch(uri);
      const blob = await response.blob();

      formData.append("image", blob, filename);

      const res = await apiFetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Image upload failed");
      }

      const data = await res.json();
      return data.imageUrl;
    } else {
      const token = await AsyncStorage.getItem("authToken");
      const selectedAdminId = await AsyncStorage.getItem("selectedAdminId");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (selectedAdminId) {
        headers["X-Selected-Admin-Id"] = selectedAdminId;
      }

      const uploadResult = await FileSystem.uploadAsync(
        `${API_URL}/api/upload`,
        uri,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "image",
          headers,
        }
      );

      if (uploadResult.status !== 200) {
        let errMsg = "Image upload failed";
        try {
          const errData = JSON.parse(uploadResult.body);
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(uploadResult.body);
      return data.imageUrl;
    }
  };

  const handleOpenAdd = () => {
    setFormName("");
    setFormPrice("");
    setFormSection(selectedSection);
    setFormCategory(getSubCategories(categories, selectedSection)[0]?.id || categories[0]?.id || "popular");
    setFormEmoji("🍔");
    setFormIsVeg(true);
    setFormIsAvailable(true);
    setFormImage(null);
    setUploading(false);
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

    setUploading(true);
    setError("");
    try {
      let imageUrl = "";
      if (formImage) {
        imageUrl = await uploadImage(formImage);
      }

      await addMenuItem({
        name: formName,
        price: priceVal,
        categoryId: formCategory,
        emoji: formEmoji,
        isVeg: formIsVeg,
        isAvailable: formIsAvailable,
        imageUrl,
      });
      setAddModalVisible(false);
    } catch (err: any) {
      setError(err.message || "Failed to add menu item");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteConfirmVisible(true);
  };

  const executeDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleteConfirmVisible(false);
    await deleteMenuItem(itemToDelete.id);
    setItemToDelete(null);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !newCatEmoji.trim()) {
      setCategoryError("Name and Emoji icon are required.");
      return;
    }
    setActionLoading(true);
    setCategoryError("");
    try {
      await addCategory({
        name: newCatName.trim(),
        icon: newCatEmoji.trim(),
        section: selectedSection,
        sortOrder: 0,
      });
      setNewCatName("");
      setNewCatEmoji("");
    } catch (err: any) {
      setCategoryError(err.message || "Failed to create category.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setActionLoading(true);
    setCategoryError("");
    try {
      await deleteCategory(id);
    } catch (err: any) {
      setCategoryError(err.message || "Failed to delete category.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <Header
          categories={categories}
          menuItems={menuItems}
          averagePrice={averagePrice}
          selectedSection={selectedSection}
          selectedCategoryId={selectedCategoryId}
          onSelectSection={handleSelectSection}
          onSelectCategory={handleSelectCategory}
          onAddPress={handleOpenAdd}
          onManageCategoriesPress={() => setManageModalVisible(true)}
        />

        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={filteredItems}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <MenuCard
                item={item}
                categoryName={categories.find((category) => category.id === item.categoryId)?.name}
                onDeletePress={(id, name) => handleDeleteItem(id, name)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No items in this category</Text>
              </View>
            }
          />

          {showLeftArrow && filteredItems.length > 0 && (
            <Pressable onPress={handleScrollLeft} style={styles.arrowLeft}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
          )}

          {filteredItems.length > 2 && (
            <Pressable onPress={handleScrollRight} style={styles.arrowRight}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Menu Item</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput value={formName} onChangeText={setFormName} style={styles.input} placeholder="e.g. Garlic Bread" editable={!uploading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" style={styles.input} placeholder="e.g. 150" editable={!uploading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emoji Icon</Text>
              <TextInput value={formEmoji} onChangeText={setFormEmoji} style={styles.input} placeholder="e.g. 🍞" editable={!uploading} />
            </View>

            {MENU_SECTIONS.length > 1 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Menu Section</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => handleFormSectionChange("restaurant")}
                    style={[
                      styles.categoryPill,
                      {
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: formSection === "restaurant" ? COLORS.espresso : COLORS.white,
                        borderColor: formSection === "restaurant" ? COLORS.espresso : COLORS.border,
                        paddingVertical: 10,
                      },
                    ]}
                    disabled={uploading}
                  >
                    <Text style={{ color: formSection === "restaurant" ? COLORS.white : COLORS.slate, fontWeight: "800" }}>🍽️ Restaurant</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleFormSectionChange("cafe")}
                    style={[
                      styles.categoryPill,
                      {
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: formSection === "cafe" ? COLORS.espresso : COLORS.white,
                        borderColor: formSection === "cafe" ? COLORS.espresso : COLORS.border,
                        paddingVertical: 10,
                      },
                    ]}
                    disabled={uploading}
                  >
                    <Text style={{ color: formSection === "cafe" ? COLORS.white : COLORS.slate, fontWeight: "800" }}>☕ Cafe</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", gap: 8, marginVertical: 4 }}>
                {getSubCategories(categories, formSection).map((cat) => (
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
                    disabled={uploading}
                  >
                    <Text style={{ color: formCategory === cat.id ? COLORS.white : COLORS.slate, fontSize: 12, fontWeight: "800" }}>
                      {cat.icon} {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Image</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {formImage ? (
                  <Image source={{ uri: formImage }} style={{ width: 80, height: 80, borderRadius: 12 }} />
                ) : (
                  <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 24 }}>📷</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 8 }}>
                  <Button variant="secondary" onPress={handlePickImage} disabled={uploading}>
                    {formImage ? "Change Image" : "Pick Image"}
                  </Button>
                  {formImage && (
                    <Button variant="secondary" onPress={() => setFormImage(null)} style={{ borderColor: COLORS.danger }} disabled={uploading}>
                      <Text style={{ color: COLORS.danger }}>Remove Image</Text>
                    </Button>
                  )}
                </View>
              </View>
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
                  disabled={uploading}
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
                  disabled={uploading}
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
                  disabled={uploading}
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
                  disabled={uploading}
                >
                  <Text style={{ color: !formIsAvailable ? COLORS.danger : COLORS.slate, fontWeight: "800" }}>Off (Unavailable)</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={() => setAddModalVisible(false)} disabled={uploading}>Cancel</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button onPress={handleAddItem} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color={COLORS.white} /> : "Save"}
                </Button>
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
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This cannot be undone.
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

      {/* Manage Categories Modal */}
      <Modal visible={manageModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { maxHeight: "85%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 }}>
              <Text style={styles.modalTitle}>Manage Tags</Text>
              <Pressable onPress={() => setManageModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 22, color: COLORS.slate }}>×</Text>
              </Pressable>
            </View>

            {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 10, marginBottom: 6 }}>
              Active {selectedSection === "restaurant" ? "Restaurant" : "Cafe"} Tags
            </Text>

            <ScrollView style={{ flexGrow: 0, maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 8, paddingVertical: 4 }}>
                {getSubCategories(categories, selectedSection).map((cat) => (
                  <View key={cat.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.bg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.text }}>{cat.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(cat.id)}
                      disabled={actionLoading}
                      style={{ padding: 6 }}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={{ borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, gap: 10, marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text }}>Add New Tag</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.inputLabel}>Emoji Icon</Text>
                  <TextInput
                    value={newCatEmoji}
                    onChangeText={setNewCatEmoji}
                    placeholder="e.g. 🍹"
                    style={styles.input}
                    editable={!actionLoading}
                  />
                </View>
                <View style={{ flex: 2, gap: 4 }}>
                  <Text style={styles.inputLabel}>Tag Name</Text>
                  <TextInput
                    value={newCatName}
                    onChangeText={setNewCatName}
                    placeholder="e.g. Drinks"
                    style={styles.input}
                    editable={!actionLoading}
                  />
                </View>
              </View>
              <Button onPress={handleAddCategory} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color={COLORS.white} /> : "+ Add Tag"}
              </Button>
            </View>
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
  sectionRail: {
    flexDirection: "row",
    gap: 8,
  },
  sectionTab: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTabActive: {
    backgroundColor: COLORS.espresso,
    borderColor: COLORS.espresso,
  },
  sectionTabText: {
    color: COLORS.slate,
    fontSize: 13,
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
  scrollContent: {
    gap: 12,
    padding: 18,
    paddingBottom: 34,
  },
  listContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  list: {
    gap: 12,
    paddingRight: 32,
  },
  arrowLeft: {
    position: "absolute",
    left: 10,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowText: {
    fontSize: 22,
    color: COLORS.slate,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: -2,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "column",
    width: 160,
    height: 255,
    padding: 12,
    alignItems: "stretch",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  cardFooter: {
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  details: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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

