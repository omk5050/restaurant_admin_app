import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function AuthBar() {
  const { isAuthenticated, role } = useAuth();

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
});
