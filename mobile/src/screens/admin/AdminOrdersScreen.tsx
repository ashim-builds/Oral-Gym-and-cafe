import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';

interface StatusOption {
  key: string;
  label: (order: any) => string;
  icon: (order: any) => any;
  color: string;
  description: (order: any) => string;
}

const ORDER_PROGRESS_STEPS: StatusOption[] = [
  {
    key: 'PENDING',
    label: () => 'Pending Approval',
    icon: () => 'hourglass-outline',
    color: COLORS.accentAmber,
    description: () => 'New order waiting for confirmation',
  },
  {
    key: 'CONFIRMED',
    label: () => 'Order Confirmed',
    icon: () => 'checkmark-outline',
    color: COLORS.accentCyan,
    description: () => 'Order verified and accepted',
  },
  {
    key: 'PROCESSING',
    label: () => 'Preparing Order',
    icon: () => 'cube-outline',
    color: '#9333ea',
    description: () => 'Packing supplements & preparing food',
  },
  {
    key: 'READY',
    label: (order) =>
      (order?.order_type || order?.delivery_type) === 'DELIVERY'
        ? 'Out for Delivery'
        : 'Ready for Store Pickup',
    icon: (order) =>
      (order?.order_type || order?.delivery_type) === 'DELIVERY'
        ? 'bicycle-outline'
        : 'storefront-outline',
    color: COLORS.info,
    description: (order) =>
      (order?.order_type || order?.delivery_type) === 'DELIVERY'
        ? 'Rider is on the way to customer'
        : 'Order packed & waiting at gym/cafe counter',
  },
  {
    key: 'COMPLETED',
    label: (order) =>
      (order?.order_type || order?.delivery_type) === 'DELIVERY'
        ? 'Delivered & Done'
        : 'Picked Up & Done',
    icon: () => 'checkmark-done-circle-outline',
    color: COLORS.accentEmerald,
    description: () => 'Customer received order and completed',
  },
  {
    key: 'CANCELLED',
    label: () => 'Cancel Order',
    icon: () => 'close-circle-outline',
    color: COLORS.accentRose,
    description: () => 'Order cancelled and stock restored',
  },
];

