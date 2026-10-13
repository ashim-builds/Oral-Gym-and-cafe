import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { OptimizedImage } from './OptimizedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID3_GAP = 8;
const GRID3_PADDING = SPACING.md * 2;
const GRID3_CARD_WIDTH = Math.floor((SCREEN_WIDTH - GRID3_PADDING - GRID3_GAP * 2) / 3);

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
  grid3?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  horizontal = false,
  grid3 = false,
}) => {
  const navigation = useNavigation<any>();
  const { addToCart } = useCart();

  const isOutOfStock = product.stock_quantity <= 0;
  const isDiscounted = !!product.discount_price && product.discount_price < product.price;
  const displayPrice = product.discount_price || product.price;

  const handlePress = () => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;

  if (grid3) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.grid3Card}
      >
        {/* Product Image Box */}
        <View style={styles.grid3ImageContainer}>
          <OptimizedImage
            source={{ uri: product.main_image }}
            style={styles.grid3Image}
            aspectRatio={1}
            resizeMode="cover"
          />

          {/* Featured Tag */}
          {product.is_featured && (
            <View style={styles.grid3Badge}>
              <Ionicons name="flame" size={9} color={COLORS.white} />
              <Text style={styles.grid3BadgeText}>HOT</Text>
            </View>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <View style={styles.grid3OutOfStockOverlay}>
              <Text style={styles.grid3OutOfStockText}>SOLD OUT</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.grid3Content}>
          {product.category?.name && (
            <Text style={styles.grid3Category} numberOfLines={1}>
              {product.category.name}
            </Text>
          )}

          <Text style={styles.grid3Title} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Price & Quick Add */}
          <View style={styles.grid3Footer}>
            <View style={styles.grid3PriceCol}>
              <Text style={styles.grid3Price}>{formatNPR(displayPrice)}</Text>
              {isDiscounted && (
                <Text style={styles.grid3OldPrice}>{formatNPR(product.price)}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={isOutOfStock}
              style={[
                styles.grid3AddBtn,
                isOutOfStock ? styles.grid3AddBtnDisabled : styles.grid3AddBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isOutOfStock ? 'ban-outline' : 'add'}
                size={14}
                color={isOutOfStock ? COLORS.textMuted : COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.card, horizontal && styles.horizontalCard]}
    >
      {/* Product Image Box */}
      <View style={[styles.imageContainer, horizontal && styles.horizontalImage]}>
        <OptimizedImage
          source={{ uri: product.main_image }}
          style={styles.image}
          aspectRatio={horizontal ? 4 / 3 : 1}
          resizeMode="cover"
        />

        {/* Featured Tag */}
        {product.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="flame" size={10} color={COLORS.white} />
            <Text style={styles.featuredText}>HOT</Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {product.category?.name && (
          <Text style={styles.categoryName} numberOfLines={1}>
            {product.category.name}
          </Text>
        )}

        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{formatNPR(displayPrice)}</Text>
            {isDiscounted && (
              <Text style={styles.oldPrice}>{formatNPR(product.price)}</Text>
            )}
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            style={[
              styles.addButton,
              isOutOfStock ? styles.addButtonDisabled : styles.addButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isOutOfStock ? 'ban-outline' : 'add'}
              size={18}
              color={isOutOfStock ? COLORS.textMuted : COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 3-Column Grid Card Styles
  grid3Card: {
    width: GRID3_CARD_WIDTH,
    maxWidth: GRID3_CARD_WIDTH,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  grid3ImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#161922',
    position: 'relative',
    overflow: 'hidden',
  },
  grid3Image: {
    width: '100%',
    height: '100%',
  },
  grid3Badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  grid3BadgeText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  grid3OutOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid3OutOfStockText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    backgroundColor: COLORS.accentRose,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  grid3Content: {
    padding: 6,
    justifyContent: 'space-between',
    flex: 1,
  },
  grid3Category: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  grid3Title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 14,
    height: 28,
  },
  grid3Footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 2,
  },
  grid3PriceCol: {
    flex: 1,
  },
  grid3Price: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  grid3OldPrice: {
    fontSize: 8,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  grid3AddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid3AddBtnActive: {
    backgroundColor: COLORS.primary,
  },
  grid3AddBtnDisabled: {
    backgroundColor: COLORS.surfaceBorder,
  },

  // Standard & Horizontal Card Styles
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  horizontalCard: {
    width: 175,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.backgroundDark,
    position: 'relative',
  },
  horizontalImage: {
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  featuredText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.accentRose,
    borderRadius: BORDER_RADIUS.sm,
  },
  content: {
    padding: SPACING.md,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  oldPrice: {
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.surfaceBorder,
  },
});
