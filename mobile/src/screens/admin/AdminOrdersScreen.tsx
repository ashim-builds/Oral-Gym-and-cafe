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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';

const ORDER_STATUS_FLOW = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

export const AdminOrdersScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
      const res = await mobileAdminService.getOrders(params);
      setOrders(res.orders || []);
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
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: COLORS.info };
      case 'DELIVERED':
      case 'COMPLETED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.accentEmerald };
      case 'CANCELLED':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: COLORS.accentRose };
      default:
        return { bg: COLORS.surfaceDark, text: COLORS.textSecondary };
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
              <Text style={[styles.statusBadgeText, { color: sColor.text }]}>{item.order_status}</Text>
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
              name={item.delivery_type === 'DELIVERY' ? 'bicycle-outline' : 'storefront-outline'}
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {item.delivery_type === 'DELIVERY' ? 'Home Delivery' : 'Pickup at Store'} ({item.payment_method})
            </Text>
          </View>
          <Text style={styles.itemCountText}>
            {item.items?.length || 0} item{(item.items?.length || 0) > 1 ? 's' : ''}
          </Text>
        </View>

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
          {['ALL', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterTab, statusFilter === st && styles.filterTabActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterTabText, statusFilter === st && styles.filterTabTextActive]}>
                {st.replace(/_/g, ' ')}
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
                  <Text style={styles.modalOrderNum}>{selectedOrder.order_number}</Text>
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
                    <Text style={styles.detailVal}>{selectedOrder.delivery_name || selectedOrder.customer?.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailVal}>{selectedOrder.delivery_phone || selectedOrder.customer?.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailVal}>
                      {selectedOrder.delivery_type === 'DELIVERY' ? 'Home Delivery (COD)' : 'Branch Counter Pickup'}
                    </Text>
                  </View>
                  {selectedOrder.delivery_type === 'DELIVERY' && selectedOrder.delivery_address && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Address:</Text>
                      <Text style={styles.detailVal}>{selectedOrder.delivery_address}</Text>
                    </View>
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
                          {item.quantity} x NPR {Number(item.unit_price).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={styles.orderItemTotal}>
                        NPR {Number(item.total_price || item.unit_price * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.itemSummaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryVal}>NPR {Number(selectedOrder.delivery_fee || 0).toLocaleString()}</Text>
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
                        selectedOrder.payment_status === 'UNPAID' && styles.payChoiceUnpaidActive,
                      ]}
                      disabled={updating}
                      onPress={() => handleUpdateStatus(selectedOrder.id, undefined, 'UNPAID')}
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
                    {ORDER_STATUS_FLOW.map((st) => {
                      const isCurrent = selectedOrder.order_status === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[styles.statusOptionBtn, isCurrent && styles.statusOptionBtnActive]}
                          disabled={updating || isCurrent}
                          onPress={() => handleUpdateStatus(selectedOrder.id, st)}
                        >
                          <Text style={[styles.statusOptionText, isCurrent && styles.statusOptionTextActive]}>
                            {st.replace(/_/g, ' ')}
                          </Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  statusOptionBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  statusOptionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusOptionTextActive: {
    color: COLORS.backgroundDark,
    fontWeight: '800',
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
});
