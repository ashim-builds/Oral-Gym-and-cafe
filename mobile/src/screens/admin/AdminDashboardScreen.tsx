import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAdmin } from '../../context/AdminContext';
import mobileAdminService from '../../services/admin.service';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { adminUser, logoutAdmin } = useAdmin();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await mobileAdminService.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigation.replace('Main');
  };

  const formatNPR = (val: number) => `NPR ${Number(val || 0).toLocaleString()}`;

  const navMenuItems = [
    { title: 'Manage Products & Stock', screen: 'AdminProducts', icon: 'barbell-outline', color: COLORS.primary },
    { title: 'Customer Orders & Cash', screen: 'AdminOrders', icon: 'receipt-outline', color: COLORS.accentEmerald, badge: stats?.pendingOrders },
    { title: 'Categories Management', screen: 'AdminCategories', icon: 'layers-outline', color: COLORS.accentCyan },
    { title: 'Branches & Ordering Hub', screen: 'AdminBranches', icon: 'location-outline', color: COLORS.accentAmber },
    { title: 'Customer Directory', screen: 'AdminCustomers', icon: 'people-outline', color: COLORS.info },
    { title: 'Business & Owner Profile', screen: 'AdminBusinessOwner', icon: 'business-outline', color: COLORS.accentLime },
    { title: 'Delivery & App Settings', screen: 'AdminSettings', icon: 'settings-outline', color: COLORS.textSecondary },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.exitBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.adminTitle}>Admin Portal</Text>
            <Text style={styles.adminUser}>{adminUser?.name || 'Administrator'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.accentRose} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Banner */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueSub}>TOTAL PROCESSED ORDER VALUE</Text>
            <View style={styles.cashBadge}>
              <Ionicons name="cash-outline" size={14} color={COLORS.accentEmerald} />
              <Text style={styles.cashBadgeText}>Cash Only</Text>
            </View>
          </View>
          <Text style={styles.revenueValue}>{formatNPR(stats?.totalOrderValue)}</Text>
          <Text style={styles.revenueSubNote}>COD & Counter Pickup Gross Sales</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="receipt" size={20} color={COLORS.primary} />
            <Text style={styles.statNum}>{stats?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={[styles.statBox, { borderColor: COLORS.accentAmber }]}>
            <Ionicons name="time" size={20} color={COLORS.accentAmber} />
            <Text style={[styles.statNum, { color: COLORS.accentAmber }]}>{stats?.pendingOrders || 0}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>

          <View style={[styles.statBox, { borderColor: COLORS.accentRose }]}>
            <Ionicons name="alert-circle" size={20} color={COLORS.accentRose} />
            <Text style={[styles.statNum, { color: COLORS.accentRose }]}>{stats?.outOfStockProducts || 0}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="people" size={20} color={COLORS.info} />
            <Text style={styles.statNum}>{stats?.totalCustomers || 0}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
        </View>

        {/* Navigation Modules */}
        <Text style={styles.sectionHeading}>Management Modules</Text>
        <View style={styles.menuList}>
          {navMenuItems.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>

              <Text style={styles.menuItemText}>{item.title}</Text>

              {item.badge ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{item.badge} PENDING</Text>
                </View>
              ) : null}

              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
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
  header: {
    height: 60,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  adminUser: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentRose,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  revenueCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  revenueSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  cashBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  revenueSubNote: {
    fontSize: 11,
    color: COLORS.accentEmerald,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  menuList: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badgePill: {
    backgroundColor: COLORS.accentAmber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.background,
  },
});
