import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "@/constants/colors";
import { useSettingsStore } from "@/store/settingsStore";
import { useTableStore } from "@/store/tableStore";
import { useMenuStore } from "@/store/menuStore";
import { useOrderStore } from "@/store/orderStore";

export default function RootLayout() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const fetchTables = useTableStore((state) => state.fetchTables);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchAnalytics = useOrderStore((state) => state.fetchAnalytics);

  useEffect(() => {
    // Initial data fetch from the backend
    fetchSettings();
    fetchTables();
    fetchMenu();
    fetchOrders();
    fetchAnalytics();
  }, [fetchSettings, fetchTables, fetchMenu, fetchOrders, fetchAnalytics]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="table/[id]" options={{ title: "Table Order" }} />
        <Stack.Screen name="payment/[tableId]" options={{ title: "Receive Payment" }} />
        <Stack.Screen name="invoice/[orderId]" options={{ title: "Invoice" }} />
      </Stack>
    </>
  );
}

