import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/Header';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import mobileOrderService from '../../services/order.service';
import shopService from '../../services/shop.service';
import notificationService from '../../services/notification.service';
import { Branch, OrderType, PaymentMethod } from '../../types';

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { items, clearCart } = useCart();
  const { customer } = useAuth();

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone_number || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [mapUrl, setMapUrl] = useState('');
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [customMapInput, setCustomMapInput] = useState('');
  const [notes, setNotes] = useState('');
  const [orderingBranch, setOrderingBranch] = useState<Branch | null>(null);

  // Leaflet & OpenStreetMap interactive state
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 28.2096, // Pokhara default
    lng: 83.9856,
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 28.2096,
    lng: 83.9856,
  });

  const [preview, setPreview] = useState<{
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    can_place_order: boolean;
    stock_errors: string[];
  } | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // Fetch active ordering branch
  useEffect(() => {
    shopService
      .getOrderingBranch()
      .then(setOrderingBranch)
      .catch(console.error);
  }, []);

  // Recalculate price & stock preview from backend
  const loadCheckoutPreview = async () => {
    if (items.length === 0) return;
    try {
      setLoadingPreview(true);
      setError('');
      const data = await mobileOrderService.previewCheckout(
        items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        orderType
      );
      setPreview(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to calculate checkout total');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadCheckoutPreview();
  }, [orderType, items]);

  const handleGetCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Please grant location permissions to detect your delivery point.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const gMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      setMapUrl(gMapLink);
      setSelectedCoords({ lat: latitude, lng: longitude });
      setMapCenter({ lat: latitude, lng: longitude });

      // Attempt reverse geocoding to suggest text address
      try {
        const geoRes = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geoRes && geoRes.length > 0) {
          const place = geoRes[0];
          const formatted = [place.name, place.street, place.subregion, place.city, place.district]
            .filter(Boolean)
            .join(', ');
          if (formatted && (!address.trim() || address.length < 5)) {
            setAddress(formatted);
          }
        }
      } catch {}

      Alert.alert('GPS Location Locked', 'Your delivery coordinates have been attached!');
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Could not fetch current GPS location.');
    } finally {
      setLocating(false);
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_LOCATION') {
        setSelectedCoords({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    } catch {}
  };

  const handleLocateMeOnMap = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to locate yourself.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setSelectedCoords({ lat: latitude, lng: longitude });
      setMapCenter({ lat: latitude, lng: longitude });
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Could not fetch GPS location.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirmLeafletLocation = async () => {
    const gMapLink = `https://www.google.com/maps?q=${selectedCoords.lat.toFixed(6)},${selectedCoords.lng.toFixed(6)}`;
    setMapUrl(gMapLink);

    // Reverse geocode to suggest text address if empty or short
    try {
      const geoRes = await Location.reverseGeocodeAsync({
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
      });
      if (geoRes && geoRes.length > 0) {
        const place = geoRes[0];
        const formatted = [place.name, place.street, place.subregion, place.city, place.district]
          .filter(Boolean)
          .join(', ');
        if (formatted) {
          setAddress(formatted);
        }
      }
    } catch {}

    setShowMapModal(false);
    Alert.alert('Location Confirmed', 'Delivery pin locked on Leaflet & OpenStreetMap!');
  };

  const handleApplyCustomMapLink = () => {
    if (!customMapInput.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid Google Maps link or coordinates.');
      return;
    }
    setMapUrl(customMapInput.trim());
    setShowMapModal(false);
    setCustomMapInput('');
  };

  const handlePlaceOrder = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name');
      return;
    }

    if (orderType === 'DELIVERY' && (!address.trim() || address.trim().length < 3)) {
      setError('Please provide a valid delivery address');
      return;
    }

    if (preview?.stock_errors && preview.stock_errors.length > 0) {
      setError(preview.stock_errors[0]);
      return;
    }

    setPlacingOrder(true);
    try {
      const payment_method: PaymentMethod =
        orderType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH_ON_PICKUP';

      let fullAddress = address.trim();
      if (orderType === 'DELIVERY' && mapUrl.trim()) {
        fullAddress += `\n[Map Pin: ${mapUrl.trim()}]`;
      }

      const order = await mobileOrderService.placeOrder({
        order_type: orderType,
        payment_method,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        delivery_address: orderType === 'DELIVERY' ? fullAddress : undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
      });

      // Clear Cart on successful order
      clearCart();

      // Trigger native notification center notification
      try {
        await notificationService.showLocalNotification(
          'Order Placed Successfully',
          `Your order #${order.order_number || order.id} has been received. Preparing your package!`
        );
      } catch (notifyErr) {
        console.log('Local notification error:', notifyErr);
      }

      // Navigate to confirmation
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Main' },
          { name: 'OrderConfirmation', params: { order } },
        ],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatNPR = (val?: number) => `NPR ${Number(val || 0).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Order Checkout" showCart={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.accentRose} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        {/* 1. Select Order Type */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Fulfillment Option</Text>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.typeTab, orderType === 'DELIVERY' && styles.typeTabActive]}
              onPress={() => setOrderType('DELIVERY')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color={orderType === 'DELIVERY' ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.typeTabText, orderType === 'DELIVERY' && styles.typeTabTextActive]}>
                Home Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeTab, orderType === 'PICKUP' && styles.typeTabActive]}
              onPress={() => setOrderType('PICKUP')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={orderType === 'PICKUP' ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.typeTabText, orderType === 'PICKUP' && styles.typeTabTextActive]}>
                Store Pickup
              </Text>
            </TouchableOpacity>
          </View>

          {orderType === 'PICKUP' && orderingBranch && (
            <View style={styles.pickupBranchNotice}>
              <Ionicons name="location" size={16} color={COLORS.accentEmerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickupBranchTitle}>Pickup Center: {orderingBranch.name}</Text>
                <Text style={styles.pickupBranchAddress}>{orderingBranch.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 2. Customer & Delivery Address */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {orderType === 'DELIVERY' ? '2. Delivery & Contact Details' : '2. Contact Information'}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Recipient Full Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Suman Thapa"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Phone Number *</Text>
            <View style={[styles.inputContainer, styles.disabledContainer]}>
              <Ionicons name="call-outline" size={18} color={COLORS.accentEmerald} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={phone}
                editable={false}
              />
            </View>
          </View>

          {orderType === 'DELIVERY' && (
            <View style={styles.formGroup}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.label}>Delivery Address *</Text>
                <TouchableOpacity
                  style={styles.gpsAutoBtn}
                  onPress={handleGetCurrentLocation}
                  disabled={locating}
                  activeOpacity={0.7}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="navigate" size={13} color={COLORS.primary} />
                      <Text style={styles.gpsAutoBtnText}>Use My GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { height: 70 }]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.primary}
                  style={[styles.inputIcon, { marginTop: 4 }]}
                />
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Street, area, building name, landmark"
                  placeholderTextColor={COLORS.textMuted}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>

              {/* Map Selection Action Row */}
              <View style={styles.mapActionRow}>
                <TouchableOpacity
                  style={styles.mapPinSelectBtn}
                  onPress={() => setShowMapModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={15} color={COLORS.textPrimary} />
                  <Text style={styles.mapPinSelectBtnText}>
                    {mapUrl ? 'Change Map Pin' : 'Select / Pin on Map'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.openGMapExternalBtn}
                  onPress={() => Linking.openURL('https://www.google.com/maps')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.openGMapExternalText}>Open Google Maps</Text>
                </TouchableOpacity>
              </View>

              {/* Attached Map Pin Status */}
              {mapUrl ? (
                <View style={styles.mapPinAttachedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.accentEmerald} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.mapPinAttachedTitle}>Google Map Pin Attached</Text>
                    <Text style={styles.mapPinAttachedSub} numberOfLines={1}>
                      {mapUrl}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mapPinPreviewBtn}
                    onPress={() => Linking.openURL(mapUrl)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={15} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapPinRemoveBtn}
                    onPress={() => setMapUrl('')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Order Notes (Optional)</Text>
            <View style={[styles.inputContainer, { height: 60 }]}>
              <Ionicons
                name="clipboard-outline"
                size={18}
                color={COLORS.textMuted}
                style={[styles.inputIcon, { marginTop: 4 }]}
              />
              <TextInput
                style={[styles.textInput, { height: 50, textAlignVertical: 'top' }]}
                placeholder="Special delivery instructions or shake flavor..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>
        </View>

        {/* 3. Payment Method (Cash ONLY) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Payment Method</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.cashIconBadge}>
              <Ionicons name="cash" size={24} color={COLORS.accentEmerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentMethodTitle}>
                {orderType === 'DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash on Pickup'}
              </Text>
              <Text style={styles.paymentMethodSub}>
                Pay with cash directly when your order is delivered or picked up at the branch counter.
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.accentEmerald} />
          </View>
        </View>

        {/* 4. Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. Order Items ({items.length})</Text>
          <View style={styles.itemsSummaryList}>
            {items.map((it) => {
              const itemPrice = it.product.discount_price || it.product.price;
              return (
                <View key={it.product.id} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {it.quantity}x {it.product.name}
                  </Text>
                  <Text style={styles.summaryItemPrice}>{formatNPR(itemPrice * it.quantity)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.divider} />

          {loadingPreview ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.totalsContainer}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal:</Text>
                <Text style={styles.calcVal}>{formatNPR(preview?.subtotal)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Delivery Fee:</Text>
                <Text style={styles.calcVal}>{formatNPR(preview?.delivery_charge)}</Text>
              </View>
              <View style={[styles.calcRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total Amount (Cash):</Text>
                <Text style={styles.grandTotalVal}>{formatNPR(preview?.total_amount)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Place Order Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarTotalLabel}>Total Payable (Cash):</Text>
          <Text style={styles.bottomBarTotalValue}>{formatNPR(preview?.total_amount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, placingOrder && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          activeOpacity={0.85}
        >
          {placingOrder ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.placeOrderBtnText}>Place Order (Cash)</Text>
              <Ionicons name="checkmark-done" size={18} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

      {/* Interactive Leaflet & OpenStreetMap Location Modal */}
      <Modal
        visible={showMapModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.leafletModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="map" size={20} color={COLORS.primary} />
                <View>
                  <Text style={styles.modalTitle}>Pin Location on Map</Text>
                  <Text style={styles.modalSubtitleOSM}>
                    Leaflet | &copy; OpenStreetMap
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowMapModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Map Action Tools */}
            <View style={styles.mapToolRow}>
              <TouchableOpacity
                style={styles.mapGpsCenterBtn}
                onPress={handleLocateMeOnMap}
                disabled={locating}
                activeOpacity={0.8}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="navigate" size={13} color={COLORS.primary} />
                    <Text style={styles.mapGpsCenterBtnText}>Fly to My GPS</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.coordsBadge}>
                <Ionicons name="pin" size={12} color={COLORS.accentEmerald} />
                <Text style={styles.coordsBadgeText}>
                  {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Interactive Leaflet Map WebView */}
            <View style={styles.leafletMapWrapper}>
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #f8fafc; }
    .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .leaflet-popup-content-wrapper { border-radius: 8px; font-size: 12px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.15); }
    .leaflet-control-attribution { font-size: 10px; background: rgba(255, 255, 255, 0.9) !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var currentLat = ${mapCenter.lat};
    var currentLng = ${mapCenter.lng};
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([currentLat, currentLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://leafletjs.com/">Leaflet</a>',
      maxZoom: 19
    }).addTo(map);
    var marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
    marker.bindPopup("<b>Delivery Destination</b><br/>Tap or drag pin to your house").openPopup();
    function notifyPosition(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PIN_LOCATION', lat: lat, lng: lng }));
      }
    }
    marker.on('dragend', function(e) { var pos = marker.getLatLng(); notifyPosition(pos.lat, pos.lng); });
    map.on('click', function(e) { marker.setLatLng(e.latlng); marker.openPopup(); notifyPosition(e.latlng.lat, e.latlng.lng); });
  </script>
</body>
</html>`,
                }}
                onMessage={handleMapMessage}
                style={styles.leafletWebView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>

            <Text style={styles.leafletHint}>
              Tap anywhere on map or drag the pin. Delivery rider will navigate to this exact point.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowMapModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLeafletLocation}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={17} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.modalConfirmBtnText}>Confirm Delivery Pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 140,
    gap: SPACING.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentRose,
  },
  errorText: {
    color: COLORS.accentRose,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeTab: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeTabTextActive: {
    color: COLORS.white,
  },
  pickupBranchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: SPACING.md,
  },
  pickupBranchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentEmerald,
  },
  pickupBranchAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
  },
  disabledContainer: {
    backgroundColor: COLORS.surfaceBorder,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.accentEmerald,
  },
  cashIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  paymentMethodSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  itemsSummaryList: {
    gap: SPACING.xs,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.md,
  },
  totalsContainer: {
    gap: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.xs,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  bottomBarTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  placeOrderBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.primary,
  },
  placeOrderBtnDisabled: {
    opacity: 0.6,
  },
  placeOrderBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  addressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  gpsAutoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  mapPinSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  mapPinSelectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  openGMapExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  openGMapExternalText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  mapPinAttachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    marginTop: 8,
  },
  mapPinAttachedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentEmerald,
  },
  mapPinAttachedSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapPinPreviewBtn: {
    padding: 6,
    marginRight: 4,
  },
  mapPinRemoveBtn: {
    padding: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 12,
  },
  leafletModalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 8,
    maxHeight: '94%',
  },
  modalSubtitleOSM: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  mapToolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  mapGpsCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  mapGpsCenterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  coordsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  leafletMapWrapper: {
    height: 330,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.background,
  },
  leafletWebView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  leafletHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  modalOpenGMapBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
  },
  modalOpenGMapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalStepHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.md,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
