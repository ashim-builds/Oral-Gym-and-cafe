import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import mobileOrderService from '../../services/order.service';
import { Order, OrderStatus } from '../../types';

const STATUS_STEPS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'COMPLETED',
];

export const OrderDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      mobileOrderService
        .getOrderById(orderId)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack title="Order Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack title="Order Details" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;
  const currentStepIndex = STATUS_STEPS.indexOf(order.order_status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title={`Order ${order.order_number}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Status Stepper */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Live Order Status</Text>
            <Text style={styles.currentStatusBadge}>{order.order_status}</Text>
          </View>

          {order.order_status === 'CANCELLED' ? (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={20} color={COLORS.accentRose} />
              <Text style={styles.cancelledText}>This order has been cancelled.</Text>
            </View>
          ) : (
            <View style={styles.stepperWrapper}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <View key={step} style={styles.stepItem}>
                    <View style={styles.stepIndicatorRow}>
                      <View
                        style={[
                          styles.stepDot,
                          isPassed && styles.stepDotPassed,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      >
                        {isPassed && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
                      </View>
                      {idx < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            currentStepIndex > idx && styles.stepLinePassed,
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isPassed && styles.stepLabelPassed,
                        isCurrent && styles.stepLabelCurrent,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Fulfillment & Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order & Payment Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Number:</Text>
            <Text style={styles.infoValueMono}>{order.order_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fulfillment Method:</Text>
            <Text style={styles.infoValue}>
              {order.order_type === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.cashHighlight}>
              {order.payment_method === 'CASH_ON_DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash on Pickup'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cash Payment Status:</Text>
            <Text
              style={[
                styles.paymentStatusValue,
                { color: order.payment_status === 'PAID' ? COLORS.accentEmerald : COLORS.accentAmber },
              ]}
            >
              {order.payment_status === 'PAID' ? 'PAID (Cash Received)' : 'PENDING (Pay with Cash)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(order.created_at).toLocaleString()}
            </Text>
          </View>

          {order.order_type === 'DELIVERY' && order.delivery_address && (
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.infoLabel}>Delivery Address:</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                {order.delivery_address}
              </Text>
            </View>
          )}

          {order.branch && (
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <Text style={styles.infoLabel}>Ordering Branch:</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                {order.branch.name}
              </Text>
            </View>
          )}
        </View>

        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items in Order ({order.items?.length || 0})</Text>

          <View style={styles.itemsList}>
            {order.items?.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemMeta}>
                    {formatNPR(item.product_price)} × {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatNPR(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Calculation Summary */}
          <View style={styles.divider} />
          <View style={styles.summaryBreakdown}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryVal}>{formatNPR(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge:</Text>
              <Text style={styles.summaryVal}>{formatNPR(order.delivery_charge)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable (Cash):</Text>
              <Text style={styles.totalVal}>{formatNPR(order.total_amount)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.accentRose,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentStatusBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: BORDER_RADIUS.md,
  },
  cancelledText: {
    color: COLORS.accentRose,
    fontSize: 13,
    fontWeight: '800',
  },
  stepperWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotPassed: {
    backgroundColor: COLORS.accentEmerald,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: COLORS.surfaceBorder,
    zIndex: 1,
  },
  stepLinePassed: {
    backgroundColor: COLORS.accentEmerald,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: COLORS.textSecondary,
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  infoValueMono: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  cashHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  paymentStatusValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  itemsList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.md,
  },
  summaryBreakdown: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.xs,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
