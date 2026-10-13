import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { LoginPromptModal } from '../../components/LoginPromptModal';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { CartItem } from '../../types';
import { OptimizedImage } from '../../components/OptimizedImage';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, deliveryCharge, totalAmount, refreshDeliverySettings } = useCart();
  const { authState } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    refreshDeliverySettings?.().catch(() => {});
  }, []);

  const handleCheckoutPress = () => {
    if (authState !== 'AUTHENTICATED') {
      setShowLoginModal(true);
    } else {
      navigation.navigate('Checkout');
    }
  };

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const unitPrice = item.product.discount_price ? Number(item.product.discount_price) : Number(item.product.price);
    const itemTotal = unitPrice * item.quantity;

    return (
      <View style={styles.cartCard}>
        <OptimizedImage
          source={{ uri: item.product.main_image }}
          style={styles.itemImage}
          aspectRatio={1}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromCart(item.product.id)}
              style={styles.deleteButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.accentRose} />
            </TouchableOpacity>
          </View>

          <Text style={styles.unitPrice}>{formatNPR(unitPrice)} each</Text>

          <View style={styles.itemFooter}>
            {/* Quantity Stepper */}
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                style={styles.stepBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={15} color="#ffffff" />
              </TouchableOpacity>

              <Text style={styles.stepQty}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                style={[
                  styles.stepBtn,
                  item.quantity >= item.product.stock_quantity && styles.stepBtnDisabled,
                ]}
                disabled={item.quantity >= item.product.stock_quantity}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={15}
                  color={item.quantity >= item.product.stock_quantity ? '#94a3b8' : '#ffffff'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.itemTotal}>{formatNPR(itemTotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Shopping Cart"
        showCart={false}
        rightAction={
          items.length > 0 ? (
            <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>
            Explore our supplements catalog and add proteins, creatine, or workout gear to your cart.
          </Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('ProductsTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopNowText}>Browse Supplements</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product.id.toString()}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Sticky Checkout Summary Footer */}
          <View style={styles.summaryFooter}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatNPR(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Delivery:</Text>
              <Text style={styles.summaryValue}>{formatNPR(deliveryCharge)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total (Cash Payment):</Text>
              <Text style={styles.totalValue}>{formatNPR(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckoutPress}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Guest Login Required Modal */}
      <LoginPromptModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Required"
        message="Please verify your phone number with a quick OTP to proceed with your order. Your cart items are safely preserved."
        returnToScreen="Checkout"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  clearBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: COLORS.accentRose,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 200,
    gap: SPACING.md,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 2,
  },
  unitPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 2,
    gap: 3,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  stepQty: {
    minWidth: 26,
    textAlign: 'center',
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  summaryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  checkoutButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
  },
  shopNowButton: {
    paddingHorizontal: SPACING.xl,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  shopNowText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
