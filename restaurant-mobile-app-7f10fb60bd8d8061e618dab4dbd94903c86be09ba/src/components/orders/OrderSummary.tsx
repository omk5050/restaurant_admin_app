import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { Order } from "@/types";

interface OrderSummaryProps {
  order: Order;
  onReviewBill: () => void;
}

export function OrderSummary({ order, onReviewBill }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={[styles.bottomSheet, isExpanded && styles.bottomSheetExpanded]}>
      {/* Header Bar */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Order Summary</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItemsCount}</Text>
          </View>
        </View>

        {!isExpanded && (
          <Text style={styles.collapsedTotal}>
            Total: <Text style={styles.collapsedTotalVal}>{formatCurrency(order.total)}</Text>
          </Text>
        )}

        <Text style={styles.toggleText}>{isExpanded ? "▼ Collapse" : "▲ Expand"}</Text>
      </Pressable>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
            {order.items.length === 0 ? (
              <Text style={styles.emptyText}>No items added yet.</Text>
            ) : (
              order.items.map((item) => (
                <View key={item.menuItemId} style={styles.itemRow}>
                  <View style={styles.itemName}>
                    <Text numberOfLines={1} style={styles.name}>
                      {item.name}
                    </Text>
                    <Text style={styles.qty}>x{item.qty}</Text>
                  </View>
                  <Text style={styles.amount}>{formatCurrency(item.price * item.qty)}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (5%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.gstAmount)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          <Button onPress={onReviewBill} disabled={order.items.length === 0} style={styles.reviewButton}>
            Review Bill →
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 60, // Above the OrderBottomBar which has height ~60px
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetExpanded: {
    height: 350, // Height when expanded
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
  },
  collapsedTotal: {
    fontSize: 13,
    color: COLORS.textSec,
  },
  collapsedTotalVal: {
    fontWeight: "900",
    color: COLORS.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    marginTop: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 8,
  },
  itemRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  itemName: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  name: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  qty: {
    color: COLORS.textSec,
    fontSize: 11,
    fontWeight: "600",
  },
  amount: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.textSec,
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 16,
  },
  totals: {
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: COLORS.textSec,
    fontSize: 11,
  },
  totalValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  grandLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  grandValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  reviewButton: {
    marginTop: 12,
    minHeight: 44,
  },
});
