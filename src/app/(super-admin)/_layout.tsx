import React, { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, StyleSheet } from 'react-native';

export default function SuperAdminLayout() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role !== null && role !== 'super-admin') {
      // redirect to super-admin login if not authorized
      router.replace('/(auth)/super-admin/login');
    }
  }, [role, router]);

  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
