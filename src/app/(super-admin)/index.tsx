import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
  SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/utils/api';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SuperAdminDashboard() {
  const { role, signOut } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/auth/admins`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        const err = await res.json();
        console.error('Failed to fetch admins:', err.error);
      }
    } catch (e) {
      console.error('Failed to fetch admins:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'super-admin') {
      router.replace('/(auth)/super-admin/login');
      return;
    }
    fetchAdmins();
  }, [role]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !restaurantName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/api/auth/register-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, restaurantName }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalVisible(false);
        setName(''); setEmail(''); setPassword(''); setRestaurantName('');
        fetchAdmins();
        Alert.alert('✅ Success', `${restaurantName} has been registered!`);
      } else {
        setError(data.error || 'Failed to register admin.');
      }
    } catch (e) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspect = async (adminId: string, restName: string) => {
    await AsyncStorage.setItem('selectedAdminId', adminId);
    router.replace('/(tabs)');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setName(''); setEmail(''); setPassword(''); setRestaurantName('');
    setError('');
  };

  if (role !== 'super-admin') return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>SUPER ADMIN</Text>
          <Text style={styles.headerTitle}>Restaurant Hub</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{admins.length}</Text>
          <Text style={styles.statLabel}>Total Admins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{admins.length}</Text>
          <Text style={styles.statLabel}>Restaurants</Text>
        </View>
        <View style={styles.statDivider} />
        <TouchableOpacity style={[styles.statItem, styles.registerStat]} onPress={() => setModalVisible(true)}>
          <Text style={styles.registerStatText}>＋ Register Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Admin List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Registered Restaurants</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyTitle}>No admins yet</Text>
              <Text style={styles.emptySubtitle}>Tap "Register Admin" to add your first restaurant</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.emptyBtnText}>＋ Register Admin</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Card header */}
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrap}>
                  <Text style={styles.cardIcon}>🏪</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardRestaurant} numberOfLines={1}>{item.restaurantName}</Text>
                  <Text style={styles.cardAdmin} numberOfLines={1}>{item.name}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>

              {/* Card details */}
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>✉️</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>
                    Joined {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              {/* Inspect button */}
              <TouchableOpacity
                style={styles.inspectBtn}
                onPress={() => handleInspect(item._id, item.restaurantName)}
                activeOpacity={0.85}
              >
                <Text style={styles.inspectBtnText}>View Portal  →</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Register Admin Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Pull indicator */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Register New Admin</Text>
            <Text style={styles.modalSubtitle}>A restaurant will be auto-created with demo data.</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {[
                { label: 'Admin Full Name', value: name, setter: setName, placeholder: 'e.g. Jane Doe', keyboard: 'default' as const },
                { label: 'Email Address', value: email, setter: setEmail, placeholder: 'e.g. jane@restaurant.com', keyboard: 'email-address' as const },
                { label: 'Password', value: password, setter: setPassword, placeholder: 'Minimum 6 characters', keyboard: 'default' as const, secure: true },
                { label: 'Restaurant Name', value: restaurantName, setter: setRestaurantName, placeholder: "e.g. Jane's Pizzeria", keyboard: 'default' as const },
              ].map((field) => (
                <View key={field.label} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="#aaa"
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboard}
                    secureTextEntry={field.secure}
                    autoCapitalize={field.keyboard === 'email-address' || field.secure ? 'none' : 'words'}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={submitting} activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>Register</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1e1b4b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 16,
    backgroundColor: '#1e1b4b',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a5b4fc',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  logoutBtnText: {
    color: '#fca5a5',
    fontWeight: '800',
    fontSize: 13,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#2d2a6e',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#a5b4fc',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(165,180,252,0.2)',
    marginHorizontal: 8,
  },
  registerStat: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  registerStatText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f3ff',
  },
  loadingText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: '#f5f3ff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3730a3',
    marginBottom: 6,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b4b' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardIcon: { fontSize: 24 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardRestaurant: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  cardAdmin: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  activeBadgeText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: { fontSize: 13 },
  detailText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  inspectBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inspectBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e1b4b',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  modalScroll: {
    maxHeight: 340,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 15,
  },
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
