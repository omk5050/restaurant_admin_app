import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, StatusBar, Platform, Modal, ScrollView
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/utils/api';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '@/components/ui/CustomAlert';
import * as Print from 'expo-print';

export default function SuperAdminDashboard() {
  const { role, signOut } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'admins' | 'requests'>('admins');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

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
        setSelectedRequest(null); // Close the inspector modal
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

  const handlePrint = async (request: any) => {
    if (!request) return;
    const formattedDate = new Date(request.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = new Date(request.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Access Request Details</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 30px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .header {
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .logo {
              font-size: 20px;
              font-weight: 800;
              color: #6366f1;
              letter-spacing: -0.5px;
            }
            .title {
              font-size: 24px;
              font-weight: 900;
              color: #0f172a;
              margin-top: 8px;
              margin-bottom: 0;
            }
            .badge {
              display: inline-block;
              background-color: #fef3c7;
              color: #d97706;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              margin-top: 8px;
            }
            .grid {
              display: grid;
              grid-template-columns: 150px 1fr;
              gap: 16px 8px;
              margin-bottom: 30px;
            }
            .label {
              font-size: 13px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .value {
              font-size: 15px;
              font-weight: 500;
              color: #0f172a;
            }
            .footer {
              border-top: 1px solid #f1f5f9;
              padding-top: 16px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">RESTAURANT HUB</div>
              <h1 class="title">Registration Access Request</h1>
              <div class="badge">PENDING APPROVAL</div>
            </div>
            
            <div class="grid">
              <div class="label">Restaurant:</div>
              <div class="value">${request.restaurantName}</div>
              
              <div class="label">Admin Name:</div>
              <div class="value">${request.name}</div>
              
              <div class="label">Email:</div>
              <div class="value">${request.email}</div>
              
              <div class="label">Phone:</div>
              <div class="value">${request.phone}</div>
              
              <div class="label">Request Date:</div>
              <div class="value">${formattedDate}</div>
              
              <div class="label">Request Time:</div>
              <div class="value">${formattedTime}</div>
            </div>
            
            <div class="footer">
              Generated automatically by Restaurant Hub Admin Panel. Confidential document.
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (e) {
      console.error('Failed to print request details:', e);
      triggerAlert('Print Failed', 'An error occurred while launching print system.', 'error');
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
                <TouchableOpacity
                  onPress={() => setSelectedRequest(item)}
                  activeOpacity={0.85}
                >
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
                      <Text style={styles.detailIcon}>📅</Text>
                      <Text style={styles.detailText}>
                        Requested {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inspectCardBtn}>
                    <Text style={styles.inspectCardBtnText}>Inspect Details & Decide  →</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Inspect Request Modal */}
      {selectedRequest && (
        <Modal
          visible={!!selectedRequest}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRequest(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeaderLabel}>PENDING REGISTRATION</Text>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    {selectedRequest.restaurantName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIcon}
                  onPress={() => setSelectedRequest(null)}
                >
                  <Text style={styles.modalCloseIconText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable details wrapper for diverse aspect ratios */}
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.inspectSection}>
                  <View style={styles.inspectRow}>
                    <Text style={styles.inspectLabel}>Admin Name</Text>
                    <Text style={styles.inspectValue}>{selectedRequest.name}</Text>
                  </View>

                  <View style={styles.inspectRow}>
                    <Text style={styles.inspectLabel}>Email Address</Text>
                    <Text style={styles.inspectValue}>{selectedRequest.email}</Text>
                  </View>

                  <View style={styles.inspectRow}>
                    <Text style={styles.inspectLabel}>Phone Number</Text>
                    <Text style={styles.inspectValue}>{selectedRequest.phone}</Text>
                  </View>

                  <View style={styles.inspectRow}>
                    <Text style={styles.inspectLabel}>Date Requested</Text>
                    <Text style={styles.inspectValue}>
                      {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.inspectRow}>
                    <Text style={styles.inspectLabel}>Time Requested</Text>
                    <Text style={styles.inspectValue}>
                      {new Date(selectedRequest.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action buttons footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalPrintBtn]}
                  onPress={() => handlePrint(selectedRequest)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalPrintBtnText}>🖨️ Print Request</Text>
                </TouchableOpacity>

                <View style={styles.modalDecideRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalRejectBtn]}
                    onPress={() => handleAction(selectedRequest._id, 'reject')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalRejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalApproveBtn]}
                    onPress={() => handleAction(selectedRequest._id, 'approve')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalApproveBtnText}>Approve & Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
  inspectCardBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inspectCardBtnText: {
    color: '#6366f1',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Elegant semi-transparent dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
      }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1.5,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
    maxWidth: 360,
  },
  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIconText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 22,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalScrollContent: {
    paddingVertical: 4,
  },
  inspectSection: {
    gap: 14,
  },
  inspectRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 10,
  },
  inspectLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inspectValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 4,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    marginTop: 16,
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalPrintBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalPrintBtnText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 14,
  },
  modalDecideRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRejectBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  modalRejectBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },
  modalApproveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
  },
  modalApproveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
