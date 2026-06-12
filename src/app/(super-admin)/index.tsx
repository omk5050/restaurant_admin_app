import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/utils/api';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function SuperAdminDashboard() {
  const { role, signOut } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'admins' | 'requests'>('admins');
  const [loading, setLoading] = useState(true);

  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const triggerAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const fetchAdminsAndRequests = async () => {
    setLoading(true);
    try {
      const adminsRes = await apiFetch(`${API_URL}/api/auth/admins`);
      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data);
      }
      const requestsRes = await apiFetch(`${API_URL}/api/auth/registration-requests`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== 'super-admin') {
      router.replace('/(auth)/admin/login');
      return;
    }
    fetchAdminsAndRequests();
  }, [role]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiFetch(`${API_URL}/api/auth/registration-requests/${requestId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'approve') {
          triggerAlert(
            'Request Approved',
            'Registration request approved and admin account created.',
            'success'
          );
        } else {
          triggerAlert(
            'Request Rejected',
            'Registration request has been successfully rejected.',
            'success'
          );
        }
        fetchAdminsAndRequests();
      } else {
        triggerAlert(
          'Action Failed',
          data.error || `Failed to ${action} request.`,
          'error'
        );
      }
    } catch (e) {
      triggerAlert(
        'Connection Error',
        'Connection error. Please try again.',
        'error'
      );
    }
  };

  const handleInspect = async (adminId: string, restName: string) => {
    await AsyncStorage.setItem('selectedAdminId', adminId);
    router.replace('/(tabs)');
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
        <TouchableOpacity 
          style={[styles.statItem, activeTab === 'admins' && styles.activeStatItem]} 
          onPress={() => setActiveTab('admins')}
        >
          <Text style={[styles.statValue, activeTab === 'admins' && styles.activeStatValue]}>{admins.length}</Text>
          <Text style={[styles.statLabel, activeTab === 'admins' && styles.activeStatLabel]}>Active Admins</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity 
          style={[styles.statItem, activeTab === 'requests' && styles.activeStatItem]} 
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.statValue, activeTab === 'requests' && styles.activeStatValue, requests.length > 0 && activeTab !== 'requests' && { color: '#fbbf24' }]}>
            {requests.length}
          </Text>
          <Text style={[styles.statLabel, activeTab === 'requests' && styles.activeStatLabel, requests.length > 0 && activeTab !== 'requests' && { color: '#fbbf24' }]}>
            Pending Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin / Requests List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'admins' ? admins : requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {activeTab === 'admins' ? 'Registered Restaurants' : 'Pending Registration Requests'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>{activeTab === 'admins' ? '🏪' : '📥'}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'admins' ? 'No admins yet' : 'No requests yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'admins' 
                  ? 'Active restaurants will appear here.' 
                  : 'Pending restaurant registration requests will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {activeTab === 'admins' ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Card header for requests */}
                  <View style={styles.cardTop}>
                    <View style={[styles.cardIconWrap, { backgroundColor: '#fef3c7' }]}>
                      <Text style={styles.cardIcon}>🔑</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardRestaurant} numberOfLines={1}>{item.restaurantName}</Text>
                      <Text style={styles.cardAdmin} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={[styles.activeBadge, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.activeBadgeText, { color: '#d97706' }]}>Pending</Text>
                    </View>
                  </View>

                  {/* Card details */}
                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>✉️</Text>
                      <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📞</Text>
                      <Text style={styles.detailText} numberOfLines={1}>{item.phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📅</Text>
                      <Text style={styles.detailText}>
                        Requested {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleAction(item._id, 'reject')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleAction(item._id, 'approve')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.approveBtnText}>Approve & Create</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        />
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
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
    padding: 8,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeStatItem: {
    backgroundColor: '#4338ca',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#a5b4fc',
  },
  activeStatValue: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#818cf8',
    fontWeight: '600',
    marginTop: 2,
  },
  activeStatLabel: {
    color: '#c7d2fe',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(165,180,252,0.2)',
    marginHorizontal: 4,
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  rejectBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
