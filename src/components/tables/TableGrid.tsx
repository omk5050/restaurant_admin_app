import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Platform } from "react-native";
import { router } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/constants/colors";
import { Order, Table, TableStatus } from "@/types";
import { useTableStore } from "@/store/tableStore";
import { useOrderStore } from "@/store/orderStore";

interface TableGridProps {
  tables: Table[];
  getOrderForTable: (tableId: number) => Order | undefined;
}

const STATUS_CONFIG: Record<
  TableStatus,
  { circleBorder: string; circleText: string; statusText: string; label: string }
> = {
  empty: {
    circleBorder: "#94A3B8",
    circleText: "#64748B",
    statusText: "#475569",
    label: "Empty",
  },
  active: {
    circleBorder: COLORS.primary,
    circleText: COLORS.primary,
    statusText: COLORS.primary,
    label: "Active",
  },
  bill: {
    circleBorder: COLORS.blue,
    circleText: COLORS.blue,
    statusText: COLORS.blue,
    label: "Bill Ready",
  },
  paid: {
    circleBorder: COLORS.green,
    circleText: COLORS.green,
    statusText: COLORS.green,
    label: "Paid",
  },
};

export function TableGrid({ tables, getOrderForTable }: TableGridProps) {
  const { width } = useWindowDimensions();
  const isTabletDesktop = width >= 768;
  const isMobile = !isTabletDesktop;
  
  const clearTable = useTableStore((state) => state.clearTable);

  const handleLongPress = async (table: Table) => {
    if (table.status === "empty") return;
    await clearTable(table.id);
    await useOrderStore.getState().fetchOrders();
    await useOrderStore.getState().fetchAnalytics();
  };

  const restaurantTables = tables.filter((t) => t.name.startsWith("R"));
  const familyTables = tables.filter((t) => t.name.startsWith("F"));
  const takeawayTables = tables.filter((t) => t.name.startsWith("T"));

  const renderTableRow = (table: Table, displayIndex: number) => {
    const order = getOrderForTable(table.id);
    let status = table.status;
    if (table.id >= 11) {
      if (order) {
        if (order.status === "open" || order.status === "hold") {
          status = "active";
        } else if (order.status === "billed") {
          status = "bill";
        } else if (order.status === "paid") {
          status = "paid";
        }
      } else {
        status = "empty";
      }
    }
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
    return (
      <Pressable
        key={table.id}
        onPress={() => router.push(`/table/${table.id}` as never)}
        onLongPress={() => handleLongPress(table)}
        style={({ pressed }) => [
          styles.rowItem,
          isMobile ? styles.rowItemMobile : styles.rowItemTablet,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={[styles.circle, isMobile && styles.circleMobile, { borderColor: config.circleBorder }]}>
          <Text style={[styles.circleText, isMobile && styles.circleTextMobile, { color: config.circleText }]}>{displayIndex}</Text>
        </View>
        <View style={[styles.textContainer, isMobile && styles.textContainerMobile]}>
          <Text style={[styles.statusText, isMobile && styles.statusTextMobile, { color: config.statusText }]} numberOfLines={1} ellipsizeMode="tail">
            {config.label}
          </Text>
          <Text style={[styles.seatsText, isMobile && styles.seatsTextMobile]}>
            {table.seats} seats
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={isMobile ? [styles.container, styles.containerMobile] : styles.containerTablet}>
      {/* 1. Restaurant Column */}
      <View style={[isMobile ? styles.column : styles.sectionCard, isMobile && styles.columnMobile]}>
        <View style={[styles.columnHeader, isMobile && styles.columnHeaderMobile]}>
          <View style={[styles.iconPlate, { backgroundColor: "#FFF1E7" }]}>
            <MaterialIcons name="restaurant" size={isMobile ? 18 : 20} color={COLORS.primary} />
          </View>
          <View style={[styles.headerTextContainer, isMobile && styles.headerTextContainerMobile]}>
            <Text style={[styles.columnTitle, isMobile && styles.columnTitleMobile]}>Restaurant</Text>
            <Text style={[styles.columnSubtitle, isMobile && styles.columnSubtitleMobile]}>{restaurantTables.length} tables</Text>
          </View>
        </View>
        <View style={isMobile ? styles.listContainer : styles.listContainerTablet}>
          {restaurantTables.map((table, idx) => renderTableRow(table, idx + 1))}
        </View>
      </View>

      {isMobile && <View style={[styles.verticalDivider, styles.verticalDividerMobile]} />}

      {/* 2. Family Section Column */}
      <View style={[isMobile ? styles.column : styles.sectionCard, isMobile && styles.columnMobile]}>
        <View style={[styles.columnHeader, isMobile && styles.columnHeaderMobile]}>
          <View style={[styles.iconPlate, { backgroundColor: "#ECFDF3" }]}>
            <MaterialCommunityIcons name="account-group" size={isMobile ? 18 : 20} color={COLORS.green} />
          </View>
          <View style={[styles.headerTextContainer, isMobile && styles.headerTextContainerMobile]}>
            <Text style={[styles.columnTitle, isMobile && styles.columnTitleMobile]}>Family Section</Text>
            <Text style={[styles.columnSubtitle, isMobile && styles.columnSubtitleMobile]}>{familyTables.length} tables</Text>
          </View>
        </View>
        <View style={isMobile ? styles.listContainer : styles.listContainerTablet}>
          {familyTables.map((table, idx) => renderTableRow(table, idx + 1))}
        </View>
      </View>

      {isMobile && <View style={[styles.verticalDivider, styles.verticalDividerMobile]} />}

      {/* 3. Takeaway Column */}
      <View style={[isMobile ? styles.column : styles.sectionCard, isMobile && styles.columnMobile]}>
        <View style={[styles.columnHeader, isMobile && styles.columnHeaderMobile]}>
          <View style={[styles.iconPlate, { backgroundColor: "#F5F3FF" }]}>
            <MaterialCommunityIcons name="shopping" size={isMobile ? 18 : 20} color={COLORS.purple} />
          </View>
          <View style={[styles.headerTextContainer, isMobile && styles.headerTextContainerMobile]}>
            <Text style={[styles.columnTitle, isMobile && styles.columnTitleMobile]}>Takeaway</Text>
            <Text style={[styles.columnSubtitle, isMobile && styles.columnSubtitleMobile]}>{takeawayTables.length} tables</Text>
          </View>
        </View>
        <View style={isMobile ? styles.listContainer : styles.listContainerTablet}>
          {takeawayTables.map((table, idx) => renderTableRow(table, idx + 1))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    flexDirection: "row",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#231B13",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 8px 24px rgba(35, 27, 19, 0.05)",
      },
    }),
  },
  containerMobile: {
    padding: 10,
    borderRadius: 16,
  },
  containerTablet: {
    flexDirection: "row",
    gap: 16,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#231B13",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 8px 24px rgba(35, 27, 19, 0.05)",
      },
    }),
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  columnMobile: {
    paddingHorizontal: 1,
  },
  columnCentered: {
    alignItems: "center",
  },
  columnHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  columnHeaderCentered: {
    marginBottom: 16,
    justifyContent: "center",
  },
  columnHeaderMobile: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  iconPlate: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  icon: {
    fontSize: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTextContainerMobile: {
    alignItems: "center",
    justifyContent: "center",
  },
  columnTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  columnTitleMobile: {
    fontSize: 11,
    textAlign: "center",
  },
  columnSubtitle: {
    color: COLORS.textSec,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  columnSubtitleMobile: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 0,
  },
  listContainer: {
    gap: 16,
  },
  listContainerTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  listContainerCentered: {
    alignItems: "center",
  },
  rowItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 4,
  },
  rowItemMobile: {
    gap: 6,
    paddingVertical: 3,
  },
  rowItemTablet: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 6,
    width: "47%",
    minWidth: 110,
  },
  rowItemCentered: {
    justifyContent: "center",
  },
  rowPressed: {
    opacity: 0.7,
  },
  circle: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  circleMobile: {
    height: 32,
    width: 32,
    borderWidth: 1.2,
  },
  circleText: {
    fontSize: 14,
    fontWeight: "800",
  },
  circleTextMobile: {
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  textContainerMobile: {
    // optional mobile adjustments
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusTextMobile: {
    fontSize: 11,
  },
  seatsText: {
    color: COLORS.textSec,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  seatsTextMobile: {
    fontSize: 9,
    marginTop: 0,
  },
  verticalDivider: {
    backgroundColor: "#F1F5F9",
    width: 1,
    marginHorizontal: 8,
  },
  verticalDividerMobile: {
    marginHorizontal: 4,
  },
});
