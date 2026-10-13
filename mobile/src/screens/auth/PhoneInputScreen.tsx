import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export const PhoneInputScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const returnToScreen = route.params?.returnToScreen;

  const { sendOtp } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phoneNumber, setPhoneNumber] = useState('+977 98');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phoneNumber.trim();

    if (cleanPhone.replace(/\D/g, '').length < 8) {
      setError('Please enter a valid mobile number (e.g. 98XXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(cleanPhone);
      navigation.navigate('OtpVerification', {
        phoneNumber: cleanPhone,
        cooldownSeconds: result.cooldownSeconds || 30,
        devOtp: result.devOtp,
        returnToScreen,
        authMode,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {authMode === 'LOGIN' ? 'Customer Sign In' : 'Create New Account'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Login / Register Segmented Switch */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentBtn, authMode === 'LOGIN' && styles.segmentBtnActive]}
                onPress={() => setAuthMode('LOGIN')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="log-in-outline"
                  size={16}
                  color={authMode === 'LOGIN' ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.segmentText, authMode === 'LOGIN' && styles.segmentTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, authMode === 'REGISTER' && styles.segmentBtnActive]}
                onPress={() => setAuthMode('REGISTER')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color={authMode === 'REGISTER' ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.segmentText, authMode === 'REGISTER' && styles.segmentTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            <View style={styles.card}>
              <View style={styles.brandIconBox}>
                <Ionicons
                  name={authMode === 'LOGIN' ? 'barbell' : 'shield-checkmark'}
                  size={30}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.title}>
                {authMode === 'LOGIN' ? 'Welcome Back!' : 'Join Orla Gym & Cafe'}
              </Text>

              <Text style={styles.subtitle}>
                {authMode === 'LOGIN'
                  ? 'Enter your mobile number to sign in and track your active supplement orders.'
                  : 'Register with your mobile phone to order genuine supplements with Cash on Delivery / Pickup.'}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.accentRose} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Phone Input Box */}
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+977 98XXXXXXXX"
                  placeholderTextColor={COLORS.textMuted}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={18}
                />
              </View>

              <View style={styles.tipBox}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.accentEmerald} />
                <Text style={styles.tipText}>
                  Instant OTP verification — no password required.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {authMode === 'LOGIN' ? 'Send Login Code' : 'Send Registration Code'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Value Props & Guarantees */}
            <View style={styles.perksContainer}>
              <View style={styles.perkItem}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.perkText}>100% Genuine Lab-Tested Supplements</Text>
              </View>
              <View style={styles.perkItem}>
                <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.perkText}>Fast Cash on Delivery & Free Store Pickup</Text>
              </View>
              <View style={styles.perkItem}>
                <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
                <Text style={styles.perkText}>Instant Order History & Delivery Tracking</Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...SHADOWS.card,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Segmented Switch
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },

  // Main Form Card
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  brandIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.accentRose,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorderLight,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  tipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  submitButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  // Value Props
  perksContainer: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: SPACING.sm,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
