import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function AuthBar() {
  const { isAuthenticated, signOut, role } = useAuth();

  if (!isAuthenticated) {
    return (
      <Pressable style={styles.btn} onPress={() => router.replace('/(auth)/admin/login')}>
        <Text style={styles.text}>Login (admin)</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.role}>Signed in as: {role}</Text>
      <Pressable style={styles.btn} onPress={signOut}>
        <Text style={styles.text}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    // Note: backdropFilter works on web; on native it's ignored.
    // @ts-ignore
    backdropFilter: 'blur(6px)',
  },
  role: { color: '#fff', fontSize: 14 },
  btn: {
    backgroundColor: '#ff4d4d',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: { color: '#fff', fontWeight: '600' },
});
