import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { role, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role !== 'super-admin') {
      // redirect to super-admin login if not authorized
      router.replace('/(auth)/super-admin/login');
    }
  }, [role]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/super-admin/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    height: 60,
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutBtn: {
    backgroundColor: '#e74c3c',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 14,
  },
});
