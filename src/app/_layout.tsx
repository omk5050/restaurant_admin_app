import React, { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useTableStore } from '@/store/tableStore';
import { useMenuStore } from '@/store/menuStore';
import { useOrderStore } from '@/store/orderStore';

const RootContent = () => {
  const { isAuthenticated, signOut, role } = useAuth();
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const fetchTables = useTableStore(s => s.fetchTables);
  const fetchMenu = useMenuStore(s => s.fetchMenu);
  const fetchOrders = useOrderStore(s => s.fetchOrders);
  const fetchAnalytics = useOrderStore(s => s.fetchAnalytics);
  const segments = useSegments();

  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
      fetchTables();
      fetchMenu();
      fetchOrders();
      fetchAnalytics();
    }
  }, [isAuthenticated, fetchSettings, fetchTables, fetchMenu, fetchOrders, fetchAnalytics]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    if (!isAuthenticated && !inAuthGroup && !isRoot) {
      // Redirect to selector screen if unauthenticated and trying to access a protected page
      router.replace('/');
    }
  }, [isAuthenticated, segments]);

  useEffect(() => {
    const checkSelectedAdmin = async () => {
      const selected = await AsyncStorage.getItem('selectedAdminId');
      setSelectedAdminId(selected);
    };
    if (isAuthenticated) {
      checkSelectedAdmin();
    } else {
      setSelectedAdminId(null);
    }
  }, [segments, isAuthenticated]);

  const handleExitImpersonation = async () => {
    await AsyncStorage.removeItem('selectedAdminId');
    setSelectedAdminId(null);
    // Reload stores to fetch super-admin's clean settings or clear
    fetchSettings();
    fetchTables();
    fetchMenu();
    fetchOrders();
    fetchAnalytics();
    router.replace('/(super-admin)');
  };

  return (
    <View style={styles.stackContainer}>
      <StatusBar style="dark" />
      {role === 'super-admin' && selectedAdminId && (
        <View style={styles.impersonationBanner}>
          <Text style={styles.impersonationText}>
            Viewing Admin's Restaurant Portal
          </Text>
          <TouchableOpacity onPress={handleExitImpersonation} style={styles.impersonationBtn}>
            <Text style={styles.impersonationBtnText}>Return to Super Admin Panel</Text>
          </TouchableOpacity>
        </View>
      )}
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.text,
          headerRight: () => isAuthenticated ? (
            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ) : null,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(super-admin)" options={{ headerShown: false }} />
        <Stack.Screen name="table/[id]" options={{ title: 'Table Order' }} />
        <Stack.Screen name="payment/[tableId]" options={{ title: 'Receive Payment' }} />
        <Stack.Screen name="invoice/[orderId]" options={{ title: 'Invoice' }} />
        <Stack.Screen name="(auth)/admin/login" options={{ title: 'Admin Login', headerShown: false }} />
        <Stack.Screen name="(auth)/super-admin/login" options={{ title: 'Super Admin Login', headerShown: false }} />
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
  impersonationBanner: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  impersonationText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  impersonationBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  impersonationBtnText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },
});
