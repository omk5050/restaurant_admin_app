import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function Index() {
  const { isAuthenticated, role, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') {
        router.replace('/(tabs)');
      } else if (role === 'super-admin') {
        router.replace('/(super-admin)');
      }
    }
  }, [isAuthenticated, role]);

  const handleLogin = (type: 'admin' | 'super-admin') => {
    router.push(`/(auth)/${type}/login` as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Admin Portal</Text>
      {isAuthenticated ? (
        <>
          <Text style={styles.status}>Logged in as {role}</Text>
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.status}>Please log in</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleLogin('admin')}>
            <Text style={styles.buttonText}>Admin Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => handleLogin('super-admin')}>
            <Text style={styles.buttonText}>Super Admin Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222',
  },
  status: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
