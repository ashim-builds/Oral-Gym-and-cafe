import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import shopService from '../../services/shop.service';
import { BusinessInfo } from '../../types';
import { resolveImageUrl } from '../../services/image.service';
import { BRAND_LOGO_BASE64 } from '../../constants/brandLogo';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { enterGuestMode } = useAuth();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    shopService
      .getBusinessDetails()
      .then(setBusiness)
      .catch(() => {});
  }, []);

  const handlePhoneAuth = () => {
    navigation.navigate('PhoneInput');
  };

  const handleGuestMode = async () => {
    await enterGuestMode();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ImageBackground
        source={
          business?.hero_banner
            ? { uri: resolveImageUrl(business.hero_banner) }
            : undefined
        }
        style={[styles.backgroundImage, !business?.hero_banner && { backgroundColor: '#ffffff' }]}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* Top Brand Logo Section */}
            <View style={styles.topSection}>
              <View style={styles.logoBadge}>
                <Image
                  source={{ uri: BRAND_LOGO_BASE64 }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandTitle}>
                {business?.name ? business.name.toUpperCase() : 'ORLA GYM & CAFE'}
              </Text>
              <View style={styles.taglineBadge}>
                <Text style={styles.taglineText}>100% AUTHENTIC SUPPLEMENTS & NUTRITION</Text>
              </View>
            </View>

            {/* Middle Welcome Text */}
            <View style={styles.middleSection}>
              <Text style={styles.welcomeSubhead}>Welcome to</Text>
              <Text style={styles.welcomeHeading}>
                {business?.name || 'Orla Gym & Cafe'}
              </Text>
              <Text style={styles.description}>
                Your trusted fitness store for lab-tested whey proteins, creatine, pre-workouts, and performance fuel.
              </Text>
            </View>


            {/* Bottom Auth Buttons */}
            <View style={styles.bottomSection}>
              {/* Primary: Continue with Phone */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handlePhoneAuth}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Continue with Phone</Text>
              </TouchableOpacity>

              {/* Secondary: Login / Register */}
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={handlePhoneAuth}
              >
                <Text style={styles.secondaryButtonText}>Login / Register</Text>
              </TouchableOpacity>

              {/* Guest Action: Login Later & Visit Shop */}
              <TouchableOpacity
                style={styles.guestButton}
                activeOpacity={0.7}
                onPress={handleGuestMode}
              >
                <Text style={styles.guestButtonText}>Login Later & Visit Shop</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primaryLight} />
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                Cash on Delivery & Cash on Pickup Only
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  topSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.5,
  },
  taglineBadge: {
    marginTop: SPACING.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  taglineText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  middleSection: {
    marginVertical: SPACING.xl,
  },
  welcomeSubhead: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  welcomeHeading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 38,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bottomSection: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    height: 54,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    height: 50,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  guestButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  guestButtonText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
