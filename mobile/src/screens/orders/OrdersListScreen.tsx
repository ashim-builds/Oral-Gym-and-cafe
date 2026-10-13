import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import mobileOrderService from '../../services/order.service';
import { Order } from '../../types';

export const OrdersListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { authState } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (authState !== 'AUTHENTICATED') {
      setLoading(false);
      return;
    }
    try {
      const res = await mobileOrderService.getMyOrders();
      setOrders(res);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused, authState]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return COLORS.accentAmber;
      case 'CONFIRMED':
        return COLORS.info;
      case 'PROCESSING':
        return COLORS.primary;
      case 'READY':
        return COLORS.accentCyan;
      case 'COMPLETED':
        return COLORS.accentEmerald;
      case 'CANCELLED':
        return COLORS.accentRose;
      default:
        return COLORS.textSecondary;
    }
  };

  const activeOrders = orders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY'].includes(o.order_status)
  );
  const historyOrders = orders.filter((o) =>
    ['COMPLETED', 'CANCELLED'].includes(o.order_status)
  );
  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : historyOrders;

  // Guest view
  if (authState !== 'AUTHENTICATED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="My Orders" showBack={false} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="receipt-outline" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.guestTitle}>Sign In to View Orders</Text>
          <Text style={styles.guestSub}>
            Please verify your mobile number to view active order progress, past receipts, and fast re-ordering.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'PhoneInput', params: { returnToScreen: 'Orders' } })}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
            <Text style={styles.loginBtnText}>Login / Register with Phone</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.order_status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.order_status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderBody}>
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {item.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(' • ')}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.badgeRow}>
              <View style={styles.methodTag}>
                <Ionicons
                  name={item.order_type === 'DELIVERY' ? 'bicycle-outline' : 'storefront-outline'}
                  size={12}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.methodTagText}>
                  {item.order_type === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                </Text>
              </View>

              <View style={styles.paymentTag}>
                <Ionicons name="cash-outline" size={12} color={COLORS.accentEmerald} />
                <Text style={styles.paymentTagText}>
                  {item.payment_status === 'PAID' ? 'Cash Paid' : 'Cash on Delivery'}
                </Text>
              </View>
            </View>

            <Text style={styles.totalPrice}>{formatNPR(item.total_amount)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Orders" showBack={true} />

      {/* Segmented Tabs: Active Orders vs Order History */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ACTIVE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ACTIVE')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="time-outline"
              size={15}
              color={activeTab === 'ACTIVE' ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
              Active Orders ({activeOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('HISTORY')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={15}
              color={activeTab === 'HISTORY' ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
              Order History ({historyOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching orders...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'ACTIVE' ? 'cube-outline' : 'file-tray-outline'}
                size={48}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'ACTIVE' ? 'No Active Orders' : 'No Order History Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'ACTIVE'
                  ? 'You have no orders currently in progress. Add supplements to your cart and place an order!'
                  : 'Completed and past orders will appear here for easy reference and re-ordering.'}
              </Text>
              {activeTab === 'ACTIVE' && (
                <TouchableOpacity
                  style={styles.browseShopBtn}
                  onPress={() => navigation.navigate('ProductsTab')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="barbell-outline" size={16} color={COLORS.white} />
                  <Text style={styles.browseShopBtnText}>Browse Supplements</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Segmented Tabs
  tabsWrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  listContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumber: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.sm,
  },
  orderBody: {},
  itemsSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  methodTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  paymentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  paymentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentEmerald,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guestSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  loginBtn: {
    height: 48,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  browseShopBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.primary,
  },
  browseShopBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
