import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput, TouchableOpacity, useWindowDimensions, Platform } from "react-native";

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
  const [formTableCount, setFormTableCount] = useState(String(settings.tableCount));
  const [error, setError] = useState("");

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
    setFormTableCount(String(settings.tableCount));
    setError("");
    setSettingsModalVisible(true);
  };

  const handleSaveSettings = async () => {
    if (!formName.trim() || !formTableCount.trim()) {
      setError("Restaurant Name and Table Count are required.");
      return;
    }
    const countVal = Number(formTableCount);
    if (isNaN(countVal) || countVal <= 0) {
      setError("Table count must be a positive number.");
      return;
    }

    try {
      await updateSettings({
        restaurantName: formName,
        address: formAddress,
        gstNumber: formGstNumber,
        gstPercent: Number(formGstPercent),
        currency: formCurrency,
        tableCount: countVal,
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <View style={[styles.heroTop, isSmallScreen && { flexWrap: "wrap", gap: 12 }]}>
          <View style={{ flex: 1, flexShrink: 1, minWidth: 150 }}>
            <Text style={styles.kicker}>DINING ROOM LIVE</Text>
            <Text style={styles.heroTitle} numberOfLines={1} ellipsizeMode="tail">{settings.restaurantName}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <Pressable onPress={handleOpenSettings} style={styles.servicePill}>
              <Text style={{ color: "#F8FAFC", fontSize: 13 }}>⚙️</Text>
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
          <Text style={styles.metricValue}>{activeTables}</Text>
          <Text style={styles.metricLabel}>Active</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={[styles.metricValue, styles.billMetric]}>{billedTables}</Text>
          <Text style={styles.metricLabel}>Bills</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={[styles.metricValue, styles.paidMetric]}>{paidTables}</Text>
          <Text style={styles.metricLabel}>Paid</Text>
        </Card>
        <Card style={[styles.metricCard, isSmallScreen && { minWidth: "47%", flex: 0 }]}>
          <Text style={styles.metricValue}>{emptyTables}</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount of Tables</Text>
              <TextInput value={formTableCount} onChangeText={setFormTableCount} keyboardType="numeric" style={styles.input} />
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
              style={styles.logoutBtn}
              onPress={async () => {
                setSettingsModalVisible(false);
                await signOut();
                if (Platform.OS === "web") {
                  window.location.reload();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>⏻  Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    boxShadow: "0 18px 38px rgba(43, 33, 24, 0.20)",
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
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 13,
    boxShadow: "0 8px 22px rgba(35, 27, 19, 0.07)",
  },
  metricValue: {
    color: COLORS.primaryDark,
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
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
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
});

