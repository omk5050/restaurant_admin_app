import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThermalReceipt } from "@/components/invoice/ThermalReceipt";
import { Button } from "@/components/ui/Button";
import { useInvoice } from "@/hooks/useInvoice";
import { useOrder } from "@/hooks/useOrder";
import { useTableStore } from "@/store/tableStore";

export default function InvoiceScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { invoice, settings, previewPrint } = useInvoice(orderId);
  const { findOrder } = useOrder();
  const order = orderId ? findOrder(orderId) : undefined;
  const fallbackInvoice =
    invoice ??
    (order?.paymentMethod
      ? {
          id: `preview_${order.id}`,
          orderId: order.id,
          tableId: order.tableId,
          orderNo: order.orderNo,
          items: order.items,
          subtotal: order.subtotal,
          gstAmount: order.gstAmount,
          total: order.total,
          paymentMethod: order.paymentMethod,
          createdAt: order.closedAt ?? new Date().toISOString(),
        }
      : undefined);

  const handleDone = async () => {
    if (fallbackInvoice) {
      try {
        await useTableStore.getState().clearTable(fallbackInvoice.tableId);
      } catch (err) {
        console.error("Failed to clear table:", err);
      }
    }
    router.replace("/(tabs)" as never);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      {fallbackInvoice ? (
        <>
          <ThermalReceipt invoice={fallbackInvoice} settings={settings} />
          <View style={styles.actions}>
            <Button onPress={() => previewPrint(fallbackInvoice)}>Print Receipt</Button>
            <Button variant="secondary">Share as PDF</Button>
            <Button variant="success" onPress={handleDone}>
              Done — Back to Tables
            </Button>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#DDE1E7",
    flex: 1,
  },
  content: {
    alignItems: "center",
    gap: 20,
    padding: 14,
    paddingBottom: 28,
    paddingTop: 20,
  },
  actions: {
    gap: 10,
    maxWidth: 330,
    width: "100%",
  },
});

