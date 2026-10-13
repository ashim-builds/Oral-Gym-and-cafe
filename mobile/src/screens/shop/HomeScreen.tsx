import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Linking,
  TextInput,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import { ProductCard } from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";
import { useCart } from "../../context/CartContext";
import { notificationService } from "../../services/notification.service";
import shopService from "../../services/shop.service";
import {
  Product,
  Category,
  Branch,
  BusinessInfo,
  OwnerInfo,
} from "../../types";
import { OptimizedImage } from "../../components/OptimizedImage";
import { BRAND_LOGO_BASE64 } from "../../constants/brandLogo";
import { resolveImageUrl } from "../../services/image.service";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { customer, authState } = useAuth();
  const { adminUser, isAdminAuthenticated } = useAdmin();
  const { itemCount, subtotal } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orderingBranch, setOrderingBranch] = useState<Branch | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [logoError, setLogoError] = useState(false);

  const logoUri = !logoError && business?.logo ? resolveImageUrl(business.logo) : BRAND_LOGO_BASE64;
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll tracking for dynamic header behavior
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const [feat, cats, brs, ordBr, biz, own] = await Promise.all([
        shopService.getFeaturedProducts().catch(() => []),
        shopService.getCategories().catch(() => []),
        shopService.getBranches().catch(() => []),
        shopService.getOrderingBranch().catch(() => null),
        shopService.getBusinessDetails().catch(() => null),
        shopService.getOwnerDetails().catch(() => null),
      ]);

      setFeaturedProducts(feat || []);
      setCategories(cats || []);
      setBranches(brs || []);
      setOrderingBranch(ordBr);
      setBusiness(biz);
      setOwner(own);
    } catch (err: any) {
      console.warn("Home data partial load:", err.message);
    }

    // Load unread notification count safely
    try {
      if (isAdminAuthenticated && adminUser) {
        const notifs = await notificationService.getAdminNotifications();
        setUnreadCount(notifs.unreadCount || 0);
      } else if (authState === "AUTHENTICATED") {
        const notifs = await notificationService.getCustomerNotifications();
        setUnreadCount(notifs.unreadCount || 0);
      } else {
        setUnreadCount(0);
      }
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        if (isAdminAuthenticated && adminUser) {
          const res = await notificationService.getAdminNotifications();
          setUnreadCount(res.unreadCount || 0);
        } else if (authState === "AUTHENTICATED") {
          const res = await notificationService.getCustomerNotifications();
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [adminUser, isAdminAuthenticated, authState]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    navigation.navigate("Search", { query: searchQuery.trim() });
  };

  const openDirections = (branch: Branch) => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`,
    ).catch(() => {});
  };

  const openSocial = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  // Header Title & Greeting Animation on scroll
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerTitleHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [52, 0],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Top Header: Only Brand Title & Notification Bell (Collapses into Search Box on Scroll) */}
      <View style={styles.topHeaderContainer}>
        <Animated.View
          style={[
            styles.brandHeaderRow,
            {
              opacity: headerTitleOpacity,
              height: headerTitleHeight,
              overflow: "hidden",
            },
          ]}
        >
          <View style={styles.brandTitleBox}>
            <View style={styles.brandIconCircle}>
              <Image
                source={{ uri: logoUri }}
                style={styles.brandLogoImg}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            </View>
            <View>
              <Text style={styles.brandTitleText}>
                {business?.name || "ORLA GYM & CAFE"}
              </Text>
              <Text style={styles.brandSubtitleText}>
                {business?.tagline || "Authentic Supplements & Cafe"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            style={styles.notificationBtn}
            activeOpacity={0.75}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={COLORS.textPrimary}
            />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Sticky Clean Search Box */}
        <View style={styles.searchBarWrapper}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate("Search", { query: searchQuery.trim() })
            }
          >
            <Ionicons
              name="search"
              size={16}
              color={COLORS.primary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search whey, creatine, pre-workout, cafe..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              onFocus={() =>
                navigation.navigate("Search", { query: searchQuery.trim() })
              }
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.searchPill}>
                <Text style={styles.searchPillText}>Search</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          {business?.hero_banner ? (
            <OptimizedImage
              source={{ uri: business.hero_banner }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.brandHeroFallback}>
              <View style={styles.brandHeroLogo}>
                <Image
                  source={{ uri: logoUri }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandHeroTitle}>
                {business?.name || "ORLA GYM & CAFE"}
              </Text>
              <Text style={styles.brandHeroTagline}>
                {business?.tagline || "Strength. Health. Family. Legacy."}
              </Text>
            </View>
          )}
          <View style={styles.heroBadgeFloating}>
            <Ionicons
              name="shield-checkmark"
              size={13}
              color={COLORS.accentEmerald}
            />
            <Text style={styles.heroBadgeText}>100% Genuine</Text>
          </View>
        </View>

        {/* Categories Section (Only if categories exist) */}
        {categories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="grid-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Shop by Category</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("ProductsTab")}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("ProductsTab", { categoryId: cat.id })
                  }
                >
                  <OptimizedImage
                    source={{ uri: cat.image || "" }}
                    style={styles.categoryImage}
                    aspectRatio={4 / 3}
                    resizeMode="cover"
                    fallbackIcon="layers-outline"
                  />
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryTitle} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Featured & Trending Supplements */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Featured & Trending</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("ProductsTab")}>
            <Text style={styles.seeAllText}>Explore</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} horizontal />
          ))}
        </ScrollView>

        {/* Active Online Ordering Hub Spotlight */}
        {orderingBranch && (
          <View style={styles.hubContainer}>
            <View style={styles.hubHeaderRow}>
              <View style={styles.hubBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.hubBadgeText}>ACTIVE ORDERING HUB</Text>
              </View>
              <Text style={styles.hubSubtag}>Primary Store</Text>
            </View>

            <Text style={styles.hubTitle}>{orderingBranch.name}</Text>

            <View style={styles.hubDetailsRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.hubAddress}>{orderingBranch.address}</Text>
            </View>

            {orderingBranch.opening_hours && (
              <View style={styles.hubDetailsRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <Text style={styles.hubHours}>
                  Open: {orderingBranch.opening_hours}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.hubNavButton}
              onPress={() => openDirections(orderingBranch)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="navigate-circle-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.hubNavText}>Get Directions to Store Hub</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Physical Store Branches */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="business-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>
              Store Branches ({branches.length})
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("BranchesTab")}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.branchesList}>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.branchItem}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("BranchesTab")}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.branchTitleRow}>
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.branchName}>{b.name}</Text>
                </View>
                <Text style={styles.branchAddress} numberOfLines={1}>
                  {b.address}
                </Text>
              </View>

              <View style={styles.branchStatus}>
                {b.can_order ? (
                  <View style={styles.orderableTag}>
                    <Text style={styles.branchOrderable}>Ordering Hub</Text>
                  </View>
                ) : (
                  <Text style={styles.branchStoreOnly}>Store Only</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: SPACING.xl }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Top Header Container
  topHeaderContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  brandHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  brandTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(220, 38, 38, 0.45)",
    backgroundColor: "#000000",
    ...SHADOWS.card,
  },
  brandLogoImg: {
    width: "100%",
    height: "100%",
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.3,
  },
  brandSubtitleText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "600",
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: COLORS.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },
  // Sticky Search Bar
  searchBarWrapper: {
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  searchPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  searchPillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  // Hero Image Clean
  heroCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    height: 175,
    position: "relative",
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  brandHeroFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  brandHeroLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  brandHeroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 0.5,
  },
  brandHeroTagline: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  heroBadgeFloating: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    gap: 5,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },
  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Categories
  categoriesScroll: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    gap: SPACING.sm,
  },
  categoryCard: {
    width: 105,
    height: 105,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 8,
  },

  categoryTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  // Featured Scroll
  featuredScroll: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
  },
  // Hub Spotlight
  hubContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  hubHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  hubBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  hubBadgeText: {
    color: "#16A34A",
    fontSize: 10,
    fontWeight: "800",
  },
  hubSubtag: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  hubTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  hubDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  hubAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  hubHours: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  hubNavButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 8,
    gap: 6,
  },
  hubNavText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Curved Circle Cart Section (Top of Branches)
  curveCartWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  curveCartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: SPACING.sm,
    paddingRight: SPACING.md,
    borderWidth: 1.5,
    borderColor: "#FECDD3",
    ...SHADOWS.card,
  },
  curveCircleBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...SHADOWS.primary,
  },

  curveCartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#111827",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.white,
    paddingHorizontal: 4,
  },
  curveCartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  curveCartInfo: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  curveCartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  curveCartTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  curveCartStatus: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  curveCartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  curveArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
  },
  // Branches
  branchesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  branchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  branchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  branchName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  branchAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  branchStatus: {
    marginLeft: 8,
  },
  orderableTag: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  branchOrderable: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
  },
  branchStoreOnly: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  // About & Info
  infoCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  infoCardText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  missionBox: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  missionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  missionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  missionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 4,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Owner Card
  ownerCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.card,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: 8,
  },
  ownerPhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surfaceCard,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerRole: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  ownerExp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  ownerBio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    lineHeight: 17,
    marginBottom: 8,
  },
  ownerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  ownerLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  // Footer
  footerSection: {
    alignItems: "center",
    marginTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  socialRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  copyrightText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});

export default HomeScreen;
