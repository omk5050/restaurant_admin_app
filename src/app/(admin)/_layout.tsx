import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role !== 'admin') {
      // redirect to admin login if not admin
      router.replace('/(auth)/admin/login');
    }
  }, [role]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 22, fontWeight: '600', color: '#222' },
  signOutButton: { backgroundColor: '#e74c3c', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  signOutText: { color: '#fff', fontWeight: '500' },
});
