import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import mobileOrderService from '../../services/order.service';
import shopService from '../../services/shop.service';
import { Branch, OrderType, PaymentMethod } from '../../types';

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { items, clearCart } = useCart();
  const { customer } = useAuth();

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone_number || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [notes, setNotes] = useState('');
  const [orderingBranch, setOrderingBranch] = useState<Branch | null>(null);

  const [preview, setPreview] = useState<{
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    can_place_order: boolean;
    stock_errors: string[];
  } | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // Fetch active ordering branch
  useEffect(() => {
    shopService
      .getOrderingBranch()
      .then(setOrderingBranch)
      .catch(console.error);
  }, []);

  // Recalculate price & stock preview from backend
  const loadCheckoutPreview = async () => {
    if (items.length === 0) return;
    try {
      setLoadingPreview(true);
      setError('');
      const data = await mobileOrderService.previewCheckout(
        items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        orderType
      );
      setPreview(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to calculate checkout total');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadCheckoutPreview();
  }, [orderType, items]);

  const handlePlaceOrder = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }

    if (orderType === 'DELIVERY' && (!address.trim() || address.trim().length < 3)) {
      setError('Please provide a valid delivery address');
      return;
    }

    if (preview?.stock_errors && preview.stock_errors.length > 0) {
      setError(preview.stock_errors[0]);
      return;
    }

    setPlacingOrder(true);
    try {
      const payment_method: PaymentMethod =
        orderType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH_ON_PICKUP';

      const order = await mobileOrderService.placeOrder({
        order_type: orderType,
        payment_method,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        delivery_address: orderType === 'DELIVERY' ? address.trim() : undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
      });

      // Clear Cart on successful order
      clearCart();

      // Navigate to confirmation
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Main' },
          { name: 'OrderConfirmation', params: { order } },
        ],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatNPR = (val?: number) => `NPR ${Number(val || 0).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Order Checkout" showCart={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.accentRose} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        {/* 1. Select Order Type */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Fulfillment Option</Text>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.typeTab, orderType === 'DELIVERY' && styles.typeTabActive]}
              onPress={() => setOrderType('DELIVERY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color={orderType === 'DELIVERY' ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.typeTabText, orderType === 'DELIVERY' && styles.typeTabTextActive]}>
                Home Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, orderType === 'PICKUP' && styles.typeTabActive]}
              onPress={() => setOrderType('PICKUP')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={orderType === 'PICKUP' ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.typeTabText, orderType === 'PICKUP' && styles.typeTabTextActive]}>
                Store Pickup
              </Text>
            </TouchableOpacity>
          </View>

          {orderType === 'PICKUP' && orderingBranch && (
            <View style={styles.pickupBranchNotice}>
              <Ionicons name="location" size={16} color={COLORS.accentEmerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickupBranchTitle}>Pickup Center: {orderingBranch.name}</Text>
                <Text style={styles.pickupBranchAddress}>{orderingBranch.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 2. Customer & Delivery Address */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {orderType === 'DELIVERY' ? '2. Delivery & Contact Details' : '2. Contact Information'}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Recipient Full Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Suman Thapa"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Phone Number *</Text>
            <View style={[styles.inputContainer, styles.disabledContainer]}>
              <Ionicons name="call-outline" size={18} color={COLORS.accentEmerald} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={phone}
                editable={false}
              />
            </View>
          </View>

          {orderType === 'DELIVERY' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Delivery Address *</Text>
              <View style={[styles.inputContainer, { height: 70 }]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.primary}
                  style={[styles.inputIcon, { marginTop: 4 }]}
                />
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Street, area, building name, landmark"
                  placeholderTextColor={COLORS.textMuted}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Order Notes (Optional)</Text>
            <View style={[styles.inputContainer, { height: 60 }]}>
              <Ionicons
                name="clipboard-outline"
                size={18}
                color={COLORS.textMuted}
                style={[styles.inputIcon, { marginTop: 4 }]}
              />
              <TextInput
                style={[styles.textInput, { height: 50, textAlignVertical: 'top' }]}
                placeholder="Special delivery instructions or shake flavor..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>
        </View>

        {/* 3. Payment Method (Cash ONLY) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Payment Method</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.cashIconBadge}>
              <Ionicons name="cash" size={24} color={COLORS.accentEmerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentMethodTitle}>
                {orderType === 'DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash on Pickup'}
              </Text>
              <Text style={styles.paymentMethodSub}>
                Pay with cash directly when your order is delivered or picked up at the branch counter.
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.accentEmerald} />
          </View>
        </View>

        {/* 4. Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Order Items ({items.length})</Text>
          <View style={styles.itemsSummaryList}>
            {items.map((it) => {
              const itemPrice = it.product.discount_price || it.product.price;
              return (
                <View key={it.product.id} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {it.quantity}x {it.product.name}
                  </Text>
                  <Text style={styles.summaryItemPrice}>{formatNPR(itemPrice * it.quantity)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.divider} />

          {loadingPreview ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.totalsContainer}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal:</Text>
                <Text style={styles.calcVal}>{formatNPR(preview?.subtotal)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Delivery Fee:</Text>
                <Text style={styles.calcVal}>{formatNPR(preview?.delivery_charge)}</Text>
              </View>
              <View style={[styles.calcRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Amount (Cash):</Text>
                <Text style={styles.grandTotalVal}>{formatNPR(preview?.total_amount)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Place Order Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarTotalLabel}>Total Payable (Cash):</Text>
          <Text style={styles.bottomBarTotalValue}>{formatNPR(preview?.total_amount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.85}
        >
          {placingOrder ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.placeOrderBtnText}>Place Order (Cash)</Text>
              <Ionicons name="checkmark-done" size={18} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 140,
    gap: SPACING.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentRose,
  },
  errorText: {
    color: COLORS.accentRose,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeTab: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeTabTextActive: {
    color: COLORS.white,
  },
  pickupBranchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: SPACING.md,
  },
  pickupBranchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  pickupBranchAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
  },
  disabledContainer: {
    backgroundColor: COLORS.surfaceBorder,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.accentEmerald,
  },
  cashIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  paymentMethodSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  itemsSummaryList: {
    gap: SPACING.xs,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.md,
  },
  totalsContainer: {
    gap: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.xs,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  bottomBarTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  placeOrderBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.primary,
  },
  placeOrderBtnDisabled: {
    opacity: 0.6,
  },
  placeOrderBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
