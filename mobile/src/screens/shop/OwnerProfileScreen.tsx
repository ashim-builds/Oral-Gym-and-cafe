import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import shopService from '../../services/shop.service';
import { OwnerInfo } from '../../types';
import { OptimizedImage } from '../../components/OptimizedImage';

export const OwnerProfileScreen: React.FC = () => {
  const [owner, setOwner] = useState<OwnerInfo | null>(null);

  useEffect(() => {
    shopService.getOwnerDetails().then(setOwner).catch(console.error);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Head Coach & Founder" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.photoContainer}>
            {owner?.photo ? (
              <OptimizedImage
                source={{ uri: owner.photo }}
                style={styles.photo}
                aspectRatio={1}
                borderRadius={55}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={44} color={COLORS.primary} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{owner?.name || 'Dhiraj Gharti'}</Text>
          <Text style={styles.position}>{owner?.position || 'Founder of ORLA Fitness | Bodybuilding Athlete'}</Text>

          {owner?.experience ? (
            <View style={styles.experienceBadge}>
              <Ionicons name="medal-outline" size={14} color={COLORS.primary} />
              <Text style={styles.experienceText}>{owner.experience}</Text>
            </View>
          ) : null}
        </View>

        {/* Biography */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Biography & Philosophy</Text>
          <Text style={styles.bioText}>
            {owner?.biography ||
              'Dhiraj Gharti, widely known online as “Orla Dad,” is a fitness personality, bodybuilding athlete, and entrepreneur whose journey is built on personal transformation, discipline, and community legacy.'}
          </Text>
        </View>

        {/* Direct Contact & Socials */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Connect Directly</Text>

          <View style={styles.contactList}>
            {owner?.contact ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${owner.contact}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconBox}>
                  <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Phone / WhatsApp</Text>
                  <Text style={styles.contactText}>{owner.contact}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}

            {owner?.email ? (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${owner.email}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconBox}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Email Address</Text>
                  <Text style={styles.contactText}>{owner.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Social Platforms Row with Official Logos */}
          <View style={styles.socialGrid}>
            {owner?.social_links?.instagram ? (
              <TouchableOpacity
                style={styles.instagramButton}
                onPress={() => {
                  const ig = owner.social_links.instagram;
                  const igUrl = ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace('@', '')}`;
                  Linking.openURL(igUrl);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-instagram" size={20} color="#E1306C" />
                <Text style={styles.instagramButtonText}>Instagram</Text>
              </TouchableOpacity>
            ) : null}

            {owner?.social_links?.youtube ? (
              <TouchableOpacity
                style={styles.socialPillBtn}
                onPress={() => Linking.openURL(owner.social_links.youtube)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                <Text style={styles.socialPillBtnText}>YouTube</Text>
              </TouchableOpacity>
            ) : null}

            {owner?.social_links?.tiktok ? (
              <TouchableOpacity
                style={styles.socialPillBtn}
                onPress={() => Linking.openURL(owner.social_links.tiktok)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-tiktok" size={18} color={COLORS.textPrimary} />
                <Text style={styles.socialPillBtnText}>TikTok</Text>
              </TouchableOpacity>
            ) : null}

            {owner?.social_links?.facebook ? (
              <TouchableOpacity
                style={styles.socialPillBtn}
                onPress={() => Linking.openURL(owner.social_links.facebook)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                <Text style={styles.socialPillBtnText}>Facebook</Text>
              </TouchableOpacity>
            ) : null}

            {owner?.social_links?.linkedin ? (
              <TouchableOpacity
                style={styles.socialPillBtn}
                onPress={() => Linking.openURL(owner.social_links.linkedin)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                <Text style={styles.socialPillBtnText}>LinkedIn</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
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
  profileCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  photoContainer: {
    marginBottom: SPACING.md,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  position: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  contactList: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.xs,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.primary,
  },
  instagramButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#BE185D',
  },
  socialPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  socialPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
