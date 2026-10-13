import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';
import { ImageUploadPicker } from '../../components/ImageUploadPicker';

export const AdminBranchesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formMapUrl, setFormMapUrl] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formCanOrder, setFormCanOrder] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    try {
      const data = await mobileAdminService.getBranches();
      setBranches(data || []);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormEmail('');
    setFormHours('Sun-Fri: 5:00 AM - 9:00 PM');
    setFormMapUrl('');
    setFormImage('');
    setFormLat('');
    setFormLng('');
    setFormCanOrder(false);
    setFormIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (branch: any) => {
    setEditingBranch(branch);
    setFormName(branch.name || '');
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
    setFormEmail(branch.email || '');
    setFormHours(branch.opening_hours || '');
    setFormMapUrl(branch.map_url || '');
    setFormImage(branch.image || '');
    setFormLat(branch.latitude ? String(branch.latitude) : '');
    setFormLng(branch.longitude ? String(branch.longitude) : '');
    setFormCanOrder(Boolean(branch.can_order));
    setFormIsActive(Boolean(branch.is_active));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      Alert.alert('Validation Error', 'Branch name and address are required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        opening_hours: formHours.trim() || undefined,
        map_url: formMapUrl.trim() || undefined,
        image: formImage.trim() || undefined,
        latitude: formLat ? parseFloat(formLat) : undefined,
        longitude: formLng ? parseFloat(formLng) : undefined,
        can_order: formCanOrder,
        is_active: formIsActive,
      };

      if (editingBranch) {
        await mobileAdminService.updateBranch(editingBranch.id, payload);
        Alert.alert('Success', 'Branch updated successfully');
      } else {
        await mobileAdminService.createBranch(payload);
        Alert.alert('Success', 'Branch created successfully');
      }

      setModalVisible(false);
      fetchBranches();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (branch: any) => {
    Alert.alert(
      'Delete Branch',
      `Are you sure you want to delete "${branch.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileAdminService.deleteBranch(branch.id);
              Alert.alert('Deleted', 'Branch has been deleted.');
              fetchBranches();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete branch.');
            }
          },
        },
      ]
    );
  };

  const handleMakeOrderingHub = async (branch: any) => {
    Alert.alert(
      'Set as Online Ordering Hub',
      `Switch online customer orders to fulfill from "${branch.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await mobileAdminService.updateBranch(branch.id, { can_order: true });
              Alert.alert('Success', `${branch.name} is now the active online ordering hub!`);
              fetchBranches();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to set ordering hub');
            }
          },
        },
      ]
    );
  };

  const renderBranchItem = ({ item }: { item: any }) => (
    <View style={[styles.card, item.can_order && styles.cardOrderingHub]}>
      {/* Ordering Hub Banner */}
      {item.can_order ? (
        <View style={styles.hubBanner}>
          <Ionicons name="cart" size={14} color={COLORS.backgroundDark} />
          <Text style={styles.hubBannerText}>PRIMARY ONLINE ORDERING HUB</Text>
        </View>
      ) : null}

      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.branchName}>{item.name}</Text>
            {!item.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="location-outline" size={13} color={COLORS.primary} />
            <Text style={styles.branchAddress}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.accentRose} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.metaGrid}>
        {item.phone ? (
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
        ) : null}
        {item.opening_hours ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.opening_hours}</Text>
          </View>
        ) : null}
      </View>

      {!item.can_order && (
        <TouchableOpacity
          style={styles.setHubBtn}
          onPress={() => handleMakeOrderingHub(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.accentAmber} />
          <Text style={styles.setHubBtnText}>Set as Active Ordering Hub</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Branches & Locations</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Info notice */}
      <View style={styles.noticeBanner}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.accentAmber} />
        <Text style={styles.noticeText}>
          Only 1 branch can be active for Online Checkout at a time. Other branches are displayed for map directions & in-store visits.
        </Text>
      </View>

      {/* Branches List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBranchItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No branches configured</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Branch Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBranch ? 'Edit Branch Location' : 'New Branch Location'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Branch Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Orla Gym Hub - Kathmandu Main"
                  placeholderTextColor={COLORS.textMuted}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Physical Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Putalisadak, Kathmandu"
                  placeholderTextColor={COLORS.textMuted}
                  value={formAddress}
                  onChangeText={setFormAddress}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +977 1 4220000"
                    placeholderTextColor={COLORS.textMuted}
                    value={formPhone}
                    onChangeText={setFormPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="branch@orlagym.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={formEmail}
                    onChangeText={setFormEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>


              {/* Branch Image Upload */}
              <ImageUploadPicker
                label="Branch Photo (Custom Upload)"
                value={formImage}
                onChange={setFormImage}
                aspect={[16, 9]}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Opening Hours</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sun-Fri: 5:00 AM - 9:00 PM"
                  placeholderTextColor={COLORS.textMuted}
                  value={formHours}
                  onChangeText={setFormHours}
                />
              </View>

              {/* Google Maps Location Link */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                  <Text style={styles.inputLabel}>Google Maps Location Link</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                  placeholderTextColor={COLORS.textMuted}
                  value={formMapUrl}
                  onChangeText={setFormMapUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Paste Google Maps share link so customers open exact directions.
                </Text>
              </View>

              {/* Toggles */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Primary Ordering Hub</Text>
                  <Text style={styles.toggleSub}>Receive customer orders at this branch</Text>
                </View>
                <Switch
                  value={formCanOrder}
                  onValueChange={setFormCanOrder}
                  trackColor={{ false: COLORS.surfaceDarker, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Active Branch</Text>
                  <Text style={styles.toggleSub}>Display in customer mobile app</Text>
                </View>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: COLORS.surfaceDarker, true: COLORS.accentEmerald }}
                  thumbColor={COLORS.white}
                />
              </View>

              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.backgroundDark} />
                ) : (
                  <Text style={styles.saveSubmitText}>
                    {editingBranch ? 'Update Branch' : 'Create Branch'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    backgroundColor: COLORS.surfaceDark,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.accentAmber,
    lineHeight: 16,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  card: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  cardOrderingHub: {
    borderColor: COLORS.primary,
  },
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    marginHorizontal: -SPACING.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  hubBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.backgroundDark,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  inactiveText: {
    fontSize: 10,
    color: COLORS.accentRose,
    fontWeight: '700',
  },
  branchAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceDarker,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginVertical: SPACING.sm,
  },
  metaGrid: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  setHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  setHubBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentAmber,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surfaceDark,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceDarker,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  saveSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
