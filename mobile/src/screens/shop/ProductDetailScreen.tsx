import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import { Header } from "../../components/Header";
import { useCart } from "../../context/CartContext";
import shopService from "../../services/shop.service";
import { Product } from "../../types";
import { OptimizedImage } from "../../components/OptimizedImage";

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId } = route.params || {};

  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (productId) {
      shopService
        .getProductById(productId)
        .then(setProduct)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack title="Product Details" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack title="Product Not Found" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Product could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isDiscounted =
    !!product.discount_price && product.discount_price < product.price;
  const displayPrice = product.discount_price || product.price;

  const handleIncrease = () => {
    if (quantity < product.stock_quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title={product.category?.name || "Supplement Details"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageBox}>
          <OptimizedImage
            source={{ uri: product.main_image }}
            style={styles.productImage}
            imageStyle={styles.imageInner}
            resizeMode="contain"
          />

          {product.is_featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="flash" size={12} color={COLORS.white} />
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoCard}>
          {product.category?.name ? (
            <Text style={styles.categoryName}>{product.category.name}</Text>
          ) : null}
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Pricing & Stock Status */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatNPR(displayPrice)}</Text>
              {isDiscounted && (
                <View style={styles.oldPriceRow}>
                  <Text style={styles.oldPrice}>
                    {formatNPR(product.price)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      SAVE {formatNPR(product.price - displayPrice)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.stockBadgeContainer}>
              {isOutOfStock ? (
                <View style={styles.stockOutOfStock}>
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={COLORS.accentRose}
                  />
                  <Text style={styles.stockOutOfStockText}>Out of Stock</Text>
                </View>
              ) : (
                <View style={styles.stockInStock}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={COLORS.accentEmerald}
                  />
                  <Text style={styles.stockInStockText}>
                    {product.stock_quantity} Units Available
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Select Quantity:</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    quantity <= 1 && styles.stepperButtonDisabled,
                  ]}
                  onPress={handleDecrease}
                  disabled={quantity <= 1}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={quantity <= 1 ? "#94a3b8" : "#ffffff"}
                  />
                </TouchableOpacity>

                <Text style={styles.stepperValue}>{quantity}</Text>

                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    quantity >= product.stock_quantity &&
                      styles.stepperButtonDisabled,
                  ]}
                  onPress={handleIncrease}
                  disabled={quantity >= product.stock_quantity}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      quantity >= product.stock_quantity
                        ? "#94a3b8"
                        : "#ffffff"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descHeading}>
              Product Description & Formula
            </Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* Authenticity Guarantee Card */}
          <View style={styles.authenticityCard}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={COLORS.accentEmerald}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.authTitle}>100% Genuine Guaranteed</Text>
              <Text style={styles.authSub}>
                Directly imported sports nutrition. Verified batch authenticity.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalSubhead}>Subtotal:</Text>
          <Text style={styles.totalPrice}>
            {formatNPR(displayPrice * quantity)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isOutOfStock
              ? styles.actionButtonDisabled
              : styles.actionButtonActive,
          ]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.85}
        >
          <Ionicons
            name={
              addedAnimation
                ? "checkmark-circle"
                : isOutOfStock
                  ? "ban"
                  : "cart"
            }
            size={18}
            color={COLORS.white}
          />
          <Text style={styles.actionButtonText}>
            {isOutOfStock
              ? "Out of Stock"
              : addedAnimation
                ? "Added to Cart!"
                : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: COLORS.accentRose,
    fontSize: 14,
    fontWeight: "700",
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 380,
    backgroundColor: "#ffffff",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
  },
  productImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },
  imageInner: {
    width: "100%",
    height: "100%",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
  },
  featuredText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 13, 20, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: COLORS.accentRose,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.accentRose,
    borderRadius: BORDER_RADIUS.md,
  },
  infoCard: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginTop: 4,
    lineHeight: 26,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  price: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
  },
  oldPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  oldPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentEmerald,
  },
  stockBadgeContainer: {},
  stockInStock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  stockInStockText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentEmerald,
  },
  stockOutOfStock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  stockOutOfStockText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentRose,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000000",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    padding: 3,
    gap: 4,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  stepperValue: {
    minWidth: 38,
    textAlign: "center",
    color: "#000000",
    fontSize: 16,
    fontWeight: "900",
  },
  descSection: {
    paddingVertical: SPACING.lg,
  },
  descHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  authenticityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  authTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  authSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalSubhead: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  actionButton: {
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
