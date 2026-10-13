import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';

export const AdminCustomersScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Customer Orders Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await mobileAdminService.getCustomers({ search: search || undefined });
      const list = Array.isArray(res) ? res : res?.customers || [];
      setCustomers(list);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleOpenCustomerDetail = async (cust: any) => {
    setSelectedCustomer(cust);
    setLoadingDetail(true);
    try {
      const data = await mobileAdminService.getCustomerById(cust.id);
      setCustomerDetail(data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteCustomer = async (cust: any) => {
    try {
      await mobileAdminService.deleteCustomer(cust.id);
      setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
      setSelectedCustomer(null);
      setCustomerDetail(null);
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
    }
  };


  const renderCustomerItem = ({ item }: { item: any }) => {
    const orderCount = item.total_orders ?? item._count?.orders ?? item.orders?.length ?? 0;
    const initial = (item.name || 'C').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => handleOpenCustomerDetail(item)}
        activeOpacity={0.75}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name || 'Registered Customer'}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.primary} />
            <Text style={styles.customerPhone}>{item.phone_number || item.phone || 'No phone'}</Text>
          </View>

          {item.email ? (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.customerEmail}>{item.email}</Text>
            </View>
          ) : null}

          {item.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.customerAddress} numberOfLines={1}>{item.address}</Text>
            </View>
          ) : null}

          <Text style={styles.joinedDate}>
            Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.orderCountBadge}>
          <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
          <Text style={styles.orderCountText}>{orderCount} {orderCount === 1 ? 'Order' : 'Orders'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Directory</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by phone, name, or address..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Customer Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Total Registered Customers: <Text style={styles.countHighlight}>{customers.length}</Text>
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={44} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Registered Customers Found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? `No customer matched "${search}"` : 'When customers register and place orders, they will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal visible={true} animationType="slide" transparent onRequestClose={() => setSelectedCustomer(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalCustomerName}>
                    {selectedCustomer.name || 'Registered Customer'}
                  </Text>
                  <Text style={styles.modalPhone}>
                    {selectedCustomer.phone_number || selectedCustomer.phone}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {loadingDetail ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 13 }}>
                    Fetching customer order history...
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Summary Card */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryCol}>
                      <Text style={styles.summaryVal}>
                        {customerDetail?.orders?.length || 0}
                      </Text>
                      <Text style={styles.summaryLbl}>TOTAL ORDERS</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryCol}>
                      <Text style={[styles.summaryVal, { color: COLORS.primary }]}>
                        NPR{' '}
                        {Number(
                          customerDetail?.orders?.reduce(
                            (acc: number, o: any) => acc + Number(o.total_amount || 0),
                            0
                          ) || 0
                        ).toLocaleString()}
                      </Text>
                      <Text style={styles.summaryLbl}>LIFETIME VALUE</Text>
                    </View>
                  </View>

                  {/* Customer Info Card */}
                  <View style={styles.profileBox}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    {customerDetail?.email ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} />
                        <Text style={styles.detailText}>{customerDetail.email}</Text>
                      </View>
                    ) : null}
                    {customerDetail?.address ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                        <Text style={styles.detailText}>{customerDetail.address}</Text>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        Member since {new Date(customerDetail?.created_at || selectedCustomer.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.orderHistoryTitle}>
                    Order History ({customerDetail?.orders?.length || 0})
                  </Text>
                  
                  {customerDetail?.orders && customerDetail.orders.length > 0 ? (
                    customerDetail.orders.map((ord: any) => (
                      <View key={ord.id} style={styles.orderRow}>
                        <View style={{ flex: 1, marginRight: SPACING.sm }}>
                          <Text style={styles.ordNum}>#{ord.order_number}</Text>
                          <Text style={styles.ordDate}>
                            {new Date(ord.created_at).toLocaleDateString()} • {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Text style={styles.ordType}>
                            {ord.order_type === 'DELIVERY' ? '🚚 Delivery' : '🏢 Store Pickup'} • <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{ord.order_status}</Text>
                          </Text>
                        </View>
                        <Text style={styles.ordPrice}>
                          NPR {Number(ord.total_amount).toLocaleString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noOrdersBox}>
                      <Ionicons name="bag-outline" size={32} color={COLORS.textMuted} />
                      <Text style={styles.noOrdersText}>No orders placed yet.</Text>
                    </View>
                  )}
                  {/* Delete Customer Button */}
                  <TouchableOpacity
                    style={styles.deleteCustomerBtn}
                    onPress={() => handleDeleteCustomer(selectedCustomer)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    <Text style={styles.deleteCustomerBtnText}>Delete Customer Account</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    height: 46,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  countBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  countHighlight: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: SPACING.xs,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  customerPhone: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  customerEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  customerAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  joinedDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  orderCountBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  orderCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  modalCustomerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalPhone: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  summaryLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 4,
  },
  profileBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  orderHistoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  ordNum: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ordDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ordType: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ordPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  noOrdersBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: 6,
  },
  noOrdersText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  deleteCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    marginTop: SPACING.xl,
    gap: 6,
  },
  deleteCustomerBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});

