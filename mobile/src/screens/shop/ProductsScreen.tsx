import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { ProductCard } from '../../components/ProductCard';
import shopService from '../../services/shop.service';
import { Product, Category } from '../../types';

export const ProductsScreen: React.FC = () => {
  const route = useRoute<any>();
  const initialCategoryId = route.params?.categoryId;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    shopService
      .getCategoriesWithSwr((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const loadProducts = async () => {
    try {
      const res = await shopService.getProductsWithSwr(
        {
          category_id: selectedCategory,
          search: search || undefined,
          in_stock_only: inStockOnly || undefined,
        },
        (data, isFromCache) => {
          setProducts(data);
          if (isFromCache) {
            setLoading(false);
          }
        }
      );
      setProducts(res);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, inStockOnly]);

  const handleSearchSubmit = () => {
    loadProducts();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Supplement Catalog" showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search protein, creatine, pre-workout..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); loadProducts(); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills Filter */}
      {/* Category Pills Bar (only if categories exist) */}
      {categories.length > 0 && (
        <View style={styles.categoriesFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
            <TouchableOpacity
              style={[styles.pill, selectedCategory === undefined && styles.pillActive]}
              onPress={() => setSelectedCategory(undefined)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, selectedCategory === undefined && styles.pillTextActive]}>
                All Supplements
              </Text>
            </TouchableOpacity>

            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.pill, selectedCategory === c.id && styles.pillActive]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, selectedCategory === c.id && styles.pillTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* In Stock Toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.resultsCount}>{products.length} Products Found</Text>
        <TouchableOpacity
          style={[styles.stockFilterPill, inStockOnly && styles.stockFilterPillActive]}
          onPress={() => setInStockOnly(!inStockOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={inStockOnly ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={inStockOnly ? COLORS.white : COLORS.textMuted}
          />
          <Text style={[styles.stockFilterText, inStockOnly && styles.stockFilterTextActive]}>
            In Stock Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading supplements...</Text>
        </View>
      ) : (
        <FlatList
          key="grid-3-products"
          data={products}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard product={item} grid3 />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="nutrition-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Supplements Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search keywords or category filters.</Text>
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
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoriesFilterContainer: {
    paddingVertical: SPACING.xs,
  },
  categoryPills: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  resultsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  stockFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stockFilterPillActive: {
    backgroundColor: COLORS.accentEmerald,
    borderColor: COLORS.accentEmerald,
  },
  stockFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stockFilterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
    justifyContent: 'flex-start',
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
});
