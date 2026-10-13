import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { notificationService } from '../services/notification.service';

const PERMISSION_PROMPT_KEY = 'orla_gym_permissions_prompted_v1';

export const PermissionsModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const alreadyPrompted = await AsyncStorage.getItem(PERMISSION_PROMPT_KEY);
      if (!alreadyPrompted) {
        // Check if permission already granted
        const isGranted = await notificationService.checkNotificationPermission();
        if (!isGranted) {
          // Show on first time with subtle delay for smooth entry
          setTimeout(() => {
            setVisible(true);
          }, 800);
        } else {
          await AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'true');
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      await notificationService.requestNotificationPermission();
      await AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'true');
    } catch (e) {
      console.warn('Permission request error:', e);
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(PERMISSION_PROMPT_KEY, 'true');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Top Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={36} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Enable Push Notifications</Text>
          <Text style={styles.subtitle}>
            Stay instantly informed on your supplement orders and fitness hub updates.
          </Text>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Live Order Tracking</Text>
                <Text style={styles.benefitDesc}>Get notified when your order is packed, dispatched, or ready for pickup.</Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="flash-outline" size={18} color="#D97706" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Stock Drops & Deals</Text>
                <Text style={styles.benefitDesc}>Be first to know when 100% authentic proteins and creatines restock.</Text>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBox}>
                <Ionicons name="storefront-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Store Hub Updates</Text>
                <Text style={styles.benefitDesc}>Branch opening hours, cafe nutrition menu, and pickup alerts.</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAllow}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="notifications" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Allow Notifications</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  benefitsContainer: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  dismissButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  dismissButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
