import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import shopService from '../../services/shop.service';
import { Branch } from '../../types';
import { OptimizedImage } from '../../components/OptimizedImage';

export const BranchesScreen: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopService
      .getBranches()
      .then(setBranches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openDirections = (branch: Branch) => {
    if (branch.map_url && branch.map_url.trim()) {
      const url = branch.map_url.trim();
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      Linking.openURL(validUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.name + ' ' + branch.address)}`);
      });
      return;
    }

    if (branch.latitude && branch.longitude) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${branch.latitude},${branch.longitude}`;
      const label = encodeURIComponent(branch.name);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.name + ' ' + branch.address)}`);
        });
        return;
      }
    }

    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.name + ' ' + branch.address)}`);
  };

  const renderBranchItem = ({ item }: { item: Branch }) => {
    return (
      <View
        style={[
          styles.branchCard,
          item.can_order ? styles.branchCardOrdering : null,
        ]}
      >
        {/* Branch Image or Sleek Placeholder */}
        <View style={styles.imageBox}>
          {item.image ? (
            <OptimizedImage
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIconRing}>
                <Ionicons name="barbell-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.placeholderBranchTitle}>{item.name}</Text>
            </View>
          )}

          <View style={styles.badgeContainer}>
            {item.can_order ? (
              <View style={styles.onlineBadge}>
                <Ionicons name="radio" size={12} color={COLORS.white} />
                <Text style={styles.onlineBadgeText}>ONLINE ORDERING AVAILABLE</Text>
              </View>
            ) : (
              <View style={styles.storeOnlyBadge}>
                <Ionicons name="business-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.storeOnlyBadgeText}>STORE LOCATION ONLY</Text>
              </View>
            )}
          </View>
        </View>

        {/* Branch Info */}
        <View style={styles.cardContent}>
          <Text style={styles.branchName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.branchDesc}>{item.description}</Text>
          ) : null}

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>{item.address}</Text>
            </View>

            {item.phone && (
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.detailText, { color: COLORS.primaryLight }]}>{item.phone}</Text>
              </TouchableOpacity>
            )}

            {item.opening_hours && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{item.opening_hours}</Text>
              </View>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={16} color={COLORS.white} />
              <Text style={styles.directionsButtonText}>Get Directions on Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Store Locations & Hubs" showBack={true} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBranchItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  branchCardOrdering: {
    borderColor: COLORS.accentEmerald,
  },
  imageBox: {
    height: 160,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  placeholderIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderBranchTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentEmerald,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.primary,
  },
  onlineBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  storeOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 13, 20, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  storeOnlyBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  cardContent: {
    padding: SPACING.lg,
  },
  branchName: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  branchDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  detailsList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.md,
  },
  directionsButton: {
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  directionsButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