const STATUS_FILTER_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Preparing' },
  { key: 'READY', label: 'Ready / Out' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export const AdminOrdersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'ALL' ? { order_status: statusFilter, status: statusFilter } : undefined;
      const res = await mobileAdminService.getOrders(params);
      const list = Array.isArray(res) ? res : (res?.orders || []);
      setOrders(list);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Handle incoming orderId from push notification or dashboard
  useEffect(() => {
    const targetId = route.params?.orderId;
    if (targetId && orders.length > 0) {
      const found = orders.find((o) => o.id === Number(targetId));
      if (found) {
        setSelectedOrder(found);
      }
    }
  }, [route.params?.orderId, orders]);

  const openGoogleMapsDelivery = (order: any) => {
    if (!order) return;
    const address = order.delivery_address || '';
    const urlMatch = address.match(/https?:\/\/[^\s\]]+/);
    if (urlMatch) {
      Linking.openURL(urlMatch[0]).catch(() => {});
      return;
    }
    const cleanAddress = address.replace(/\[Map Pin:.*?\]/g, '').trim();
    const query = cleanAddress ? encodeURIComponent(cleanAddress) : 'Pokhara';
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`).catch(() => {});
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: number, orderStatus?: string, paymentStatus?: string) => {
    try {
      setUpdating(true);
      const updated = await mobileAdminService.updateOrderStatus(orderId, {
        order_status: orderStatus,
        payment_status: paymentStatus,
      });

      // Update in local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, ...updated }));
      }
      Alert.alert('Success', 'Order updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: COLORS.accentAmber };
      case 'CONFIRMED':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: COLORS.accentCyan };
      case 'PROCESSING':
        return { bg: 'rgba(147, 51, 234, 0.15)', text: '#9333ea' };
      case 'READY':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: COLORS.info };
      case 'COMPLETED':
      case 'DELIVERED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.accentEmerald };
      case 'CANCELLED':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: COLORS.accentRose };
      default:
        return { bg: COLORS.surfaceDark, text: COLORS.textSecondary };
    }
  };

  const getStatusLabel = (status: string, orderType?: string) => {
    const isDelivery = orderType === 'DELIVERY';
    switch (status) {
      case 'PENDING':
        return 'PENDING';
      case 'CONFIRMED':
        return 'CONFIRMED';
      case 'PROCESSING':
        return 'PREPARING';
      case 'READY':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return isDelivery ? 'OUT FOR DELIVERY' : 'READY FOR PICKUP';
      case 'COMPLETED':
      case 'DELIVERED':
        return isDelivery ? 'DELIVERED' : 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return (status || '').replace(/_/g, ' ');
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const sColor = getStatusColor(item.order_status);
    const isPaid = item.payment_status === 'PAID';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.customerName}>{item.customer?.name || item.delivery_name || 'Customer'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="call-outline" size={12} color={COLORS.primary} />
              <Text style={styles.customerPhone}>{item.customer?.phone || item.delivery_phone}</Text>
            </View>
          </View>

          <View style={styles.headerBadges}>
            <View style={[styles.statusBadge, { backgroundColor: sColor.bg }]}>
              <Text style={[styles.statusBadgeText, { color: sColor.text }]}>
                {getStatusLabel(item.order_status, item.order_type || item.delivery_type)}
              </Text>
            </View>
            <View
              style={[
                styles.payBadge,
                { backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' },
              ]}
            >
              <Text style={[styles.payBadgeText, { color: isPaid ? COLORS.accentEmerald : COLORS.accentRose }]}>
                {isPaid ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons
              name={(item.order_type || item.delivery_type) === 'DELIVERY' ? 'bicycle-outline' : 'storefront-outline'}
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {(item.order_type || item.delivery_type) === 'DELIVERY' ? 'Home Delivery' : 'Pickup at Store'} ({item.payment_method})
            </Text>
          </View>
          <Text style={styles.itemCountText}>
            {item.items?.length || 0} item{(item.items?.length || 0) > 1 ? 's' : ''}
          </Text>
        </View>

        {(item.order_type || item.delivery_type) === 'DELIVERY' && item.delivery_address && (
          <TouchableOpacity
            style={styles.cardMapsBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              openGoogleMapsDelivery(item);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={14} color="#ffffff" />
            <Text style={styles.cardMapsBtnText}>Open Google Maps</Text>
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={styles.totalPrice}>NPR {Number(item.total_amount).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Orders</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, statusFilter === tab.key && styles.filterTabActive]}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, statusFilter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}

      {/* Order Detail & Status Update Modal */}
      {selectedOrder && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.modalOrderNum}>{selectedOrder.order_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.order_status).bg }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedOrder.order_status).text }]}>
                        {getStatusLabel(selectedOrder.order_status, selectedOrder.order_type || selectedOrder.delivery_type)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalDate}>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Customer Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>CUSTOMER & DELIVERY</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Recipient:</Text>
                    <Text style={styles.detailVal}>{selectedOrder.customer_name || selectedOrder.delivery_name || selectedOrder.customer?.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailVal}>{selectedOrder.customer_phone || selectedOrder.delivery_phone || selectedOrder.customer?.phone_number || selectedOrder.customer?.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailVal}>
                      {(selectedOrder.order_type || selectedOrder.delivery_type) === 'DELIVERY' ? 'Home Delivery (COD)' : 'Branch Counter Pickup'}
                    </Text>
                  </View>
                  {(selectedOrder.order_type || selectedOrder.delivery_type) === 'DELIVERY' && selectedOrder.delivery_address && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Address:</Text>
                        <Text style={styles.detailVal}>{selectedOrder.delivery_address}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.modalMapsDeliveryBtn}
                        onPress={() => openGoogleMapsDelivery(selectedOrder)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="navigate" size={18} color="#ffffff" />
                        <Text style={styles.modalMapsDeliveryBtnText}>
                          Navigate with Google Maps (Driver Delivery)
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Items Ordered */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>ORDERED ITEMS</Text>
                  {selectedOrder.items?.map((item: any) => (
                    <View key={item.id} style={styles.orderItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderItemName}>{item.product?.name || item.product_name || `Item #${item.product_id}`}</Text>
                        <Text style={styles.orderItemSub}>
                          {item.quantity} x NPR {Number(item.unit_price || item.product_price).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.orderItemTotal}>
                        NPR {Number(item.total_price || item.subtotal || (item.unit_price || item.product_price) * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.itemSummaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryVal}>NPR {Number(selectedOrder.delivery_charge || selectedOrder.delivery_fee || 0).toLocaleString()}</Text>
                  </View>
                  <View style={[styles.itemSummaryRow, { borderTopWidth: 1, borderColor: COLORS.borderDark, paddingTop: SPACING.sm }]}>
                    <Text style={styles.summaryGrandLabel}>Grand Total (CASH)</Text>
                    <Text style={styles.summaryGrandVal}>NPR {Number(selectedOrder.total_amount).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Cash Payment Status Toggle */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>CASH PAYMENT STATUS</Text>
                  <View style={styles.payToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.payChoiceBtn,
                        (selectedOrder.payment_status === 'PENDING' || selectedOrder.payment_status === 'UNPAID') && styles.payChoiceUnpaidActive,
                      ]}
                      disabled={updating}
                      onPress={() => handleUpdateStatus(selectedOrder.id, undefined, 'PENDING')}
                    >
                      <Ionicons name="time-outline" size={16} color={COLORS.accentRose} />
                      <Text style={styles.payChoiceText}>UNPAID (Pending Cash)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.payChoiceBtn,
                        selectedOrder.payment_status === 'PAID' && styles.payChoicePaidActive,
                      ]}
                      disabled={updating}
                      onPress={() => handleUpdateStatus(selectedOrder.id, undefined, 'PAID')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.accentEmerald} />
                      <Text style={styles.payChoiceText}>PAID (Cash Collected)</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Order Status Stepper/Updater */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>UPDATE ORDER PROGRESS</Text>
                  <View style={styles.statusButtonsGrid}>
                    {ORDER_PROGRESS_STEPS.map((st) => {
                      const isCurrent = selectedOrder.order_status === st.key;
                      const label = st.label(selectedOrder);
                      const iconName = st.icon(selectedOrder);

                      return (
                        <TouchableOpacity
                          key={st.key}
                          style={[
                            styles.statusCardItem,
                            isCurrent && { borderColor: st.color, backgroundColor: `${st.color}15` },
                          ]}
                          disabled={updating}
                          onPress={() => handleUpdateStatus(selectedOrder.id, st.key)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.statusCardIcon, { backgroundColor: isCurrent ? st.color : '#e2e8f0' }]}>
                            <Ionicons name={iconName} size={18} color={isCurrent ? '#ffffff' : '#475569'} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={[styles.statusCardTitle, isCurrent && { color: st.color, fontWeight: '800' }]}>
                                {label}
                              </Text>
                              {isCurrent ? (
                                <View style={[styles.statusCurrentPill, { backgroundColor: st.color }]}>
                                  <Text style={styles.statusCurrentPillText}>CURRENT</Text>
                                </View>
                              ) : (
                                <Text style={styles.statusTapToSet}>Tap to set</Text>
                              )}
                            </View>
                            <Text style={styles.statusCardDesc}>{st.description(selectedOrder)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {updating && (
                  <View style={styles.updatingLoader}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.updatingText}>Saving order changes...</Text>
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    backgroundColor: COLORS.surfaceDark,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  filterContainer: {
    backgroundColor: COLORS.surfaceDark,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceDarker,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.backgroundDark,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  orderCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  payBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginVertical: SPACING.sm,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemCountText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surfaceDark,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  modalOrderNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalDate: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  modalScroll: {
    padding: SPACING.lg,
  },
  modalSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceDarker,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  orderItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderItemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  summaryVal: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  summaryGrandLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryGrandVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  payToggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  payChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.surfaceDark,
  },
  payChoiceUnpaidActive: {
    borderColor: COLORS.accentRose,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  payChoicePaidActive: {
    borderColor: COLORS.accentEmerald,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  payChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusButtonsGrid: {
    gap: SPACING.sm,
  },
  statusCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  statusCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusCardDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusCurrentPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusCurrentPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  statusTapToSet: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  updatingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  updatingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  cardMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: SPACING.md,
    marginTop: 6,
    gap: 6,
  },
  cardMapsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalMapsDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  modalMapsDeliveryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
