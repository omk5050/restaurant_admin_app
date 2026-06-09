import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useTableStore } from '@/store/tableStore';
import { useMenuStore } from '@/store/menuStore';
import { useOrderStore } from '@/store/orderStore';

const RootContent = () => {
  const { isAuthenticated, signOut } = useAuth();
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const fetchTables = useTableStore(s => s.fetchTables);
  const fetchMenu = useMenuStore(s => s.fetchMenu);
  const fetchOrders = useOrderStore(s => s.fetchOrders);
  const fetchAnalytics = useOrderStore(s => s.fetchAnalytics);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchTables();
      fetchMenu();
      fetchOrders();
      fetchAnalytics();
    }
  }, [isAuthenticated, fetchSettings, fetchTables, fetchMenu, fetchOrders, fetchAnalytics]);

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Restaurant Admin</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/admin/login')}
        >
          <Text style={styles.buttonText}>Admin Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/super-admin/login')}
        >
          <Text style={styles.buttonText}>Super Admin Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.stackContainer}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.text,
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="table/[id]" options={{ title: 'Table Order' }} />
        <Stack.Screen name="payment/[tableId]" options={{ title: 'Receive Payment' }} />
        <Stack.Screen name="invoice/[orderId]" options={{ title: 'Invoice' }} />
        <Stack.Screen name="(auth)/admin/login" options={{ title: 'Admin Login' }} />
        <Stack.Screen name="(auth)/super-admin/login" options={{ title: 'Super Admin Login' }} />
      </Stack>
    </View>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stackContainer: { flex: 1 },
  logoutButton: { marginRight: 12, padding: 6 },
  logoutText: { color: COLORS.danger, fontWeight: '600' },
});
