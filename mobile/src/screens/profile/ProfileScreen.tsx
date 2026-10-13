import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { customer, authState, updateProfile, logout } = useAuth();
  const { isAdminAuthenticated } = useAdmin();

  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const openEditModal = () => {
    setName(customer?.name || '');
    setEmail(customer?.email || '');
    setAddress(customer?.address || '');
    setError('');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setUpdating(true);
    setError('');
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenAdminPortal = () => {
    if (isAdminAuthenticated) {
      navigation.navigate('AdminDashboard');
    } else {
      navigation.navigate('AdminLogin');
    }
  };

  if (authState !== 'AUTHENTICATED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Customer Profile" showBack={true} />
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.guestTitle}>Customer Profile</Text>
          <Text style={styles.guestSub}>
            Please log in with your phone number to access your saved delivery addresses and personal account.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'PhoneInput' })}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
            <Text style={styles.loginBtnText}>Login with Phone</Text>
          </TouchableOpacity>

          {/* Admin Entry for Staff */}
          <TouchableOpacity
            style={styles.guestAdminBtn}
            onPress={handleOpenAdminPortal}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-outline" size={16} color={COLORS.accentAmber} />
            <Text style={styles.guestAdminBtnText}>Staff & Admin Portal Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Account" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer?.name ? customer.name[0].toUpperCase() : 'C'}
            </Text>
          </View>

          <Text style={styles.customerName}>{customer?.name || 'Customer'}</Text>
          <View style={styles.verifiedPhoneBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.accentEmerald} />
            <Text style={styles.verifiedPhoneText}>{customer?.phone_number}</Text>
          </View>

          {customer?.email ? (
            <Text style={styles.customerEmail}>{customer.email}</Text>
          ) : null}

          {customer?.address ? (
            <View style={styles.addressBox}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.addressText}>{customer.address}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editProfileBtnText}>Edit Profile Information</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuItemText}>My Orders History</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Branches')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="business-outline" size={20} color={COLORS.accentCyan} />
            </View>
            <Text style={styles.menuItemText}>Store Branches & Ordering Hub</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AboutBusiness')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.accentLime} />
            </View>
            <Text style={styles.menuItemText}>About Orla Gym and Cafe</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OwnerProfile')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.accentAmber} />
            </View>
            <Text style={styles.menuItemText}>Head Coach & Founder</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* In-App Admin Management Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.adminMenuItem]}
            onPress={handleOpenAdminPortal}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, styles.adminIconBox]}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemText, styles.adminItemTitle]}>In-App Admin Management</Text>
              <Text style={styles.adminItemSub}>Products, Orders, Stock, Hubs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.accentRose} />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            ) : null}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalForm}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Phone Number (Verified)</Text>
                <View style={[styles.modalInput, styles.modalInputDisabled]}>
                  <Text style={styles.phoneTextDisabled}>{customer?.phone_number}</Text>
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Default Delivery Address</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Address"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Profile</Text>
                )}
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  verifiedPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.xs,
  },
  verifiedPhoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  customerEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: SPACING.md,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  editProfileBtn: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  menuCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  adminMenuItem: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIconBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.16)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  adminItemTitle: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  adminItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginLeft: 68,
  },
  logoutButton: {
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentRose,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guestSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  loginBtn: {
    height: 48,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  guestAdminBtn: {
    marginTop: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  guestAdminBtnText: {
    color: COLORS.accentAmber,
    fontSize: 12,
    fontWeight: '700',
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
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  modalScroll: {
    maxHeight: 340,
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
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalField: {},
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    height: 46,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  modalInputDisabled: {
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceBorder,
  },
  phoneTextDisabled: {
    color: COLORS.accentEmerald,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    height: 42,
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
