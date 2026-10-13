import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, BORDER_RADIUS } from "../../constants/theme";
import { Header } from "../../components/Header";
import shopService from "../../services/shop.service";
import { BusinessInfo } from "../../types";
import { OptimizedImage } from "../../components/OptimizedImage";

export const AboutBusinessScreen: React.FC = () => {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    shopService.getBusinessDetails().then(setBusiness).catch(console.error);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="About Business" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.bannerBox}>
          {business?.hero_banner ? (
            <OptimizedImage
              source={{ uri: business.hero_banner }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons
                name="barbell"
                size={42}
                color="rgba(239, 68, 68, 0.4)"
              />
            </View>
          )}
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerLogoRow}>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.bannerLogo}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  {business?.name || "ORLA Gym & Cafe"}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {business?.tagline || "Strength. Health. Family. Legacy."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Story Section */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Our Story & Philosophy</Text>
          <Text style={styles.bodyText}>
            {business?.history ||
              "ORLA was founded by Dhiraj Gharti (“Orla Dad”) to bring authentic, certified sports nutrition, gym facilities, and wholesome fitness culture under one roof."}
          </Text>
          {business?.description ? (
            <Text style={[styles.bodyText, { marginTop: SPACING.sm }]}>
              {business.description}
            </Text>
          ) : null}
        </View>

        {/* Mission & Vision */}
        <View style={styles.gridRow}>
          {business?.mission && (
            <View style={styles.miniCard}>
              <View style={styles.iconTag}>
                <Ionicons
                  name="compass-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.miniCardTitle}>Our Mission</Text>
              <Text style={styles.miniCardText}>{business.mission}</Text>
            </View>
          )}

          {business?.vision && (
            <View style={styles.miniCard}>
              <View style={styles.iconTag}>
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color={COLORS.accentCyan}
                />
              </View>
              <Text style={styles.miniCardTitle}>Our Vision</Text>
              <Text style={styles.miniCardText}>{business.vision}</Text>
            </View>
          )}
        </View>

        {/* Contact & Physical Address */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Headquarters & Contact</Text>
          {business?.address ? (
            <View style={styles.contactItem}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.contactText}>{business.address}</Text>
            </View>
          ) : null}
          {business?.phone && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${business.phone}`)}
            >
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <Text
                style={[styles.contactText, { color: COLORS.primaryLight }]}
              >
                {business.phone}
              </Text>
            </TouchableOpacity>
          )}
          {business?.email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${business.email}`)}
            >
              <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
              <Text
                style={[styles.contactText, { color: COLORS.primaryLight }]}
              >
                {business.email}
              </Text>
            </TouchableOpacity>
          )}
          {business?.website && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(business.website || "")}
            >
              <Ionicons name="globe-outline" size={18} color={COLORS.primary} />
              <Text
                style={[styles.contactText, { color: COLORS.primaryLight }]}
              >
                {business.website}
              </Text>
            </TouchableOpacity>
          )}

          {/* Social Links */}
          {business?.social_links && (
            <View style={styles.socialButtonsRow}>
              {business.social_links.instagram && (
                <TouchableOpacity
                  style={styles.socialPill}
                  onPress={() =>
                    Linking.openURL(business.social_links.instagram)
                  }
                >
                  <Ionicons name="logo-instagram" size={18} color="#E1306C" />
                  <Text style={styles.socialPillText}>Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
  bannerBox: {
    height: 180,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  socialPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 13, 20, 0.28)",
    padding: SPACING.lg,
    justifyContent: "flex-end",
  },
  bannerLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "700",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  gridRow: {
    gap: SPACING.md,
  },
  miniCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  iconTag: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  miniCardText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
