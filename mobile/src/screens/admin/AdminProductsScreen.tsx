import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import mobileAdminService from '../../services/admin.service';
import { Product, Category } from '../../types';
import { OptimizedImage } from '../../components/OptimizedImage';
import { ImageUploadPicker } from '../../components/ImageUploadPicker';

export const AdminProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('15');
  const [mainImage, setMainImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        mobileAdminService.getProducts({ search: search || undefined, limit: 100 }),
        mobileAdminService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId((prev) => (cats.some((c: Category) => c.id === prev) ? prev : cats[0].id));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories.length > 0 ? categories[0].id : 0);
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setStockQuantity('20');
    setMainImage('');
    setIsAvailable(true);
    setIsFeatured(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.category_id);
    setDescription(p.description);
    setPrice(p.price.toString());
    setDiscountPrice(p.discount_price ? p.discount_price.toString() : '');
    setStockQuantity(p.stock_quantity.toString());
    setMainImage(p.main_image);
    setIsAvailable(p.is_available);
    setIsFeatured(p.is_featured);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price || !description.trim()) {
      setError('Please fill in required fields (*)');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        main_image: mainImage.trim(),
        is_available: isAvailable,
        is_featured: isFeatured,
      };

      if (categoryId > 0) {
        payload.category_id = Number(categoryId);
      }

      if (editingProduct) {
        await mobileAdminService.updateProduct(editingProduct.id, payload);
      } else {
        await mobileAdminService.createProduct(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Product', 'Are you sure you want to remove this supplement from catalog?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileAdminService.deleteProduct(id);
            loadData();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const formatNPR = (val: number) => `NPR ${Number(val).toLocaleString()}`;

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <OptimizedImage
        source={{ uri: item.main_image }}
        style={styles.prodImage}
        aspectRatio={1}
        resizeMode="cover"
      />

      <View style={styles.prodInfo}>
        <Text style={styles.prodName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.prodCategory}>{item.category?.name || 'Supplement'}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.prodPrice}>
            {formatNPR(item.discount_price || item.price)}
          </Text>
          {item.discount_price && (
            <Text style={styles.prodOldPrice}>{formatNPR(item.price)}</Text>
          )}
        </View>

        <View style={styles.stockRow}>
          <Text style={item.stock_quantity <= 0 ? styles.outOfStock : styles.inStock}>
            Stock: {item.stock_quantity} units
          </Text>
          {item.is_featured && (
            <View style={styles.featuredTagBox}>
              <Ionicons name="flame" size={10} color={COLORS.white} />
              <Text style={styles.featuredTag}>FEATURED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.accentRose} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Manage Products"
        showCart={false}
        rightAction={
          <TouchableOpacity onPress={openCreateModal} style={styles.addNavBtn}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Supplement' : 'Add New Supplement'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            ) : null}

            <ScrollView
              style={styles.modalForm}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={COLORS.textMuted} />
              </View>

              {categories.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setCategoryId(0)}
                      style={[styles.catChip, categoryId === 0 && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, categoryId === 0 && styles.catChipTextActive]}>None</Text>
                    </TouchableOpacity>
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCategoryId(c.id)}
                        style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
                      >
                        <Text style={[styles.catChipText, categoryId === c.id && styles.catChipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.grid2}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Regular Price (NPR) *</Text>
                  <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="11500" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Discount Price (NPR)</Text>
                  <TextInput style={styles.input} value={discountPrice} onChangeText={setDiscountPrice} placeholder="9999" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Stock Quantity *</Text>
                <TextInput style={styles.input} value={stockQuantity} onChangeText={setStockQuantity} placeholder="15" keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
              </View>

              <ImageUploadPicker
                label="Product Image (Custom Upload) *"
                value={mainImage}
                onChange={setMainImage}
                aspect={[1, 1]}
              />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description *</Text>
                <TextInput style={[styles.input, { height: 60 }]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={COLORS.textMuted} multiline />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Is Active & Available</Text>
                <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: COLORS.primary, false: COLORS.surfaceBorder }} />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Featured on Home Screen</Text>
                <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: COLORS.accentAmber, false: COLORS.surfaceBorder }} />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Product</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  addNavBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    gap: SPACING.md,
    alignItems: 'center',
  },
  prodImage: {
    width: 65,
    height: 65,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  prodInfo: {
    flex: 1,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  prodCategory: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  prodPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  prodOldPrice: {
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  inStock: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentEmerald,
  },
  outOfStock: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentRose,
  },
  featuredTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredTag: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  actionCol: {
    gap: SPACING.sm,
  },
  editBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalError: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  modalErrorText: {
    color: COLORS.accentRose,
    fontSize: 12,
  },
  modalForm: {
    maxHeight: 400,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  grid2: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  noCategoriesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  noCategoriesBannerText: {
    fontSize: 12,
    color: COLORS.accentAmber,
    flex: 1,
    fontWeight: '500',
  },
});
