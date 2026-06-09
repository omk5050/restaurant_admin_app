import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/utils/api';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SuperAdminDashboard() {
  const { role } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAdmins = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/auth/admins`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        const err = await res.json();
        console.error("Failed to fetch admins:", err.error);
      }
    } catch (e) {
      console.error("Failed to fetch admins:", e);
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
    setLoading(true);
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
        setName('');
        setEmail('');
        setPassword('');
        setRestaurantName('');
        fetchAdmins();
        Alert.alert('Success', 'Admin registered successfully and restaurant seeded!');
      } else {
        setError(data.error || 'Failed to register admin.');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (adminId: string) => {
    await AsyncStorage.setItem('selectedAdminId', adminId);
    router.replace('/(tabs)');
  };

  if (role !== 'super-admin') {
    return null;
  }

  return (
    <LinearGradient colors={['#f3e5f5', '#e1bee7']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage registered admins and inspect portal views</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Register Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{admins.length}</Text>
          <Text style={styles.statsLabel}>Total Admins</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Registered Admins</Text>

      <FlatList
        data={admins}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.adminCard}>
            <View style={styles.cardHeader}>
              <View style={styles.restaurantIcon}>
                <Text style={styles.restaurantEmoji}>🏪</Text>
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.restaurantTitle}>{item.restaurantName}</Text>
                <Text style={styles.adminName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{item.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Registered:</Text>
                <Text style={styles.detailValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.inspectButton} onPress={() => handleInspect(item._id)}>
              <Text style={styles.inspectButtonText}>Inspect Portal →</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No registered admins found. Register a new admin above.</Text>
          </View>
        }
      />

      {/* Register Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Register New Admin</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Full Name</Text>
              <TextInput 
                placeholder="e.g. Jane Doe"
                placeholderTextColor="#aaa"
                value={name} 
                onChangeText={setName} 
                style={styles.input} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Email</Text>
              <TextInput 
                placeholder="e.g. jane@restaurant.com"
                placeholderTextColor="#aaa"
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput 
                placeholder="Must be secure"
                placeholderTextColor="#aaa"
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry
                autoCapitalize="none"
                style={styles.input} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput 
                placeholder="e.g. Jane's Pizzeria"
                placeholderTextColor="#aaa"
                value={restaurantName} 
                onChangeText={setRestaurantName} 
                style={styles.input} 
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                disabled={loading} 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={loading} 
                style={[styles.modalBtn, styles.modalSubmitBtn]} 
                onPress={handleRegister}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Register</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4a148c',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6a1b9a',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#7b1fa2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statsRow: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: 140,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4a148c',
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7b1fa2',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4a148c',
    marginBottom: 16,
  },
  listContent: {
    gap: 16,
    paddingBottom: 40,
  },
  adminCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  restaurantIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantEmoji: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    marginLeft: 14,
  },
  restaurantTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  adminName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  inspectButton: {
    backgroundColor: '#ab47bc',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  inspectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4a148c',
    marginBottom: 8,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#f5f5f5',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    backgroundColor: '#7b1fa2',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
