import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { ProductCard } from '../../components/ProductCard';
import shopService from '../../services/shop.service';
import { Product, Category } from '../../types';

const POPULAR_SEARCHES = ['Whey Protein', 'Creatine', 'Pre-Workout', 'Mass Gainer', 'BCAA', 'Cafe Drink'];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialQuery = route.params?.query || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Load categories for quick filter
    shopService.getCategoriesWithSwr((cats) => setCategories(cats || [])).catch(() => {});
    
    if (initialQuery) {
      performSearch(initialQuery, null);
    }
  }, []);

  const performSearch = async (searchTerm: string, catId: number | null) => {
    if (!searchTerm.trim() && !catId) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setHasSearched(true);
    try {
      const data = await shopService.getProductsWithSwr(
        {
          search: searchTerm.trim() || undefined,
          category_id: catId || undefined,
        },
        (res, isFromCache) => {
          setResults(res || []);
          if (isFromCache) {
            setLoading(false);
          }
        }
      );
      setResults(data || []);
    } catch (err) {
      console.warn('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      performSearch(text, selectedCategory);
    }, 350);
  };

  const handleSelectCategory = (catId: number | null) => {
    const nextCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(nextCat);
    performSearch(query, nextCat);
  };

  const handlePopularPress = (term: string) => {
    setQuery(term);
    Keyboard.dismiss();
    performSearch(term, selectedCategory);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Top Search Bar with Back Button */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search supplements, protein, cafe..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => performSearch(query, selectedCategory)}
            returnKeyType="search"
            autoFocus={!initialQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills Bar */}
      {categories.length > 0 && (
        <View style={styles.categoriesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
            <TouchableOpacity
              style={[styles.categoryPill, selectedCategory === null && styles.categoryPillActive]}
              onPress={() => handleSelectCategory(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryPillText, selectedCategory === null && styles.categoryPillTextActive]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => handleSelectCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content Area */}
      {loading && results.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching catalog...</Text>
        </View>
      ) : hasSearched ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListHeaderComponent={
              <View style={styles.resultsSummaryRow}>
                <Text style={styles.resultsCountText}>
                  Found <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{results.length}</Text> {results.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            }
            renderItem={({ item }) => <ProductCard product={item} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={42} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any results for "{query}". Try checking your spelling or search for popular items below.
            </Text>

            <View style={styles.popularTagsRow}>
              {POPULAR_SEARCHES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.popularTag}
                  onPress={() => handlePopularPress(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.popularTagText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      ) : (
        <ScrollView style={styles.initialContainer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.popularSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up" size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Popular Searches</Text>
            </View>
            <View style={styles.popularGrid}>
              {POPULAR_SEARCHES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.popularCard}
                  onPress={() => handlePopularPress(item)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="search-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.popularCardText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.quickTipsBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickTipsText}>
              Search by supplement name, flavor (Chocolate, Vanilla), brand, or cafe items to quickly find what you need.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDarker,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  loader: {
    marginLeft: 6,
  },
  clearBtn: {
    padding: 4,
  },
  categoriesBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingVertical: SPACING.xs,
  },
  categoryPillsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceDarker,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  categoryPillTextActive: {
    color: COLORS.white,
  },
  resultsList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  resultsSummaryRow: {
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceDarker,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  popularTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  popularTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  popularTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  initialContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  popularSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  popularCardText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickTipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  quickTipsText: {
    flex: 1,
    fontSize: 11.5,
    color: '#991B1B',
    lineHeight: 16,
    fontWeight: '500',
  },
});
