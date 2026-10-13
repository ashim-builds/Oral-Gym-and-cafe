import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import mobileAdminService from '../../services/admin.service';

export const AdminSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState('100');
  const [freeThreshold, setFreeThreshold] = useState('5000');
  const [currency, setCurrency] = useState('NPR');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await mobileAdminService.getSettings();
      if (Array.isArray(data)) {
        data.forEach((s: any) => {
          if (s.key === 'delivery_fee') setDeliveryFee(s.value || '100');
          if (s.key === 'free_delivery_threshold') setFreeThreshold(s.value || '5000');
          if (s.key === 'currency') setCurrency(s.value || 'NPR');
        });
      }
    } catch (err) {
      console.error('Failed to load admin settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        mobileAdminService.updateSetting('delivery_fee', deliveryFee.trim(), 'Standard Delivery Fee in NPR'),
        mobileAdminService.updateSetting('free_delivery_threshold', freeThreshold.trim(), 'Threshold for free delivery'),
        mobileAdminService.updateSetting('currency', currency.trim(), 'Store Currency'),
      ]);
      Alert.alert('Success', 'Store & delivery settings updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery & Store Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Payment Note Banner */}
            <View style={styles.banner}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.accentEmerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Payment Policy Enforced</Text>
                <Text style={styles.bannerSub}>
                  All customer orders strictly use Cash on Delivery (COD) or Cash on Counter Pickup. Online payment gateways are disabled.
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>DELIVERY CONFIGURATION</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Standard Delivery Fee (NPR)</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>Applied automatically when customer selects Home Delivery (COD).</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Free Delivery Order Threshold (NPR)</Text>
                <TextInput
                  style={styles.input}
                  value={freeThreshold}
                  onChangeText={setFreeThreshold}
                  placeholder="5000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>Orders above this subtotal receive free home delivery.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Store Currency</Text>
                <TextInput
                  style={styles.input}
                  value={currency}
                  onChangeText={setCurrency}
                  placeholder="NPR"
                  placeholderTextColor={COLORS.textMuted}
                  editable={false}
                />
                <Text style={styles.helperText}>Fixed to Nepalese Rupee (NPR).</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.backgroundDark} />
              ) : (
                <Text style={styles.saveBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
    flexGrow: 1,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentEmerald,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
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
  helperText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
