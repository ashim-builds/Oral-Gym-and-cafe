import React, { useState, useEffect, useRef } from 'react';
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

export const OtpVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { phoneNumber, cooldownSeconds = 30, devOtp, returnToScreen } = route.params || {};

  const { verifyOtp, sendOtp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(cooldownSeconds);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-fill devOtp in dev mock mode
  useEffect(() => {
    if (devOtp && typeof devOtp === 'string' && devOtp.length === 6) {
      setOtp(devOtp.split(''));
    }
  }, [devOtp]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev: number) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next box if typed
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('').trim();
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { isNewCustomer } = await verifyOtp(fullOtp);

      if (isNewCustomer) {
        navigation.navigate('CompleteProfile', { returnToScreen });
      } else {
        // Existing customer - return to checkout if requested or to main shop
        if (returnToScreen) {
          navigation.navigate(returnToScreen);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    try {
      const res = await sendOtp(phoneNumber);
      setTimer(res.cooldownSeconds || 30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      if (res.devOtp) {
        setOtp(res.devOtp.split(''));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inner}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verify Code</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Body */}
              <View style={styles.content}>
                <View style={styles.iconCircle}>
                  <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
                </View>

                <Text style={styles.title}>Enter 6-Digit Code</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit verification code to:
                </Text>
                <Text style={styles.phoneHighlight}>{phoneNumber}</Text>

                {devOtp ? (
                  <View style={styles.devBanner}>
                    <Ionicons name="code-slash-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.devBannerText}>
                      Development OTP: <Text style={{ fontWeight: '900', color: COLORS.primary }}>{devOtp}</Text>
                    </Text>
                  </View>
                ) : null}

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.accentRose} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* 6 Digit Input Boxes */}
                <View style={styles.otpBoxesContainer}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        inputRefs.current[idx] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, idx)}
                      onKeyPress={(e) => handleKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Resend & Change Phone */}
                <View style={styles.actionsRow}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                      <Text style={styles.resendActiveText}>Resend New Code</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.resendCooldownText}>
                      Resend code in <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{timer}s</Text>
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => navigation.navigate('PhoneInput')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changePhoneText}>Change phone number</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleVerify}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Verify OTP & Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
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
    paddingBottom: SPACING.xl,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  phoneHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryMuted,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
    marginBottom: SPACING.md,
  },
  devBannerText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
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
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorderLight,
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  actionsRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendActiveText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  resendCooldownText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  changePhoneText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    width: '100%',
  },
  submitButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
});
