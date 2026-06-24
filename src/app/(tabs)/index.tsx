import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { TableGrid } from "@/components/tables/TableGrid";
import { Button } from "@/components/ui/Button";
import { COLORS, TABLE_STATUS_COLORS } from "@/constants/colors";
import { useTables } from "@/hooks/useTables";
import { useSettingsStore } from "@/store/settingsStore";
import { useOrderStore } from "@/store/orderStore";
import { useTableStore } from "@/store/tableStore";
import { formatCurrency, formatTime } from "@/utils/formatters";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;
  
  const { tables, getOrderForTable } = useTables();
  const { settings, updateSettings } = useSettingsStore();
  const { signOut } = useAuth();
  const analytics = useOrderStore((state) => state.analytics);
  const fetchTables = useTableStore((state) => state.fetchTables);
  const fetchAnalytics = useOrderStore((state) => state.fetchAnalytics);

  useEffect(() => {
    // Initial fetch
    fetchTables();
    fetchAnalytics();

    // Poll tables and stats every 10 seconds to keep live grid updated
    const interval = setInterval(() => {
      fetchTables();
      fetchAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTables, fetchAnalytics]);

  // Settings Modal State
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [formName, setFormName] = useState(settings.restaurantName);
  const [formAddress, setFormAddress] = useState(settings.address);
  const [formGstNumber, setFormGstNumber] = useState(settings.gstNumber);
  const [formGstPercent, setFormGstPercent] = useState(String(settings.gstPercent));
  const [formCurrency, setFormCurrency] = useState(settings.currency);
  const [formRestaurantTableCount, setFormRestaurantTableCount] = useState(String(settings.restaurantTableCount ?? 6));
  const [formFamilyTableCount, setFormFamilyTableCount] = useState(String(settings.familyTableCount ?? 4));
  const [formTakeawayTableCount, setFormTakeawayTableCount] = useState(String(settings.takeawayTableCount ?? 4));
  const [error, setError] = useState("");

  const hasActiveTables = tables.some((table) => table.status === "active" || table.status === "bill");

  const todaysSales = analytics.todaySales;
  const totalOrdersCount = analytics.paidCount + analytics.openOrdersCount;
  const activeTables = analytics.activeTablesCount;
  const billedTables = analytics.billedTablesCount;
  const paidTables = analytics.paidTablesCount;
  const emptyTables = analytics.emptyTablesCount;

  const handleOpenSettings = () => {
    setFormName(settings.restaurantName);
    setFormAddress(settings.address);
    setFormGstNumber(settings.gstNumber);
    setFormGstPercent(String(settings.gstPercent));
    setFormCurrency(settings.currency);
    setFormRestaurantTableCount(String(settings.restaurantTableCount ?? 6));
    setFormFamilyTableCount(String(settings.familyTableCount ?? 4));
    setFormTakeawayTableCount(String(settings.takeawayTableCount ?? 4));
    setError("");
    setSettingsModalVisible(true);
  };

  const handleSaveSettings = async () => {
    if (
      !formName.trim() ||
      !formRestaurantTableCount.trim() ||
      !formFamilyTableCount.trim() ||
      !formTakeawayTableCount.trim()
    ) {
      setError("Restaurant Name and all Table Counts are required.");
      return;
    }
    const rVal = Number(formRestaurantTableCount);
    const fVal = Number(formFamilyTableCount);
    const tVal = Number(formTakeawayTableCount);
    if (isNaN(rVal) || rVal < 0 || isNaN(fVal) || fVal < 0 || isNaN(tVal) || tVal < 0) {
      setError("Table counts must be non-negative numbers.");
      return;
    }

    try {
      await updateSettings({
        restaurantName: formName,
        address: formAddress,
        gstNumber: formGstNumber,
        gstPercent: Number(formGstPercent),
        currency: formCurrency,
        restaurantTableCount: rVal,
        familyTableCount: fVal,
        takeawayTableCount: tVal,
      });
      setSettingsModalVisible(false);
      setError("");
      fetchTables();
      fetchAnalytics();
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <View style={[styles.heroTop, isSmallScreen && { flexWrap: "wrap", gap: 12 }]}>
          <View style={{ flex: 1, flexShrink: 1, minWidth: 150 }}>
            <Text style={styles.kicker}>DINING ROOM LIVE</Text>
            <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">{settings.restaurantName}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Pressable onPress={handleOpenSettings} style={styles.servicePill}>
              <MaterialIcons name="settings" size={16} color="#F8FAFC" />
            </Pressable>
            <View style={styles.servicePill}>
              <View style={styles.liveDot} />
              <Text style={styles.serviceText}>Service on</Text>
            </View>
          </View>
        </View>
        <View style={[styles.heroBottom, isSmallScreen && { flexWrap: "wrap", gap: 12 }]}>
          <View style={{ flex: 1, flexShrink: 1, minWidth: 150 }}>
            <Text style={styles.heroLabel}>Today Sales</Text>
            <Text style={styles.heroValue}>{formatCurrency(todaysSales)}</Text>
            <Text style={styles.heroGood}>
              {analytics.todaySalesComparison >= 0 ? "↑" : "↓"} {Math.abs(analytics.todaySalesComparison)}% vs yesterday
            </Text>
          </View>
          <View style={styles.orderBadge}>
            <Text style={styles.orderCount}>{totalOrdersCount}</Text>
            <Text style={styles.orderLabel}>orders</Text>
          </View>
        </View>
      </View>

      <View style={[styles.metricsRow, isSmallScreen && { flexWrap: "wrap", gap: 10 }]}>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <View style={[styles.metricIconPlate, { backgroundColor: "#FFF1E7" }]}>
            <MaterialIcons name="chair" size={20} color="#FF8A00" />
          </View>
          <Text style={[styles.metricValue, { color: "#FF8A00" }]}>{activeTables}</Text>
          <Text style={styles.metricLabel}>Active</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <View style={[styles.metricIconPlate, { backgroundColor: "#EFF6FF" }]}>
            <MaterialIcons name="receipt-long" size={20} color={COLORS.blue} />
          </View>
          <Text style={[styles.metricValue, styles.billMetric]}>{billedTables}</Text>
          <Text style={styles.metricLabel}>Bills</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <View style={[styles.metricIconPlate, { backgroundColor: "#ECFDF3" }]}>
            <MaterialIcons name="credit-card" size={20} color="#22C55E" />
          </View>
          <Text style={[styles.metricValue, styles.paidMetric, { color: "#22C55E" }]}>{paidTables}</Text>
          <Text style={styles.metricLabel}>Paid</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <View style={[styles.metricIconPlate, { backgroundColor: "#F5F3FF" }]}>
            <MaterialCommunityIcons name="door-open" size={20} color={COLORS.purple} />
          </View>
          <Text style={[styles.metricValue, { color: COLORS.purple }]}>{emptyTables}</Text>
          <Text style={styles.metricLabel}>Open</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Tables</Text>
          <Text style={styles.subtitle}>Last updated {analytics.latestOrderOpenedAt ? formatTime(analytics.latestOrderOpenedAt) : "09:41 AM"}</Text>
        </View>
        <View style={styles.liveOrdersPill}>
          <Text style={styles.liveOrdersText}>{analytics.openOrdersCount} live orders</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {Object.entries(TABLE_STATUS_COLORS).map(([key, value]) => (
          <View key={key} style={[styles.legendItem, { backgroundColor: value.bg, borderColor: value.bd }]}>
            <View style={[styles.dot, { backgroundColor: value.dot }]} />
            <Text style={styles.legendText}>{value.label}</Text>
          </View>
        ))}
      </View>

      <TableGrid tables={tables} getOrderForTable={getOrderForTable} />

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput value={formName} onChangeText={setFormName} style={styles.input} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput value={formAddress} onChangeText={setFormAddress} style={styles.input} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput value={formGstNumber} onChangeText={setFormGstNumber} style={styles.input} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST %</Text>
              <TextInput value={formGstPercent} onChangeText={setFormGstPercent} keyboardType="numeric" style={styles.input} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Currency Symbol</Text>
              <TextInput value={formCurrency} onChangeText={setFormCurrency} style={styles.input} />
            </View>

            {hasActiveTables && (
              <View style={styles.flashcard}>
                <View style={styles.flashcardHeader}>
                  <MaterialIcons name="lock" size={18} color="#EA580C" />
                  <Text style={styles.flashcardTitle}>Table Layout Locked</Text>
                </View>
                <Text style={styles.flashcardText}>
                  Active or billed tables are present in the dining room. Clear or settle all active orders before changing table counts.
                </Text>
              </View>
            )}

            <View style={styles.tableConfigSection}>
              <Text style={styles.tableConfigSectionTitle}>Amount of Tables per Section</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Restaurant</Text>
                  <TextInput
                    value={formRestaurantTableCount}
                    onChangeText={setFormRestaurantTableCount}
                    keyboardType="numeric"
                    editable={!hasActiveTables}
                    style={[styles.input, hasActiveTables && styles.inputDisabled]}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Family</Text>
                  <TextInput
                    value={formFamilyTableCount}
                    onChangeText={setFormFamilyTableCount}
                    keyboardType="numeric"
                    editable={!hasActiveTables}
                    style={[styles.input, hasActiveTables && styles.inputDisabled]}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Takeaway</Text>
                  <TextInput
                    value={formTakeawayTableCount}
                    onChangeText={setFormTakeawayTableCount}
                    keyboardType="numeric"
                    editable={!hasActiveTables}
                    style={[styles.input, hasActiveTables && styles.inputDisabled]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" onPress={() => setSettingsModalVisible(false)}>Cancel</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button onPress={handleSaveSettings}>Save</Button>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.logoutBtn, { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }]}
              onPress={async () => {
                setSettingsModalVisible(false);
                await signOut();
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    backgroundColor: COLORS.bg,
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: COLORS.espresso,
    borderCurve: "continuous",
    borderRadius: 28,
    gap: 24,
    overflow: "hidden",
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: "#2b2118",
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.20,
        shadowRadius: 38,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 18px 38px rgba(43, 33, 24, 0.20)",
      },
    }),
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  kicker: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  servicePill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  liveDot: {
    backgroundColor: COLORS.green,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  serviceText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "800",
  },
  heroBottom: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#C7BFB6",
    fontSize: 12,
    fontWeight: "800",
  },
  heroValue: {
    color: COLORS.white,
    fontSize: 34,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    marginTop: 2,
  },
  heroGood: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  orderBadge: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderCurve: "continuous",
    borderRadius: 20,
    minWidth: 78,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  orderCount: {
    color: COLORS.white,
    fontSize: 25,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  orderLabel: {
    color: "#FFEAD9",
    fontSize: 11,
    fontWeight: "800",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 13,
    borderRadius: 18,
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#231B13",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.07,
        shadowRadius: 22,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 8px 22px rgba(35, 27, 19, 0.07)",
      },
    }),
  },
  metricIconPlate: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  billMetric: {
    color: COLORS.blue,
  },
  paidMetric: {
    color: COLORS.slate,
  },
  metricLabel: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  liveOrdersPill: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveOrdersText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendText: {
    color: COLORS.slate,
    fontSize: 11,
    fontWeight: "800",
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
  logoutBtn: {
    alignItems: "center",
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 14,
  },
  logoutBtnText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "800",
  },
  flashcard: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  flashcardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flashcardTitle: {
    color: "#C2410C",
    fontSize: 13,
    fontWeight: "900",
  },
  flashcardText: {
    color: "#7C2D12",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  tableConfigSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    gap: 8,
  },
  tableConfigSectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputDisabled: {
    backgroundColor: "#F1F5F9",
    color: "#94A3B8",
    borderColor: "#E2E8F0",
  },
});

