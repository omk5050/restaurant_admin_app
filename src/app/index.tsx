import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
    if (type === 'admin') {
      router.push('/(auth)/admin/login' as never);
    } else {
      router.push('/(auth)/super-admin/login' as never);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e3a5f', '#0f172a']}
      style={styles.container}
    >
      {/* Background decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        {/* Logo / Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>

        <Text style={styles.title}>Restaurant{'\n'}Admin Portal</Text>
        <Text style={styles.subtitle}>Manage your restaurant operations with ease</Text>

        {isAuthenticated ? (
          <View style={styles.authSection}>
            <View style={styles.loggedInBadge}>
              <Text style={styles.loggedInText}>✓  Logged in as {role}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => handleLogin('admin')}
              activeOpacity={0.85}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonIcon}>🏪</Text>
                <View>
                  <Text style={styles.buttonLabel}>Admin Login</Text>
                  <Text style={styles.buttonDesc}>Manage your restaurant</Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.superAdminButton}
              onPress={() => handleLogin('super-admin')}
              activeOpacity={0.85}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonIcon}>👑</Text>
                <View>
                  <Text style={styles.buttonLabel}>Super Admin</Text>
                  <Text style={styles.buttonDesc}>Manage all restaurants</Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.footer}>© 2025 Restaurant Admin System</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    bottom: -60,
    left: -60,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 28,
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  adminButton: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
    overflow: 'hidden',
  },
  superAdminButton: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    overflow: 'hidden',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 22,
    gap: 16,
  },
  buttonIcon: {
    fontSize: 30,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  buttonDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  arrowIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 'auto',
  },
  authSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  loggedInBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loggedInText: {
    color: '#6ee7b7',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
  },
});
