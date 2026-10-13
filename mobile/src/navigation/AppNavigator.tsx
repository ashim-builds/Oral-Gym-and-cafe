import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BRAND_LOGO_BASE64 } from '../constants/brandLogo';

// Customer Screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { PhoneInputScreen } from '../screens/auth/PhoneInputScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { CompleteProfileScreen } from '../screens/auth/CompleteProfileScreen';

import { HomeScreen } from '../screens/shop/HomeScreen';
import { ProductsScreen } from '../screens/shop/ProductsScreen';
import { SearchScreen } from '../screens/shop/SearchScreen';
import { ProductDetailScreen } from '../screens/shop/ProductDetailScreen';
import { AboutBusinessScreen } from '../screens/shop/AboutBusinessScreen';
import { OwnerProfileScreen } from '../screens/shop/OwnerProfileScreen';

import { BranchesScreen } from '../screens/branches/BranchesScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutScreen } from '../screens/cart/CheckoutScreen';
import { OrderConfirmationScreen } from '../screens/cart/OrderConfirmationScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

// Mobile Admin Screens
import {
  AdminLoginScreen,
  AdminDashboardScreen,
  AdminProductsScreen,
  AdminCategoriesScreen,
  AdminOrdersScreen,
  AdminBranchesScreen,
  AdminCustomersScreen,
  AdminBusinessOwnerScreen,
  AdminSettingsScreen,
} from '../screens/admin';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Middle Raised Curved Circle Cart Button (Merged with Navbar Top Line)
function MiddleCartTabButton() {
  const navigation = useNavigation<any>();
  const { itemCount } = useCart();

  return (
    <TouchableOpacity
      style={styles.middleCartBtnWrapper}
      onPress={() => navigation.navigate('Cart')}
      activeOpacity={0.85}
    >
      <View style={styles.middleCartCurveContainer}>
        <View style={styles.middleCartCircleBorder} />
        <View style={styles.middleCartBottomMask} />

        <Ionicons name="cart-outline" size={23} color="#0F172A" />
        {itemCount > 0 && (
          <View style={styles.middleCartBadge}>
            <Text style={styles.middleCartBadgeText}>
              {itemCount > 99 ? '99+' : itemCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.middleCartLabel}>Cart</Text>
    </TouchableOpacity>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 22) : insets.bottom ? insets.bottom + 12 : 20;
  const tabHeight = 66 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'BranchesTab') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ProductsTab" component={ProductsScreen} options={{ tabBarLabel: 'Products' }} />
      
      {/* Center Elevated Flat White Cart Button (Opens Full Screen Cart without Navbar) */}
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Cart');
          },
        })}
        options={{
          tabBarLabel: 'Cart',
          tabBarButton: () => <MiddleCartTabButton />,
        }}
      />

      <Tab.Screen name="BranchesTab" component={BranchesScreen} options={{ tabBarLabel: 'Branches' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}



// Authentication Sub-Stack
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <AuthStack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <AuthStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const { authState } = useAuth();

  if (authState === 'LOADING') {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={{ uri: BRAND_LOGO_BASE64 }}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <Text style={styles.loadingBrandText}>ORLA GYM & CAFE</Text>
        <Text style={styles.loadingTagline}>Strength. Health. Family. Legacy.</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const initialRouteName = authState === 'FIRST_TIME' ? 'Welcome' : 'Main';

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        <RootStack.Screen name="Main" component={MainTabs} />

        {/* Global Shop, Navigation & Checkout Aliases */}
        <RootStack.Screen name="Products" component={ProductsScreen} />
        <RootStack.Screen name="Search" component={SearchScreen} />
        <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <RootStack.Screen name="Cart" component={CartScreen} />
        <RootStack.Screen name="Checkout" component={CheckoutScreen} />
        <RootStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
        <RootStack.Screen name="OrdersTab" component={OrdersListScreen} />
        <RootStack.Screen name="Orders" component={OrdersListScreen} />
        <RootStack.Screen name="OrdersList" component={OrdersListScreen} />
        <RootStack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <RootStack.Screen name="AboutBusiness" component={AboutBusinessScreen} />
        <RootStack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
        <RootStack.Screen name="Branches" component={BranchesScreen} />
        <RootStack.Screen name="BranchesTab" component={BranchesScreen} />
        <RootStack.Screen name="Profile" component={ProfileScreen} />
        <RootStack.Screen name="ProfileTab" component={ProfileScreen} />
        <RootStack.Screen name="Notifications" component={NotificationsScreen} />

        {/* In-App Mobile Admin Panel Screens */}
        <RootStack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <RootStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <RootStack.Screen name="AdminProducts" component={AdminProductsScreen} />
        <RootStack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
        <RootStack.Screen name="AdminOrders" component={AdminOrdersScreen} />
        <RootStack.Screen name="AdminBranches" component={AdminBranchesScreen} />
        <RootStack.Screen name="AdminCustomers" component={AdminCustomersScreen} />
        <RootStack.Screen name="AdminBusinessOwner" component={AdminBusinessOwnerScreen} />
        <RootStack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.45)',
    marginBottom: 6,
  },
  loadingBrandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1.5,
  },
  loadingTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  middleCartBtnWrapper: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
  },
  middleCartCurveContainer: {
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  middleCartCircleBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  middleCartBottomMask: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: COLORS.surface,
  },
  middleCartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#0F172A',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  middleCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  middleCartLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
});
