import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { API_URL } from '@/constants/config';
import { apiFetch } from '@/utils/api';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { role } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (role !== 'super-admin') {
      router.replace('/(auth)/super-admin/login');
    } else {
      fetchAdmins();
    }
  }, [role]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/api/super-admin/admins`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to fetch admin users.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setModalVisible(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword(''); // Leave blank unless changing
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and Email are required.');
      return;
    }

    if (!editingAdmin && !password.trim()) {
      Alert.alert('Validation Error', 'Password is required for new accounts.');
      return;
    }

    try {
      setFormLoading(true);
      const url = editingAdmin
        ? `${API_URL}/api/super-admin/admins/${editingAdmin._id}`
        : `${API_URL}/api/super-admin/admins`;

      const method = editingAdmin ? 'PUT' : 'POST';
      const body: Record<string, string> = { name, email };
      if (password.trim()) {
        body.password = password;
      }

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        Alert.alert(
          'Success',
          editingAdmin ? 'Admin updated successfully.' : 'New Admin created successfully.'
        );
        setModalVisible(false);
        fetchAdmins();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to save admin user.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred while saving.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (admin: AdminUser) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${admin.name} (${admin.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await apiFetch(`${API_URL}/api/super-admin/admins/${admin._id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                Alert.alert('Success', 'Admin deleted successfully.');
                fetchAdmins();
              } else {
                const err = await res.json();
                Alert.alert('Error', err.error || 'Failed to delete admin.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'An error occurred.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderAdminItem = ({ item }: { item: AdminUser }) => (
    <View style={styles.adminCard}>
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{item.name}</Text>
        <Text style={styles.adminEmail}>{item.email}</Text>
        <Text style={styles.adminDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (role !== 'super-admin') {
    return null;
  }

  return (
    <LinearGradient colors={['#f4f6f9', '#e3e8f0']} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Manage Admin User Accounts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add Admin</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loaderText}>Loading Admins...</Text>
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item._id}
          renderItem={renderAdminItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No admin accounts found.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Admin Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</Text>
            
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              placeholder={editingAdmin ? 'Password (leave blank to keep unchanged)' : 'Password'}
              placeholderTextColor="#aaa"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
                disabled={formLoading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  addBtn: {
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 24,
  },
  adminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminInfo: {
    flex: 1,
    marginRight: 16,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  adminDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtn: {
    backgroundColor: '#f1f5f9',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  saveBtn: {
    backgroundColor: '#4a90e2',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '500',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});
