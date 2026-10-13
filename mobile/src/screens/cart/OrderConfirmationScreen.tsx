import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Order } from '../../types';

export const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const order: Order = route.params?.order;

  const formatNPR = (val?: number) => `NPR ${Number(val || 0).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Animation Circle */}
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-sharp" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for choosing Orla Gym & Cafe. We are preparing your order.
        </Text>


        {/* Order Details Card */}
        {order && (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Order Number</Text>
              <Text style={styles.orderNumber}>{order.order_number}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Fulfillment Method</Text>
              <Text style={styles.cardValue}>
                {order.order_type === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Payment Method</Text>
              <Text style={styles.cashHighlight}>
                {order.payment_method === 'CASH_ON_DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash on Pickup'}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Payment Status</Text>
              <Text style={styles.pendingBadge}>PENDING (Pay with Cash)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatNPR(order.total_amount)}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => {
              if (order?.id) {
                navigation.navigate('OrderDetail', { orderId: order.id });
              } else {
                navigation.navigate('OrdersTab');
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="receipt-outline" size={18} color={COLORS.white} />
            <Text style={styles.trackButtonText}>View Order Details & Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.homeButtonText}>Back to Shop</Text>
          </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.accentEmerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xxl,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  cashHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  pendingBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentAmber,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.sm,
  },
  buttonGroup: {
    width: '100%',
    gap: SPACING.md,
  },
  trackButton: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  homeButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
